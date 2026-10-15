import { z } from 'zod';
import { definitionStatusSchema, safetyPolicySchema } from './curriculum-definitions.js';

// --- Activity definition (Aletheia issue #96, Fase 0, section 7) ---
//
// A reusable, versioned learning activity -- not owned by any one
// curriculum. Competencies it validates are a real join table
// (ActivityDefinitionCompetency), same discipline as CurriculumDefinition's
// joins, not a JSON array of IDs. Required evidence is a join to the
// EvidenceTypeDefinition catalog (ActivityDefinitionEvidenceType) rather
// than duplicating that catalog here.
//
// `evidenceRequirementMode` describes how the linked evidence types
// combine: ANY (one of several accepted types suffices, e.g. "a photo OR
// a video") or ALL (every linked type is required, e.g. "a video AND a
// mentor observation"). This is a fixed structural operator, not domain
// content, so -- unlike evidence types themselves -- it's kept as a small
// closed enum rather than a free string.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const evidenceRequirementModeSchema = z.enum(['ANY', 'ALL']);

export type EvidenceRequirementMode = z.infer<typeof evidenceRequirementModeSchema>;

export const activityMetadataSchema = z.object({
  materials: z.array(z.string()).default([]),
  safetyPolicy: safetyPolicySchema.optional(),
});

export type ActivityMetadata = z.infer<typeof activityMetadataSchema>;

export const createActivityDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC.BASS.PRACTICE_SESSION'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  ageMin: z.number().int().min(0).max(120).nullish(),
  ageMax: z.number().int().min(0).max(120).nullish(),
  estimatedDurationMinutes: z.number().int().positive().nullish(),
  supervisionRequired: z.boolean().default(false),
  riskLevel: z.string().max(50).nullish(),
  evidenceRequirementMode: evidenceRequirementModeSchema.default('ANY'),
  metadata: activityMetadataSchema.partial().default({}),
}).refine(
  ({ ageMin, ageMax }) => ageMin == null || ageMax == null || ageMin <= ageMax,
  { message: 'ageMax must be greater than or equal to ageMin', path: ['ageMax'] },
);

export type CreateActivityDefinitionDto = z.input<typeof createActivityDefinitionSchema>;
export type CreateActivityDefinitionOutput = z.output<typeof createActivityDefinitionSchema>;

export const activityDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  estimatedDurationMinutes: z.number().int().nullable().optional(),
  supervisionRequired: z.boolean(),
  riskLevel: z.string().nullable().optional(),
  evidenceRequirementMode: evidenceRequirementModeSchema,
  materials: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type ActivityDefinitionResponseDto = z.infer<typeof activityDefinitionResponseSchema>;

export const searchActivityDefinitionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(150).optional(),
  status: definitionStatusSchema.optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
});

export type SearchActivityDefinitionsQueryDto = z.infer<typeof searchActivityDefinitionsQuerySchema>;

export const addActivityDefinitionCompetencySchema = z.object({
  competencyId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddActivityDefinitionCompetencyDto = z.input<typeof addActivityDefinitionCompetencySchema>;
export type AddActivityDefinitionCompetencyOutput = z.output<typeof addActivityDefinitionCompetencySchema>;

export const activityDefinitionCompetencyResponseSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  competencyId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type ActivityDefinitionCompetencyResponseDto = z.infer<typeof activityDefinitionCompetencyResponseSchema>;

export const addActivityDefinitionEvidenceTypeSchema = z.object({
  evidenceTypeId: z.string().uuid(),
});

export type AddActivityDefinitionEvidenceTypeDto = z.input<typeof addActivityDefinitionEvidenceTypeSchema>;
export type AddActivityDefinitionEvidenceTypeOutput = z.output<typeof addActivityDefinitionEvidenceTypeSchema>;

export const activityDefinitionEvidenceTypeResponseSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  evidenceTypeId: z.string().uuid(),
  createdAt: z.string(),
});

export type ActivityDefinitionEvidenceTypeResponseDto = z.infer<
  typeof activityDefinitionEvidenceTypeResponseSchema
>;
