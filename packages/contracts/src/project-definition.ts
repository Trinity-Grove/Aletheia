import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Project definition (Aletheia issue #96, section 8) ---
//
// An interdisciplinary project, e.g. "Construir uma horta": a single,
// versioned, data-driven definition that maps to MULTIPLE LearningDomains
// and CompetencyDefinitions at once (real join tables, same discipline as
// every other Definition/Version table here -- never a JSON array of
// IDs), can carry an ordered set of milestones, and can reference one
// overall RubricDefinition. Nothing about "building a garden" is
// special-cased anywhere in the engine: the same admin CRUD surface every
// other catalog uses creates it, and the same EvidenceSubmission /
// AssessmentResult machinery records what a learner produces doing it.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createProjectDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. GARDEN_BUILD'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  estimatedDurationDays: z.number().int().positive().nullish(),
  rubricDefinitionId: z.string().uuid().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateProjectDefinitionDto = z.input<typeof createProjectDefinitionSchema>;
export type CreateProjectDefinitionOutput = z.output<typeof createProjectDefinitionSchema>;

export const projectDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  estimatedDurationDays: z.number().int().nullable().optional(),
  rubricDefinitionId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type ProjectDefinitionResponseDto = z.infer<typeof projectDefinitionResponseSchema>;

export const addProjectDefinitionDomainSchema = z.object({
  domainId: z.string().uuid(),
});

export type AddProjectDefinitionDomainDto = z.input<typeof addProjectDefinitionDomainSchema>;
export type AddProjectDefinitionDomainOutput = z.output<typeof addProjectDefinitionDomainSchema>;

export const projectDefinitionDomainResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  domainId: z.string().uuid(),
  createdAt: z.string(),
});

export type ProjectDefinitionDomainResponseDto = z.infer<typeof projectDefinitionDomainResponseSchema>;

export const addProjectDefinitionCompetencySchema = z.object({
  competencyId: z.string().uuid(),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type AddProjectDefinitionCompetencyDto = z.input<typeof addProjectDefinitionCompetencySchema>;
export type AddProjectDefinitionCompetencyOutput = z.output<typeof addProjectDefinitionCompetencySchema>;

export const projectDefinitionCompetencyResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  competencyId: z.string().uuid(),
  required: z.boolean(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type ProjectDefinitionCompetencyResponseDto = z.infer<typeof projectDefinitionCompetencyResponseSchema>;

export const addProjectDefinitionMilestoneSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. SOIL_PREP'),
  title: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  order: z.number().int().min(0).default(0),
});

export type AddProjectDefinitionMilestoneDto = z.input<typeof addProjectDefinitionMilestoneSchema>;
export type AddProjectDefinitionMilestoneOutput = z.output<typeof addProjectDefinitionMilestoneSchema>;

export const projectDefinitionMilestoneResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  order: z.number().int(),
  createdAt: z.string(),
});

export type ProjectDefinitionMilestoneResponseDto = z.infer<typeof projectDefinitionMilestoneResponseSchema>;
