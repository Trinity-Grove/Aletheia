import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';
import { curriculumPackDefinitionTypeSchema } from './curriculum-pack.js';

// ProjectDefinition is intentionally excluded until curriculum-pack-portability
// supports exporting/importing that type without losing its child rows.
export const CURRICULUM_COMPOSITION_DEFINITION_TYPES = [
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
] as const satisfies readonly z.infer<typeof curriculumPackDefinitionTypeSchema>[];

export const curriculumCompositionDefinitionTypeSchema = z.enum(CURRICULUM_COMPOSITION_DEFINITION_TYPES);
export type CurriculumCompositionDefinitionType = z.infer<typeof curriculumCompositionDefinitionTypeSchema>;

export const curriculumCompositionRefSchema = z.object({
  definitionType: curriculumCompositionDefinitionTypeSchema,
  code: z.string().min(1).max(150),
  version: z.number().int().min(1),
});

export type CurriculumCompositionRef = z.infer<typeof curriculumCompositionRefSchema>;

export const curriculumCompositionItemSchema = curriculumCompositionRefSchema.extend({
  position: z.number().int().min(0),
});

export type CurriculumCompositionItem = z.infer<typeof curriculumCompositionItemSchema>;

export const curriculumCompositionCatalogQuerySchema = z.object({
  definitionType: curriculumCompositionDefinitionTypeSchema.optional(),
  query: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CurriculumCompositionCatalogQuery = z.input<typeof curriculumCompositionCatalogQuerySchema>;

export const curriculumCompositionCatalogItemSchema = z.object({
  definitionType: curriculumCompositionDefinitionTypeSchema,
  code: z.string(),
  version: z.number().int().min(1),
  label: z.string(),
  description: z.string().nullable(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
});

export type CurriculumCompositionCatalogItem = z.infer<typeof curriculumCompositionCatalogItemSchema>;

export const updateCurriculumPackCompositionSchema = z.object({
  expectedRevision: z.number().int().min(0),
  items: z.array(curriculumCompositionRefSchema).max(100),
});

export type UpdateCurriculumPackCompositionDto = z.infer<typeof updateCurriculumPackCompositionSchema>;

export const curriculumPackCompositionResponseSchema = z.object({
  packId: z.string().uuid(),
  revision: z.number().int().min(0),
  items: z.array(curriculumCompositionItemSchema),
  preview: z.array(curriculumCompositionItemSchema),
});

export type CurriculumPackCompositionResponseDto = z.infer<typeof curriculumPackCompositionResponseSchema>;

export const curriculumPackCompositionRevisionResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  revision: z.number().int().min(1),
  items: z.array(curriculumCompositionItemSchema),
  createdAt: z.string(),
});

export type CurriculumPackCompositionRevisionResponseDto = z.infer<
  typeof curriculumPackCompositionRevisionResponseSchema
>;
