import type { Prisma } from '@prisma/client';
import type { ProgressionReader } from '../application/progression.service.js';

export function createPrismaProgressionReader(tx: Prisma.TransactionClient, requireTrackingPolicyBinding = false): ProgressionReader {
  return {
    requireTrackingPolicyBinding,
    learnerExists: async (familyId, id) => !!await tx.learner.findFirst({ where: { id, familyId }, select: { id: true } }),
    tracking: (familyId, id) => tx.learnerCompetencyTracking.findFirst({ where: { id, familyId, learner: { familyId } } }),
    trackingForCompetency: (familyId, learnerId, competencyDefinitionId) => tx.learnerCompetencyTracking.findFirst({
      where: { familyId, learnerId, competencyDefinitionId, learner: { familyId } }, orderBy: { competencyVersion: 'desc' },
    }),
    competency: (id) => tx.competencyDefinition.findUnique({ where: { id } }),
    policy: (id) => tx.progressionPolicy.findUnique({ where: { id } }),
    curriculumContains: async (curriculumDefinitionId, competencyId) => !!await tx.curriculumDefinitionCompetency.findFirst({
      where: { curriculumDefinitionId, competencyId, curriculumDefinition: { status: { in: ['PUBLISHED', 'DEPRECATED', 'ARCHIVED'] }, schemaVersion: '1.0.0' } }, select: { id: true },
    }),
    evidenceCount: (familyId, learnerId, competencyDefinitionId, competencyVersion) => tx.evidenceSubmission.count({
      where: { familyId, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId, competencyVersion } } },
    }),
    latestValidatedEvidenceAt: async (familyId, learnerId, competencyDefinitionId, competencyVersion) => {
      const evidence = await tx.evidenceSubmission.findFirst({
        where: { familyId, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId, competencyVersion } } },
        orderBy: [{ validatedAt: 'desc' }, { id: 'desc' }], select: { validatedAt: true },
      });
      return evidence?.validatedAt ?? null;
    },
    rubricDefinition: async (id) => tx.rubricDefinition.findUnique({ where: { id }, select: { id: true, version: true, status: true, schemaVersion: true, criteria: { select: { id: true, scaleMin: true, scaleMax: true } } } }),
    latestAssessmentResult: async (familyId, learnerId, rubricDefinitionId, rubricVersion) => tx.assessmentResult.findFirst({
      where: { familyId, learnerId, rubricDefinitionId, rubricVersion }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, createdAt: true, assessorUserId: true, scores: { select: { rubricCriterionId: true, score: true } } },
    }),
    latestApprovalEventForTracking: async (familyId, trackingId) => tx.learnerCompetencyApprovalEvent.findFirst({
      where: { familyId, trackingId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, learnerId: true, competencyDefinitionId: true, competencyVersion: true, progressionPolicyId: true, policyVersion: true, decision: true, actorUserId: true, createdAt: true },
    }) as Promise<{ id: string; learnerId: string; competencyDefinitionId: string; competencyVersion: number; progressionPolicyId: string; policyVersion: number; decision: 'APPROVED' | 'RETURNED'; actorUserId: string; createdAt: Date } | null>,
    trackingPolicy: async (familyId, trackingId) => {
      const row = await tx.learnerCompetencyTracking.findFirst({ where: { id: trackingId, familyId }, select: { progressionPolicyId: true, policyVersion: true } });
      return row?.progressionPolicyId && row.policyVersion ? { id: row.progressionPolicyId, version: row.policyVersion } : null;
    },
  };
}

export async function latestEffectiveProgressionApproval(reader: ProgressionReader, familyId: string, trackingId: string) {
  const event = await reader.latestApprovalEventForTracking?.(familyId, trackingId) ?? null;
  if (!event) return null;
  const tracking = await reader.tracking(familyId, trackingId);
  const binding = await reader.trackingPolicy?.(familyId, trackingId);
  return tracking && binding && event.learnerId === tracking.learnerId &&
    event.competencyDefinitionId === tracking.competencyDefinitionId && event.competencyVersion === tracking.competencyVersion &&
    event.progressionPolicyId === binding.id && event.policyVersion === binding.version ? event : null;
}

export function progressionApprovalOptions(reader: ProgressionReader, familyId: string) {
  const latest = (trackingId: string) => latestEffectiveProgressionApproval(reader, familyId, trackingId);
  return {
    approvalGrantedForTracking: async (trackingId: string) => (await latest(trackingId))?.decision === 'APPROVED',
    approvalEligibleForTracking: async (trackingId: string) => {
      const event = await latest(trackingId);
      if (!event || event.decision !== 'RETURNED') return true;
      const tracking = await reader.tracking(familyId, trackingId);
      if (!tracking) return false;
      const evidenceAt = await reader.latestValidatedEvidenceAt?.(familyId, tracking.learnerId, tracking.competencyDefinitionId, tracking.competencyVersion) ?? null;
      if (evidenceAt && evidenceAt > event.createdAt) return true;
      const pinned = await reader.trackingPolicy?.(familyId, trackingId);
      const policy = await reader.policy(pinned?.id ?? '');
      if (!policy || policy.policyType !== 'EVIDENCE_RUBRIC' || typeof policy.rules !== 'object' || !policy.rules) return false;
      const rules = policy.rules as { rubricDefinitionId?: string; rubricVersion?: number };
      if (!rules.rubricDefinitionId || !rules.rubricVersion) return false;
      const assessment = await reader.latestAssessmentResult(familyId, tracking.learnerId, rules.rubricDefinitionId, rules.rubricVersion);
      return !!assessment && assessment.createdAt > event.createdAt;
    },
  };
}
