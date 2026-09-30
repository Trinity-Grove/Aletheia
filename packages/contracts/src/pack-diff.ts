import { z } from 'zod';
import { curriculumPackDefinitionTypeSchema } from './curriculum-pack.js';
import { familyCurriculumPackResponseSchema } from './family-curriculum-pack.js';

export const PACK_DIFF_ACTIONS = [
  'ADDED_BY_AUTHOR',
  'UPDATED_BY_AUTHOR',
  'PRESERVED_FAMILY_EDIT',
  'CONFLICT_PRESERVED_FAMILY',
] as const;

export const packDiffActionSchema = z.enum(PACK_DIFF_ACTIONS);
export type PackDiffAction = z.infer<typeof packDiffActionSchema>;

export const packDiffItemSchema = z.object({
  definitionType: curriculumPackDefinitionTypeSchema.or(z.string()),
  code: z.string().min(1),
  name: z.string(),
  action: packDiffActionSchema,
  description: z.string().optional(),
});

export type PackDiffItem = z.infer<typeof packDiffItemSchema>;

export const packDiffSummarySchema = z.object({
  addedCount: z.number().int().min(0),
  updatedCount: z.number().int().min(0),
  preservedFamilyEditsCount: z.number().int().min(0),
  conflictsCount: z.number().int().min(0),
});

export type PackDiffSummary = z.infer<typeof packDiffSummarySchema>;

export const packDiffReportSchema = z.object({
  hasUpdate: z.boolean(),
  currentVersion: z.number().int().min(1),
  latestVersion: z.number().int().min(1),
  sourcePackCode: z.string(),
  items: z.array(packDiffItemSchema),
  summary: packDiffSummarySchema,
});

export type PackDiffReport = z.infer<typeof packDiffReportSchema>;

export const applyPackUpdateSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type ApplyPackUpdateDto = z.infer<typeof applyPackUpdateSchema>;

export const applyPackUpdateResponseSchema = z.object({
  updatedFamilyPack: familyCurriculumPackResponseSchema,
  diffReport: packDiffReportSchema,
  previousRevision: z.number().int().min(1),
  newRevision: z.number().int().min(1),
});

export type ApplyPackUpdateResponseDto = z.infer<typeof applyPackUpdateResponseSchema>;
