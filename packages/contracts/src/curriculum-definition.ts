import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Curriculum definition (Aletheia issue #96, Fase 0, sections 3, 23) ---
//
// The top-level composition: a named, versioned bundle referencing a
// pedagogical model and a set of learning domains/competencies/rubrics.
// This is what a family's future PedagogicalProfile (Fase 1, not this
// slice) will eventually point to -- deliberately kept free of
// family-specific fields (no familyId, no overrides here; those belong on
// the profile). References are real join rows, not arrays of IDs in
// JSON, so they're FK-checked and queryable.
//
// No "activities" reference yet -- no ActivityDefinition table exists
// (issue #96 section 7 is a later slice). "Referencia avaliações" is
// covered by the rubrics join.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createCurriculumDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. CLASSICAL_TRIVIUM.CORE'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  pedagogicalModelDefinitionId: z.string().uuid().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateCurriculumDefinitionDto = z.input<typeof createCurriculumDefinitionSchema>;
export type CreateCurriculumDefinitionOutput = z.output<typeof createCurriculumDefinitionSchema>;

export const curriculumDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  pedagogicalModelDefinitionId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type CurriculumDefinitionResponseDto = z.infer<typeof curriculumDefinitionResponseSchema>;

// Lean, family-facing catalog entry (issue #126 item 3): lets a family
// discover a new PUBLISHED curriculum without a release, to populate an
// "activate this curriculum for my learner" dropdown. Unlike
// PedagogicalModelCatalogEntryDto/TheologicalTraditionCatalogEntryDto,
// this DOES include `id` -- activating a curriculum
// (activateCurriculumForLearnerSchema) needs the real FK id, not a code,
// because the resulting LearnerCompetencyTracking rows point at exact
// CompetencyDefinition/CurriculumDefinition rows (Definition/Version
// snapshot discipline), not at a resolved-by-code pointer.
export const curriculumDefinitionCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export type CurriculumDefinitionCatalogEntryDto = z.infer<typeof curriculumDefinitionCatalogEntrySchema>;

// Domain / competency links carry `required` + `order`; the rubric link
// is a plain membership (a rubric either applies to the curriculum or it
// doesn't -- no ordering/required concept for it in this slice).
export const addCurriculumDefinitionDomainSchema = z.object({
  domainId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddCurriculumDefinitionDomainDto = z.input<typeof addCurriculumDefinitionDomainSchema>;
export type AddCurriculumDefinitionDomainOutput = z.output<typeof addCurriculumDefinitionDomainSchema>;

export const curriculumDefinitionDomainResponseSchema = z.object({
  id: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  domainId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumDefinitionDomainResponseDto = z.infer<typeof curriculumDefinitionDomainResponseSchema>;

export const addCurriculumDefinitionCompetencySchema = z.object({
  competencyId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddCurriculumDefinitionCompetencyDto = z.input<typeof addCurriculumDefinitionCompetencySchema>;
export type AddCurriculumDefinitionCompetencyOutput = z.output<typeof addCurriculumDefinitionCompetencySchema>;

export const curriculumDefinitionCompetencyResponseSchema = z.object({
  id: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  competencyId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumDefinitionCompetencyResponseDto = z.infer<
  typeof curriculumDefinitionCompetencyResponseSchema
>;

export const addCurriculumDefinitionRubricSchema = z.object({
  rubricId: z.string().uuid(),
});

export type AddCurriculumDefinitionRubricDto = z.input<typeof addCurriculumDefinitionRubricSchema>;
export type AddCurriculumDefinitionRubricOutput = z.output<typeof addCurriculumDefinitionRubricSchema>;

export const curriculumDefinitionRubricResponseSchema = z.object({
  id: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  rubricId: z.string().uuid(),
  createdAt: z.string(),
});

export type CurriculumDefinitionRubricResponseDto = z.infer<typeof curriculumDefinitionRubricResponseSchema>;

// Activity link -- added alongside ActivityDefinition (issue #96 section 7),
// closing the "referencia atividades" gap CurriculumDefinition's first PR
// intentionally left open (no ActivityDefinition table existed yet).
export const addCurriculumDefinitionActivitySchema = z.object({
  activityId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddCurriculumDefinitionActivityDto = z.input<typeof addCurriculumDefinitionActivitySchema>;
export type AddCurriculumDefinitionActivityOutput = z.output<typeof addCurriculumDefinitionActivitySchema>;

export const curriculumDefinitionActivityResponseSchema = z.object({
  id: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  activityId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumDefinitionActivityResponseDto = z.infer<typeof curriculumDefinitionActivityResponseSchema>;

// Project link -- added alongside ProjectDefinition (issue #96 section 8).
export const addCurriculumDefinitionProjectSchema = z.object({
  projectId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddCurriculumDefinitionProjectDto = z.input<typeof addCurriculumDefinitionProjectSchema>;
export type AddCurriculumDefinitionProjectOutput = z.output<typeof addCurriculumDefinitionProjectSchema>;

export const curriculumDefinitionProjectResponseSchema = z.object({
  id: z.string().uuid(),
  curriculumDefinitionId: z.string().uuid(),
  projectId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumDefinitionProjectResponseDto = z.infer<typeof curriculumDefinitionProjectResponseSchema>;
