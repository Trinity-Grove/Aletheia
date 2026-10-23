import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

export const upsertLearnerLearningPathSelectionSchema = z.object({
  enabled: z.boolean(),
});

export type UpsertLearnerLearningPathSelectionDto = z.infer<typeof upsertLearnerLearningPathSelectionSchema>;

export const learnerLearningPathSelectionPathSchema = z.object({
  code: z.string(),
  name: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
});

export const learnerLearningPathSelectionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  pathId: z.string().uuid(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  path: learnerLearningPathSelectionPathSchema,
});

export type LearnerLearningPathSelectionResponseDto = z.infer<typeof learnerLearningPathSelectionResponseSchema>;
