import { z } from 'zod';

export const learnerCompetencyAchievementReviewResponseSchema = z.object({
  id: z.string().uuid(),
  achievementId: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  evidenceSubmissionId: z.string().uuid(),
  reviewedByUserId: z.string().uuid(),
  reason: z.literal('EVIDENCE_REJECTED'),
  createdAt: z.string().datetime(),
});

// All contributing prerequisites are flattened into this immutable snapshot.
export const achievementEvidenceSnapshotSchema = z.object({
  evidenceSubmissionIds: z.array(z.string().uuid()).min(1),
  rubricAssessment: z.object({
    assessmentResultId: z.string().uuid(),
    rubricDefinitionId: z.string().uuid(),
    rubricVersion: z.number().int().positive(),
    assessorUserId: z.string().uuid().nullable(),
    assessedAt: z.string().datetime(),
    scores: z.array(z.object({ rubricCriterionId: z.string().uuid(), score: z.number() }).strict()),
  }).strict().optional(),
  approval: z.object({
    approvalEventId: z.string().uuid(),
    decision: z.literal('APPROVED'),
    decidedByUserId: z.string().uuid(),
    decidedAt: z.string().datetime(),
  }).strict().optional(),
  prerequisites: z.array(z.object({
    competencyDefinitionId: z.string().uuid(),
    competencyVersion: z.number().int().positive(),
    progressionPolicyId: z.string().uuid(),
    policyVersion: z.number().int().positive(),
    validatedEvidenceCount: z.number().int().positive(),
    minimumEvidenceCount: z.number().int().positive(),
    evidenceSubmissionIds: z.array(z.string().uuid()).min(1),
    state: z.literal('MASTERED'),
    rubricAssessment: z.object({
      assessmentResultId: z.string().uuid(), rubricDefinitionId: z.string().uuid(), rubricVersion: z.number().int().positive(),
      assessorUserId: z.string().uuid().nullable(), assessedAt: z.string().datetime(),
      scores: z.array(z.object({ rubricCriterionId: z.string().uuid(), score: z.number() }).strict()),
    }).strict().optional(),
    approval: z.object({ approvalEventId: z.string().uuid(), decision: z.literal('APPROVED'), decidedByUserId: z.string().uuid(), decidedAt: z.string().datetime() }).strict().optional(),
  }).strict()),
}).strict();

export const learnerCompetencyAchievementResponseSchema = z.object({
  id: z.string().uuid(),
  trackingId: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  competencyDefinitionId: z.string().uuid(),
  competencyVersion: z.number().int().positive(),
  curriculumDefinitionId: z.string().uuid().nullable(),
  curriculumVersion: z.number().int().positive().nullable(),
  progressionPolicyId: z.string().uuid(),
  policyVersion: z.number().int().positive(),
  validatedEvidenceCount: z.number().int().positive(),
  minimumEvidenceCount: z.number().int().positive(),
  evidenceSnapshot: achievementEvidenceSnapshotSchema,
  awardedByUserId: z.string().uuid(),
  achievedAt: z.string().datetime(),
  reviews: z.array(learnerCompetencyAchievementReviewResponseSchema).optional(),
});

export type AchievementEvidenceSnapshot = z.infer<typeof achievementEvidenceSnapshotSchema>;
export type LearnerCompetencyAchievementResponseDto = z.infer<typeof learnerCompetencyAchievementResponseSchema>;
export type LearnerCompetencyAchievementReviewResponseDto = z.infer<typeof learnerCompetencyAchievementReviewResponseSchema>;
