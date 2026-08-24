import { z } from 'zod';

export const educationalStageSchema = z.enum([
  'EARLY_YEARS',
  'PRIMARY_GRAMMAR',
  'MIDDLE_LOGIC',
  'HIGH_RHETORIC',
  'OTHER',
]);

export type EducationalStage = z.infer<typeof educationalStageSchema>;

export const createLearnerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).nullish(),
  preferredName: z.string().max(100).nullish(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be in YYYY-MM-DD format'),
  stage: educationalStageSchema.default('PRIMARY_GRAMMAR'),
  customGrade: z.string().nullish(),
  avatarColor: z.string().nullish(),
  specialNeeds: z.string().nullish(),
  notes: z.string().nullish(),
});

export type CreateLearnerDto = z.input<typeof createLearnerSchema>;
export type CreateLearnerOutput = z.output<typeof createLearnerSchema>;

export const updateLearnerSchema = createLearnerSchema.partial();

export type UpdateLearnerDto = z.infer<typeof updateLearnerSchema>;

export const learnerResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).nullable().optional(),
  preferredName: z.string().max(100).nullable().optional(),
  birthDate: z.string(),
  stage: educationalStageSchema,
  customGrade: z.string().nullable().optional(),
  avatarColor: z.string().nullable().optional(),
  specialNeeds: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LearnerResponseDto = z.infer<typeof learnerResponseSchema>;

export const learnerSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
  preferredName: z.string().nullable().optional(),
  stage: educationalStageSchema,
  avatarColor: z.string().nullable().optional(),
});

export type LearnerSummaryDto = z.infer<typeof learnerSummarySchema>;

