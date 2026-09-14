import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Rubric definition (Aletheia issue #96, Fase 0, section 10) ---
//
// Same Definition/Version pattern as the rest of Fase 0. Criteria are a
// real, queryable child collection (not JSON) so weight/scale/order are
// columns, per section 30's "JSONB with discipline" rule -- `metadata` on
// both the rubric and each criterion is reserved for genuinely extensible,
// non-load-bearing configuration (e.g. which assessment modes apply).
// A rubric can optionally belong to one competency, or stand alone to be
// reused across several -- not enforced as a single owner.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const rubricCriterionMetadataSchema = z.object({
  scaleLabels: z.record(z.string(), z.string()).optional(),
});

export type RubricCriterionMetadata = z.infer<typeof rubricCriterionMetadataSchema>;

export const createRubricCriterionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. CLARITY'),
  label: z.string().min(1).max(250),
  weight: z.number().min(0).default(1),
  order: z.number().int().min(0).default(0),
  scaleMin: z.number().int().default(0),
  scaleMax: z.number().int().default(4),
  metadata: rubricCriterionMetadataSchema.partial().default({}),
});

export type CreateRubricCriterionDto = z.input<typeof createRubricCriterionSchema>;
export type CreateRubricCriterionOutput = z.output<typeof createRubricCriterionSchema>;

export const rubricCriterionResponseSchema = z.object({
  id: z.string().uuid(),
  rubricId: z.string().uuid(),
  code: z.string(),
  label: z.string(),
  weight: z.number(),
  order: z.number().int(),
  scaleMin: z.number().int(),
  scaleMax: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RubricCriterionResponseDto = z.infer<typeof rubricCriterionResponseSchema>;

// Free-form, not a closed enum -- a new assessment mode is a data value.
export const rubricMetadataSchema = z.object({
  assessmentModes: z.array(z.string()).default([]),
});

export type RubricMetadata = z.infer<typeof rubricMetadataSchema>;

export const createRubricDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC.BASS.LEVEL_01_RUBRIC'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  competencyId: z.string().uuid().nullish(),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  metadata: rubricMetadataSchema.partial().default({}),
});

export type CreateRubricDefinitionDto = z.input<typeof createRubricDefinitionSchema>;
export type CreateRubricDefinitionOutput = z.output<typeof createRubricDefinitionSchema>;

export const rubricDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  competencyId: z.string().uuid().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type RubricDefinitionResponseDto = z.infer<typeof rubricDefinitionResponseSchema>;

export const rubricCatalogCriterionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  label: z.string(),
  order: z.number().int(),
  scaleMin: z.number().int(),
  scaleMax: z.number().int(),
});

export type RubricCatalogCriterionDto = z.infer<typeof rubricCatalogCriterionSchema>;

export const rubricCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable().optional(),
  competencyId: z.string().uuid().nullable().optional(),
  criteria: z.array(rubricCatalogCriterionSchema).min(1),
});

export type RubricCatalogEntryDto = z.infer<typeof rubricCatalogEntrySchema>;
