import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Pedagogical model definition (Aletheia issue #96, Fase 0) ---
//
// Data-driven replacement target for the `PedagogicalFramework` enum +
// `CurriculumTemplateEngine` switch-case added in PR #94. Each row's
// `metadata.subjects` mirrors the pre-existing `TemplateSubjectDefinition`
// shape so the Portuguese content already written for the 8 frameworks (and
// the shared cross-cutting subjects) can be moved into data verbatim,
// without a rewrite. This schema coexists with the enum -- it does not
// replace it in this phase.

export const templateSubjectDefinitionSchema = z.object({
  name: z.string().min(1).max(150),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  icon: z.string().max(50).optional(),
  description: z.string().min(1).max(1000),
  starterObjectives: z.array(z.string().min(1)).default([]),
});

export type TemplateSubjectDefinition = z.infer<typeof templateSubjectDefinitionSchema>;

export const pedagogicalModelMetadataSchema = z.object({
  subjects: z.array(templateSubjectDefinitionSchema).default([]),
});

export type PedagogicalModelMetadata = z.infer<typeof pedagogicalModelMetadataSchema>;

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createPedagogicalModelDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MONTESSORI'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullish(),
  metadata: pedagogicalModelMetadataSchema.partial().default({}),
});

export type CreatePedagogicalModelDefinitionDto = z.input<typeof createPedagogicalModelDefinitionSchema>;
export type CreatePedagogicalModelDefinitionOutput = z.output<typeof createPedagogicalModelDefinitionSchema>;

export const pedagogicalModelDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type PedagogicalModelDefinitionResponseDto = z.infer<typeof pedagogicalModelDefinitionResponseSchema>;

// Lean, family-facing catalog entry (issue #96 section 35: "UI
// data-driven" -- a family should be able to discover a new PUBLISHED
// model without a release). Deliberately excludes id/version/status/
// metadata/timestamps -- a family choosing a template doesn't need the
// admin-facing shape, just enough to render an option and apply it by
// code, the same `code` `applyCurriculumTemplateSchema.template` already
// accepts.
export const pedagogicalModelCatalogEntrySchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  subjects: z.array(templateSubjectDefinitionSchema).optional(),
});

export type PedagogicalModelCatalogEntryDto = z.infer<typeof pedagogicalModelCatalogEntrySchema>;
