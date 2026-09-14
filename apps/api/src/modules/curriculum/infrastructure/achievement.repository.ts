import { Injectable } from '@nestjs/common';
import { Prisma, type LearnerCompetencyAchievement, type LearnerCompetencyAchievementReview } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { evaluateProgression, type ProgressionReader, type ProgressionTracking } from '../application/progression.service.js';
import type { AchievementEvidenceSnapshot } from '@aletheia/contracts';
import { evidenceCountRulesSchema } from '@aletheia/contracts';

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
    for (const row of rows) await this.validateAndReconcile(familyId, row.id, 'VALIDATED', actorId);
  }

  async validateAndReconcile(familyId: string, evidenceId: string, status: 'VALIDATED' | 'REJECTED', actorId: string): Promise<ValidationReconciliationResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.evidenceSubmission.findFirst({ where: { id: evidenceId, familyId }, include: { competencies: true } });
      if (!current) return null;
      await tx.$queryRaw`SELECT id FROM learners WHERE id = ${current.learnerId}::uuid AND family_id = ${familyId}::uuid FOR UPDATE`;
      const evidence = await tx.evidenceSubmission.update({
        where: { id: evidenceId },
        data: { validationStatus: status, validatedByUserId: actorId, validatedAt: new Date() },
        include: { competencies: true },
      });

      const trackings = await tx.learnerCompetencyTracking.findMany({ where: { familyId, learnerId: current.learnerId, progressionPolicyId: { not: null } } });
      const achievements: LearnerCompetencyAchievement[] = [];
      const reviews: LearnerCompetencyAchievementReview[] = [];
      const reader: ProgressionReader = {
        learnerExists: async (f, learnerId) => !!await tx.learner.findFirst({ where: { id: learnerId, familyId: f }, select: { id: true } }),
        tracking: async (f, id) => await tx.learnerCompetencyTracking.findFirst({ where: { id, familyId: f, learner: { familyId: f } } }) as ProgressionTracking | null,
        trackingForCompetency: async (f, learnerId, competencyId) => await tx.learnerCompetencyTracking.findFirst({ where: { familyId: f, learnerId, competencyDefinitionId: competencyId }, orderBy: { competencyVersion: 'desc' } }) as ProgressionTracking | null,
        competency: (id) => tx.competencyDefinition.findUnique({ where: { id } }),
        policy: (id) => tx.progressionPolicy.findUnique({ where: { id } }),
        curriculumContains: async (curriculumId, competencyId) => !!await tx.curriculumDefinitionCompetency.findFirst({ where: { curriculumDefinitionId: curriculumId, competencyId, curriculumDefinition: { status: { in: ['PUBLISHED', 'DEPRECATED', 'ARCHIVED'] }, schemaVersion: '1.0.0' } }, select: { id: true } }),
        evidenceCount: (f, learnerId, competencyId, version) => tx.evidenceSubmission.count({ where: { familyId: f, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId: competencyId, competencyVersion: version } } } }),
        trackingPolicy: async (f, trackingId) => {
          const row = await tx.learnerCompetencyTracking.findFirst({ where: { id: trackingId, familyId: f }, select: { progressionPolicyId: true, policyVersion: true } });
          return row?.progressionPolicyId && row.policyVersion ? { id: row.progressionPolicyId, version: row.policyVersion } : null;
        },
      };

      for (const tracking of trackings) {
        if (!tracking.progressionPolicyId || !tracking.policyVersion) continue;
        try {
          const result = await evaluateProgression(reader, familyId, { trackingId: tracking.id, policyId: tracking.progressionPolicyId });
          if (result.state !== 'MASTERED') continue;
          const evidenceSnapshot = await this.snapshot(tx, familyId, result, reader);
          const curriculum = tracking.curriculumDefinitionId ? await tx.curriculumDefinition.findUnique({ where: { id: tracking.curriculumDefinitionId }, select: { version: true } }) : null;
          const created = await tx.learnerCompetencyAchievement.createMany({
            data: [{ trackingId: tracking.id, familyId, learnerId: tracking.learnerId, competencyDefinitionId: tracking.competencyDefinitionId, competencyVersion: tracking.competencyVersion, curriculumDefinitionId: tracking.curriculumDefinitionId, curriculumVersion: curriculum?.version ?? null, progressionPolicyId: tracking.progressionPolicyId, policyVersion: tracking.policyVersion, validatedEvidenceCount: result.validatedEvidenceCount, minimumEvidenceCount: result.minimumEvidenceCount, evidenceSnapshot: evidenceSnapshot as unknown as Prisma.InputJsonValue, awardedByUserId: actorId }],
            skipDuplicates: true,
          });
          if (created.count) {
            const award = await tx.learnerCompetencyAchievement.findUniqueOrThrow({ where: { trackingId: tracking.id } });
            achievements.push(award);
          }
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

  private async snapshot(tx: Prisma.TransactionClient, familyId: string, result: Awaited<ReturnType<typeof evaluateProgression>>, reader: ProgressionReader): Promise<AchievementEvidenceSnapshot> {
    const ids = await tx.evidenceSubmission.findMany({ where: { familyId, learnerId: result.learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId: result.competencyDefinitionId, competencyVersion: result.competencyVersion } } }, select: { id: true } });
    const prerequisites = await this.collectPrerequisites(tx, familyId, result.learnerId, result, reader, new Set());
    return { evidenceSubmissionIds: ids.map((e) => e.id), prerequisites };
  }

  private async collectPrerequisites(tx: Prisma.TransactionClient, familyId: string, learnerId: string, result: Awaited<ReturnType<typeof evaluateProgression>>, reader: ProgressionReader, seen: Set<string>): Promise<AchievementEvidenceSnapshot['prerequisites']> {
    const policy = await tx.progressionPolicy.findUnique({ where: { id: result.policyId } });
    const parsed = policy ? evidenceCountRulesSchema.safeParse(policy.rules) : null;
    if (!parsed?.success) return [];
    const output: AchievementEvidenceSnapshot['prerequisites'] = [];
    for (const prerequisite of parsed.data.prerequisites) {
      const prerequisiteTracking = await reader.trackingForCompetency(familyId, learnerId, prerequisite.competencyDefinitionId);
      if (!prerequisiteTracking || seen.has(prerequisiteTracking.id)) continue;
      seen.add(prerequisiteTracking.id);
      try {
        const evaluated = await evaluateProgression(reader, familyId, { trackingId: prerequisiteTracking.id, policyId: prerequisite.policyId });
        if (evaluated.state !== 'MASTERED') continue;
        const evidence = await tx.evidenceSubmission.findMany({ where: { familyId, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId: evaluated.competencyDefinitionId, competencyVersion: evaluated.competencyVersion } } }, select: { id: true } });
        output.push({ competencyDefinitionId: evaluated.competencyDefinitionId, competencyVersion: evaluated.competencyVersion, progressionPolicyId: evaluated.policyId, policyVersion: evaluated.policyVersion, validatedEvidenceCount: evaluated.validatedEvidenceCount, minimumEvidenceCount: evaluated.minimumEvidenceCount, evidenceSubmissionIds: evidence.map((e) => e.id), state: 'MASTERED' });
        output.push(...await this.collectPrerequisites(tx, familyId, learnerId, evaluated, reader, seen));
      } catch {
        // The award itself was already proven mastered; a malformed optional
        // prerequisite graph is recorded only if it evaluates successfully.
      }
    }
    return output;
  }

  listAchievements(familyId: string, learnerId?: string): Promise<LearnerCompetencyAchievement[]> {
    return this.prisma.learnerCompetencyAchievement.findMany({ where: { familyId, ...(learnerId ? { learnerId } : {}) }, orderBy: { achievedAt: 'desc' } });
  }
}
