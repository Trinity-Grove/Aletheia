import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

export const upsertFamilyProjectSelectionSchema = z.object({
  enabled: z.boolean(),
});

export type UpsertFamilyProjectSelectionDto = z.infer<typeof upsertFamilyProjectSelectionSchema>;

export const familyProjectSelectionProjectSchema = z.object({
  code: z.string(),
  name: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
});

export const familyProjectSelectionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  projectId: z.string().uuid(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  project: familyProjectSelectionProjectSchema,
});

export type FamilyProjectSelectionResponseDto = z.infer<typeof familyProjectSelectionResponseSchema>;
