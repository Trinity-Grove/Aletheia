import { z } from 'zod';
import {
  definitionStatusSchema,
} from './curriculum-definitions.js';
import {
  progressionAxisSchema,
  progressionMetadataForCode,
  universalEducationalStageSchema,
} from './educational-taxonomy.js';

// --- Learning paths and skills (Aletheia issue #96, Fase 0, section 4 + 6) ---
//
// Same Definition/Version pattern as LearningDomain/CompetencyDefinition/
// PedagogicalModelDefinition. A LearningPath belongs to a LearningDomain; a
// CompetencyDefinition can optionally belong to a LearningPath (see the
// `pathId` field added to createCompetencyDefinitionSchema in
// curriculum-definitions.ts); a SkillDefinition belongs to a
// CompetencyDefinition. None of this is wired into any learner-facing
// request path yet -- it exists so an administrator can eventually model a
// full domain -> path -> competency -> skill tree as data.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

// Learning Path
export const learningPathMetadataSchema = z.object({
  levels: z.array(z.string()).default([]),
  educationalStage: universalEducationalStageSchema.optional(),
  educationalStages: z.array(universalEducationalStageSchema).min(1).optional(),
  progressionAxis: progressionAxisSchema.optional(),
  proficiencyFramework: z.string().min(1).max(50).optional(),
  prerequisites: z.array(z.string()).default([]),
  optional: z.boolean().default(false),
  recommended: z.boolean().default(false),
  curriculumPackCode: z.string().optional(),
});

export type LearningPathMetadata = z.infer<typeof learningPathMetadataSchema>;

export const createLearningPathSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC.BASS_TRACK'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  domainId: z.string().uuid(),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullish(),
  metadata: learningPathMetadataSchema.partial().default({}),
}).transform((value) => ({
  ...value,
  metadata: {
    ...progressionMetadataForCode(value.code),
    ...value.metadata,
  },
}));

export type CreateLearningPathDto = z.input<typeof createLearningPathSchema>;
export type CreateLearningPathOutput = z.output<typeof createLearningPathSchema>;

export const learningPathResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  domainId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type LearningPathResponseDto = z.infer<typeof learningPathResponseSchema>;

// Skill Definition
export const skillMetadataSchema = z.object({
  dependencies: z.array(z.string()).default([]),
  evidenceTypes: z.array(z.string()).default([]),
});

export type SkillMetadata = z.infer<typeof skillMetadataSchema>;

export const createSkillDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MUSIC.BASS.LEVEL_01.RHYTHM.HOLD_TEMPO'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  competencyId: z.string().uuid(),
  title: z.string().min(1).max(250),
  order: z.number().int().min(0).default(0),
  metadata: skillMetadataSchema.partial().default({}),
});

export type CreateSkillDefinitionDto = z.input<typeof createSkillDefinitionSchema>;
export type CreateSkillDefinitionOutput = z.output<typeof createSkillDefinitionSchema>;

export const skillDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  competencyId: z.string().uuid(),
  title: z.string(),
  order: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type SkillDefinitionResponseDto = z.infer<typeof skillDefinitionResponseSchema>;
