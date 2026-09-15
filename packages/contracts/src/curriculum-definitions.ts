import { z } from 'zod';
import {
  progressionAxisSchema,
  universalEducationalStageSchema,
  progressionMetadataForCode,
} from './educational-taxonomy.js';

// --- Data-driven curriculum foundation (Aletheia issue #96, Fase 0) ---
//
// Generic Definition/Version pattern shared by learning domains,
// competencies, and (in a later slice) pedagogical models, theological
// perspectives, activities, rubrics and curriculum packs. Every definition
// carries: code, version, status, schema_version, created_at, published_at,
// deprecated_at, plus a `metadata` object for extensible, non-critical
// properties. This coexists with the pre-existing `PedagogicalFramework`
// enum (strangler-fig) -- it is not replaced in this phase.

export const definitionStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'DEPRECATED',
  'ARCHIVED',
]);

export type DefinitionStatus = z.infer<typeof definitionStatusSchema>;

// Explicit status transition request -- DRAFT -> PUBLISHED -> DEPRECATED ->
// ARCHIVED transitions are their own endpoint/call, never an implicit side
// effect of an update, on every definition table (issue #96 Fase 0 admin
// CRUD surface).
export const transitionDefinitionStatusSchema = z.object({
  status: definitionStatusSchema,
});

export type TransitionDefinitionStatusDto = z.infer<typeof transitionDefinitionStatusSchema>;

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

// Learning Domain
export const createLearningDomainSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC or MUSIC.BASS'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullish(),
  parentId: z.string().uuid().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateLearningDomainDto = z.input<typeof createLearningDomainSchema>;
export type CreateLearningDomainOutput = z.output<typeof createLearningDomainSchema>;

export const learningDomainResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type LearningDomainResponseDto = z.infer<typeof learningDomainResponseSchema>;

// Competency Definition
export const competencyAgeRecommendationSchema = z.object({
  min: z.number().int().min(0).max(120).optional(),
  max: z.number().int().min(0).max(120).optional(),
});

export type CompetencyAgeRecommendation = z.infer<typeof competencyAgeRecommendationSchema>;

export const competencyAssessmentPolicySchema = z.object({
  type: z.enum(['rubric', 'checklist', 'mentor_review', 'self_assessment']),
  minimumScore: z.number().min(0).optional(),
  rubricCode: z.string().optional(),
});

export type CompetencyAssessmentPolicy = z.infer<typeof competencyAssessmentPolicySchema>;

export const competencyMetadataSchema = z.object({
  ageRecommendation: competencyAgeRecommendationSchema.optional(),
  educationalStage: universalEducationalStageSchema.optional(),
  educationalStages: z.array(universalEducationalStageSchema).min(1).optional(),
  progressionAxis: progressionAxisSchema.optional(),
  proficiencyFramework: z.string().min(1).max(50).optional(),
  proficiencyLevel: z.string().min(1).max(50).optional(),
  prerequisites: z.array(z.string()).default([]),
  evidenceTypes: z.array(z.string()).default([]),
  assessmentPolicy: competencyAssessmentPolicySchema.optional(),
  // Concrete, portfolio-friendly starter objectives for this competency --
  // same tone/purpose as TemplateSubjectDefinition.starterObjectives
  // (curriculum-template.engine.ts), just scoped to one competency instead
  // of a whole subject. Extensible/non-critical property, per section 30's
  // JSONB-discipline rule (relational for identity, JSONB for the rest).
  starterObjectives: z.array(z.string().min(1).max(300)).max(5).default([]),
});

export type CompetencyMetadata = z.infer<typeof competencyMetadataSchema>;

export const createCompetencyDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC.BASS.LEVEL_01.RHYTHM'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  domainId: z.string().uuid(),
  pathId: z.string().uuid().nullish(),
  title: z.string().min(1).max(250),
  level: z.number().int().min(0).max(20).nullish(),
  metadata: competencyMetadataSchema.partial().default({}),
}).transform((value) => ({
  ...value,
  metadata: {
    ...progressionMetadataForCode(value.code, value.metadata.ageRecommendation),
    ...value.metadata,
  },
}));

export type CreateCompetencyDefinitionDto = z.input<typeof createCompetencyDefinitionSchema>;
export type CreateCompetencyDefinitionOutput = z.output<typeof createCompetencyDefinitionSchema>;

export const competencyDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  domainId: z.string().uuid(),
  pathId: z.string().uuid().nullable().optional(),
  title: z.string(),
  level: z.number().int().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type CompetencyDefinitionResponseDto = z.infer<typeof competencyDefinitionResponseSchema>;
