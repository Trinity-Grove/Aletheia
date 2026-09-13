import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Curriculum pack (Aletheia issue #96, Fase 4, section 27) ---
//
// A bundle/portability concept, not a new content type -- every
// individual definition table a pack would bundle already exists. A
// pack follows the same Definition/Version pattern as everything else;
// its manifest is a list of (definitionType, code, version) tuples, not
// IDs, since packs are meant to be portable across databases (section
// 28) where IDs won't match. `definitionType` is a closed set here
// (unlike e.g. ProgressionPolicy.policyType) because it names one of
// this codebase's actual Prisma models -- an intentionally enumerable
// set, not open-ended user content.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const CURRICULUM_PACK_DEFINITION_TYPES = [
  'LearningDomain',
  'CompetencyDefinition',
  'LearningPath',
  'SkillDefinition',
  'RubricDefinition',
  'EvidenceTypeDefinition',
  'ActivityDefinition',
  'CurriculumDefinition',
  'PedagogicalModelDefinition',
  'TheologicalTraditionDefinition',
  'TheologicalPositionDefinition',
  'BibleTranslationDefinition',
] as const;

export const curriculumPackDefinitionTypeSchema = z.enum(CURRICULUM_PACK_DEFINITION_TYPES);
export type CurriculumPackDefinitionType = z.infer<typeof curriculumPackDefinitionTypeSchema>;

export const createCurriculumPackSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. CLASSICAL_TRIVIUM_STARTER'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateCurriculumPackDto = z.input<typeof createCurriculumPackSchema>;
export type CreateCurriculumPackOutput = z.output<typeof createCurriculumPackSchema>;

export const curriculumPackResponseSchema = z.object({
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

export type CurriculumPackResponseDto = z.infer<typeof curriculumPackResponseSchema>;

export const addCurriculumPackItemSchema = z.object({
  definitionType: curriculumPackDefinitionTypeSchema,
  code: z.string().min(1).max(150),
  version: z.number().int().min(1),
});

export type AddCurriculumPackItemDto = z.input<typeof addCurriculumPackItemSchema>;
export type AddCurriculumPackItemOutput = z.output<typeof addCurriculumPackItemSchema>;

export const curriculumPackItemResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  definitionType: curriculumPackDefinitionTypeSchema,
  code: z.string(),
  version: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumPackItemResponseDto = z.infer<typeof curriculumPackItemResponseSchema>;

export const addCurriculumPackDependencySchema = z.object({
  dependsOnCode: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'dependsOnCode must be upper snake/dot case'),
  dependsOnVersion: z.number().int().min(1),
});

export type AddCurriculumPackDependencyDto = z.input<typeof addCurriculumPackDependencySchema>;
export type AddCurriculumPackDependencyOutput = z.output<typeof addCurriculumPackDependencySchema>;

export const curriculumPackDependencyResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  dependsOnCode: z.string(),
  dependsOnVersion: z.number().int(),
  createdAt: z.string(),
});

export type CurriculumPackDependencyResponseDto = z.infer<typeof curriculumPackDependencyResponseSchema>;
