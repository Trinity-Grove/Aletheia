import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

export const upsertFamilyLearningPathSelectionSchema = z.object({
  enabled: z.boolean(),
});

export type UpsertFamilyLearningPathSelectionDto = z.infer<typeof upsertFamilyLearningPathSelectionSchema>;

export const familyLearningPathSelectionPathSchema = z.object({
  code: z.string(),
  name: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
});

export const familyLearningPathSelectionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  pathId: z.string().uuid(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  path: familyLearningPathSelectionPathSchema,
});

export type FamilyLearningPathSelectionResponseDto = z.infer<
  typeof familyLearningPathSelectionResponseSchema
>;
