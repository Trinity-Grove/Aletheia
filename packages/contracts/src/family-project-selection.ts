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
  description: z.string().nullable().optional(),
  competencies: z.array(z.object({
    competencyId: z.string().uuid(),
    code: z.string(),
    title: z.string(),
    required: z.boolean(),
    order: z.number().int(),
  })).optional(),
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

export const familyProjectCatalogCompetencySchema = z.object({
  competencyId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  required: z.boolean(),
  order: z.number().int(),
});

export const familyProjectCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  version: z.number().int(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  competencies: z.array(familyProjectCatalogCompetencySchema),
});

export type FamilyProjectCatalogEntryDto = z.infer<typeof familyProjectCatalogEntrySchema>;
