import { z } from 'zod';

// --- Learner competency tracking (Aletheia issue #126 item 3) ---
//
// This closes the real gap the task identified: applying a curriculum to
// a learner used to mean CurriculumService.applyTemplate creating
// old-style Subject/LearningObjective rows, even when the resolved
// pedagogical model was catalog-based -- nothing in the live product
// actually produced CompetencyDefinition-linked data. Activating a
// CurriculumDefinition for a learner fans out over that curriculum's
// CurriculumDefinitionCompetency joins and creates one
// LearnerCompetencyTracking row per competency, snapshotting the exact
// competency version referenced (same discipline as
// EvidenceSubmissionCompetency/AssessmentResult) so a later competency
// version bump never retroactively changes what a learner was assigned.
//
// This is USER DATA (a family's per-learner working set), not a
// Definition/Version catalog table itself -- contrast with
// CurriculumDefinition/CompetencyDefinition, which are the platform's
// shared catalogs this table points into.

export const learnerCompetencyTrackingStatusSchema = z.enum(['ACTIVE', 'RETIRED']);
export type LearnerCompetencyTrackingStatus = z.infer<typeof learnerCompetencyTrackingStatusSchema>;

export const activateCurriculumForLearnerSchema = z.object({
  learnerId: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  progressionPolicyId: z.string().uuid().optional(),
});

export type ActivateCurriculumForLearnerDto = z.infer<typeof activateCurriculumForLearnerSchema>;

// Denormalized, read-time-joined display fields -- not stored on the
// tracking row itself. Safe to join at read time because a
// CompetencyDefinition row is immutable once created (Definition/Version
// pattern: a change creates a new row, never mutates the one a tracking
// row's competencyDefinitionId points at).
export const learnerCompetencyTrackingCompetencySchema = z.object({
  code: z.string(),
  title: z.string(),
  domainId: z.string().uuid(),
  domainTitle: z.string(),
});

export const learnerCompetencyTrackingResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  competencyDefinitionId: z.string().uuid(),
  competencyVersion: z.number().int(),
  curriculumDefinitionId: z.string().uuid().nullable().optional(),
  progressionPolicyId: z.string().uuid().nullable().optional(),
  policyVersion: z.number().int().positive().nullable().optional(),
  status: learnerCompetencyTrackingStatusSchema,
  activatedAt: z.string(),
  retiredAt: z.string().nullable().optional(),
  createdAt: z.string(),
  competency: learnerCompetencyTrackingCompetencySchema,
});

export type LearnerCompetencyTrackingResponseDto = z.infer<typeof learnerCompetencyTrackingResponseSchema>;

// Result of activating a curriculum: reports what was actually created
// vs. already-active (activation is idempotent -- re-activating the same
// curriculum for the same learner doesn't duplicate tracking rows, since
// the unique constraint is on [learnerId, competencyDefinitionId,
// competencyVersion]).
export const activateCurriculumForLearnerResultSchema = z.object({
  createdCount: z.number().int(),
  alreadyActiveCount: z.number().int(),
  trackings: z.array(learnerCompetencyTrackingResponseSchema),
});

export type ActivateCurriculumForLearnerResultDto = z.infer<
  typeof activateCurriculumForLearnerResultSchema
>;
