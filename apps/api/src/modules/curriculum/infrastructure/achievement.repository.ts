import { Injectable } from '@nestjs/common';
import { Prisma, type LearnerCompetencyAchievement, type LearnerCompetencyAchievementReview } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { evaluateProgression, parseProgressionPolicyRules, type ProgressionReader } from '../application/progression.service.js';
import { createPrismaProgressionReader, latestEffectiveProgressionApproval, progressionApprovalOptions } from './prisma-progression-reader.js';
import type { AchievementEvidenceSnapshot } from '@aletheia/contracts';

type EvidenceRow = { id: string; familyId: string; learnerId: string; validationStatus: string; validatedByUserId: string | null; validatedAt: Date | null; competencies: { competencyDefinitionId: string; competencyVersion: number }[] };

export interface ValidationReconciliationResult {
  evidence: EvidenceRow;
  achievements: LearnerCompetencyAchievement[];
  reviews: LearnerCompetencyAchievementReview[];
}

@Injectable()
export class AchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reconcileValidatedEvidence(familyId: string, learnerId: string, actorId: string): Promise<void> {
    const rows = await this.prisma.evidenceSubmission.findMany({ where: { familyId, learnerId, validationStatus: 'VALIDATED' }, select: { id: true } });
    for (const row of rows) await this.validateAndReconcile(familyId, row.id, 'VALIDATED', actorId, false);
  }

  async validateAndReconcile(familyId: string, evidenceId: string, status: 'VALIDATED' | 'REJECTED', actorId: string, updateStatus = true): Promise<ValidationReconciliationResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.evidenceSubmission.findFirst({ where: { id: evidenceId, familyId }, include: { competencies: true } });
      if (!current) return null;
      const lockedLearner = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM learners WHERE id = ${current.learnerId}::uuid AND family_id = ${familyId}::uuid FOR UPDATE`;
      if (!lockedLearner.length) return null;
      if (!updateStatus && current.validationStatus !== 'VALIDATED') return null;
      const evidence = updateStatus ? await tx.evidenceSubmission.update({
        where: { id: evidenceId },
        data: { validationStatus: status, validatedByUserId: actorId, validatedAt: new Date() },
        include: { competencies: true },
      }) : current;

      const trackings = await tx.learnerCompetencyTracking.findMany({ where: { familyId, learnerId: current.learnerId, progressionPolicyId: { not: null } } });
      const achievements: LearnerCompetencyAchievement[] = [];
      const reviews: LearnerCompetencyAchievementReview[] = [];
      const reader = createPrismaProgressionReader(tx, true);

      for (const tracking of trackings) {
        if (!tracking.progressionPolicyId || !tracking.policyVersion) continue;
        try {
          const result = await evaluateProgression(reader, familyId, { trackingId: tracking.id, policyId: tracking.progressionPolicyId }, progressionApprovalOptions(reader, familyId));
          if (result.state !== 'MASTERED') continue;
          const award = await this.createAchievementWithinTransaction(tx, familyId, actorId, result, reader);
          if (award) achievements.push(award);
        } catch (error) {
          // A malformed policy graph is configuration data for one tracking;
          // it must not prevent a human from recording this validation.
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) && !(error instanceof Error && error.name === 'QueryError')) continue;
          throw error;
        }
      }

      if (status === 'REJECTED') {
        const priorAwards = await tx.learnerCompetencyAchievement.findMany({ where: { familyId, learnerId: current.learnerId } });
        for (const award of priorAwards) {
          const snapshot = award.evidenceSnapshot as unknown as AchievementEvidenceSnapshot;
          if (!snapshot.evidenceSubmissionIds.includes(evidenceId) && !snapshot.prerequisites.some((p) => p.evidenceSubmissionIds.includes(evidenceId))) continue;
          const created = await tx.learnerCompetencyAchievementReview.createMany({ data: [{ achievementId: award.id, familyId, learnerId: current.learnerId, evidenceSubmissionId: evidenceId, reviewedByUserId: actorId }], skipDuplicates: true });
          if (created.count) reviews.push(await tx.learnerCompetencyAchievementReview.findUniqueOrThrow({ where: { achievementId_evidenceSubmissionId: { achievementId: award.id, evidenceSubmissionId: evidenceId } } }));
        }
      }
      return { evidence, achievements, reviews };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 });
  }

  async createAchievementWithinTransaction(tx: Prisma.TransactionClient, familyId: string, actorId: string, result: Awaited<ReturnType<typeof evaluateProgression>>, reader: ProgressionReader, approvalEvent?: { id: string; actorUserId: string; createdAt: Date; decision: 'APPROVED' }): Promise<LearnerCompetencyAchievement | null> {
    const tracking = await tx.learnerCompetencyTracking.findFirst({ where: { id: result.trackingId, familyId } });
    if (!tracking?.progressionPolicyId || !tracking.policyVersion) return null;
    const evidenceSnapshot = await this.snapshot(tx, familyId, result, reader, approvalEvent);
    const curriculum = tracking.curriculumDefinitionId ? await tx.curriculumDefinition.findUnique({ where: { id: tracking.curriculumDefinitionId }, select: { version: true } }) : null;
    const created = await tx.learnerCompetencyAchievement.createMany({
      data: [{ trackingId: tracking.id, familyId, learnerId: tracking.learnerId, competencyDefinitionId: tracking.competencyDefinitionId, competencyVersion: tracking.competencyVersion, curriculumDefinitionId: tracking.curriculumDefinitionId, curriculumVersion: curriculum?.version ?? null, progressionPolicyId: tracking.progressionPolicyId, policyVersion: tracking.policyVersion, validatedEvidenceCount: result.validatedEvidenceCount, minimumEvidenceCount: result.minimumEvidenceCount, evidenceSnapshot: evidenceSnapshot as unknown as Prisma.InputJsonValue, awardedByUserId: actorId }],
      skipDuplicates: true,
    });
    return created.count ? tx.learnerCompetencyAchievement.findUniqueOrThrow({ where: { trackingId: tracking.id } }) : null;
  }

  private async snapshot(tx: Prisma.TransactionClient, familyId: string, result: Awaited<ReturnType<typeof evaluateProgression>>, reader: ProgressionReader, approvalEvent?: { id: string; actorUserId: string; createdAt: Date; decision: 'APPROVED' }, includePrerequisites = true): Promise<AchievementEvidenceSnapshot> {
    const ids = await tx.evidenceSubmission.findMany({ where: { familyId, learnerId: result.learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId: result.competencyDefinitionId, competencyVersion: result.competencyVersion } } }, select: { id: true } });
    const prerequisites = includePrerequisites ? await this.collectPrerequisites(tx, familyId, result.learnerId, result, reader, new Set()) : [];
    const policy = await tx.progressionPolicy.findUnique({ where: { id: result.policyId } });
    let rubricAssessment: AchievementEvidenceSnapshot['rubricAssessment'];
    if (policy) {
      const rules = parseProgressionPolicyRules(policy as Parameters<typeof parseProgressionPolicyRules>[0]);
      if ('rubricDefinitionId' in rules) {
        const assessment = await reader.latestAssessmentResult(familyId, result.learnerId, rules.rubricDefinitionId, rules.rubricVersion);
        if (assessment?.id) rubricAssessment = { assessmentResultId: assessment.id, rubricDefinitionId: rules.rubricDefinitionId, rubricVersion: rules.rubricVersion, assessorUserId: assessment.assessorUserId ?? null, assessedAt: assessment.createdAt.toISOString(), scores: assessment.scores };
      }
    }
    const effectiveApproval = approvalEvent ?? await latestEffectiveProgressionApproval(reader, familyId, result.trackingId);
    return { evidenceSubmissionIds: ids.map((e) => e.id), prerequisites,
      ...(rubricAssessment ? { rubricAssessment } : {}),
      ...(effectiveApproval?.decision === 'APPROVED' ? { approval: { approvalEventId: effectiveApproval.id, decision: 'APPROVED' as const, decidedByUserId: effectiveApproval.actorUserId, decidedAt: effectiveApproval.createdAt.toISOString() } } : {}),
    };
  }

  private async collectPrerequisites(tx: Prisma.TransactionClient, familyId: string, learnerId: string, result: Awaited<ReturnType<typeof evaluateProgression>>, reader: ProgressionReader, seen: Set<string>): Promise<AchievementEvidenceSnapshot['prerequisites']> {
    const policy = await tx.progressionPolicy.findUnique({ where: { id: result.policyId } });
    if (!policy) return [];
    let parsed: ReturnType<typeof parseProgressionPolicyRules>;
    try { parsed = parseProgressionPolicyRules(policy as Parameters<typeof parseProgressionPolicyRules>[0]); } catch { return []; }
    const output: AchievementEvidenceSnapshot['prerequisites'] = [];
    for (const prerequisite of parsed.prerequisites) {
      const prerequisiteTracking = await reader.trackingForCompetency(familyId, learnerId, prerequisite.competencyDefinitionId);
      if (!prerequisiteTracking || seen.has(prerequisiteTracking.id)) continue;
      seen.add(prerequisiteTracking.id);
      try {
        const evaluated = await evaluateProgression(reader, familyId, { trackingId: prerequisiteTracking.id, policyId: prerequisite.policyId }, progressionApprovalOptions(reader, familyId));
        if (evaluated.state !== 'MASTERED') continue;
        const evidence = await tx.evidenceSubmission.findMany({ where: { familyId, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId: evaluated.competencyDefinitionId, competencyVersion: evaluated.competencyVersion } } }, select: { id: true } });
        const nested = await this.snapshot(tx, familyId, evaluated, reader, undefined, false);
        output.push({ competencyDefinitionId: evaluated.competencyDefinitionId, competencyVersion: evaluated.competencyVersion, progressionPolicyId: evaluated.policyId, policyVersion: evaluated.policyVersion, validatedEvidenceCount: evaluated.validatedEvidenceCount, minimumEvidenceCount: evaluated.minimumEvidenceCount, evidenceSubmissionIds: evidence.map((e) => e.id), state: 'MASTERED', ...(nested.rubricAssessment ? { rubricAssessment: nested.rubricAssessment } : {}), ...(nested.approval ? { approval: nested.approval } : {}) });
        output.push(...await this.collectPrerequisites(tx, familyId, learnerId, evaluated, reader, seen));
      } catch {
        // The award itself was already proven mastered; a malformed optional
        // prerequisite graph is recorded only if it evaluates successfully.
      }
    }
    return output;
  }

  listAchievements(familyId: string, learnerId?: string): Promise<LearnerCompetencyAchievement[]> {
    return this.prisma.learnerCompetencyAchievement.findMany({ where: { familyId, ...(learnerId ? { learnerId } : {}) }, include: { reviews: true }, orderBy: { achievedAt: 'desc' } }) as unknown as Promise<LearnerCompetencyAchievement[]>;
  }
}
