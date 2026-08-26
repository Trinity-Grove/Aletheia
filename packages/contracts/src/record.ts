import { z } from 'zod';

export const masteryLevelSchema = z.enum([
  'NOT_STARTED',
  'EXPOSURE',
  'DEVELOPING',
  'WITH_ASSISTANCE',
  'AUTONOMOUS',
  'MASTERED',
]);

export type MasteryLevel = z.infer<typeof masteryLevelSchema>;

export const assessmentMethodSchema = z.enum([
  'OBSERVATION',
  'NARRATION',
  'EXERCISE',
  'WRITING',
  'PROJECT',
  'EXPERIMENT',
  'PRESENTATION',
  'TEST',
  'SELF_ASSESSMENT',
  'PRACTICAL_DEMONSTRATION',
]);

export type AssessmentMethod = z.infer<typeof assessmentMethodSchema>;

export const learningRecordTypeSchema = z.enum([
  'PLANNED_LESSON',
  'SPONTANEOUS_EXPERIENCE',
  'PROJECT_WORK',
  'READING_LOG',
  'HABIT_PRACTICE',
]);

export type LearningRecordType = z.infer<typeof learningRecordTypeSchema>;

export const createLearningRecordSchema = z.object({
  learnerId: z.string().uuid(),
  subjectId: z.string().uuid().nullish(),
  academicYearId: z.string().uuid().nullish(),
  lessonPlanId: z.string().uuid().nullish(),
  type: learningRecordTypeSchema.default('PLANNED_LESSON'),
  title: z.string().min(1).max(250),
  description: z.string().nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  durationMinutes: z.number().int().min(1).max(1440).nullish(),
  masteryLevel: masteryLevelSchema.default('DEVELOPING'),
  assessmentMethod: assessmentMethodSchema.default('OBSERVATION'),
  strengths: z.string().nullish(),
  areasForGrowth: z.string().nullish(),
  characterHabitGrowth: z.string().nullish(),
  notes: z.string().nullish(),
  objectiveIds: z.array(z.string().uuid()).default([]),
  evidenceItemIds: z.array(z.string().uuid()).default([]),
});

export type CreateLearningRecordDto = z.input<typeof createLearningRecordSchema>;
export type CreateLearningRecordOutput = z.output<typeof createLearningRecordSchema>;

export const updateLearningRecordSchema = createLearningRecordSchema.partial();
export type UpdateLearningRecordDto = z.infer<typeof updateLearningRecordSchema>;

export const learningRecordFilterSchema = z.object({
  learnerId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  type: learningRecordTypeSchema.optional(),
  masteryLevel: masteryLevelSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type LearningRecordFilterDto = z.infer<typeof learningRecordFilterSchema>;

export const learningRecordObjectiveResponseSchema = z.object({
  id: z.string().uuid(),
  learningRecordId: z.string().uuid(),
  objectiveId: z.string().uuid(),
  objectiveTitle: z.string().optional(),
  createdAt: z.string(),
});

export type LearningRecordObjectiveResponseDto = z.infer<
  typeof learningRecordObjectiveResponseSchema
>;

export const learningRecordResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  subjectColor: z.string().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  lessonPlanId: z.string().uuid().nullable().optional(),
  type: learningRecordTypeSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.string(),
  durationMinutes: z.number().int().nullable().optional(),
  masteryLevel: masteryLevelSchema,
  assessmentMethod: assessmentMethodSchema,
  strengths: z.string().nullable().optional(),
  areasForGrowth: z.string().nullable().optional(),
  characterHabitGrowth: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  objectives: z.array(learningRecordObjectiveResponseSchema).default([]),
  portfolioItemIds: z.array(z.string().uuid()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LearningRecordResponseDto = z.infer<typeof learningRecordResponseSchema>;

export const masteryDistributionSchema = z.record(masteryLevelSchema, z.number().int());

export type MasteryDistributionDto = z.infer<typeof masteryDistributionSchema>;

export const learnerProgressSummarySchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  totalRecordsCount: z.number().int(),
  totalMinutesSpent: z.number().int(),
  masteryDistribution: masteryDistributionSchema,
  recordsByType: z.record(learningRecordTypeSchema, z.number().int()),
  recentMilestones: z.array(learningRecordResponseSchema).default([]),
});

export type LearnerProgressSummaryDto = z.infer<typeof learnerProgressSummarySchema>;
