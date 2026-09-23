import { z } from 'zod';
import { curriculumPackDefinitionTypeSchema } from './curriculum-pack.js';

// --- Generic tagging (Aletheia issue #96, section 38) ---
//
// Reuses CURRICULUM_PACK_DEFINITION_TYPES's closed set (curriculum-pack.ts)
// rather than a parallel list: the same 13 tables that can be packaged
// are the ones that can be tagged -- one list to keep in sync, not two.
//
// `namespace` lets more than one taxonomy coexist on the same row (e.g.
// "theme" vs. "difficulty" vs. a community-authored classification)
// without a closed list of namespaces -- "pode haver taxonomias
// diferentes" (section 38) is the namespace value being a data value.
// `definitionId` pins one exact row (a specific version), so a tag on a
// DRAFT never silently carries over to a later PUBLISHED version.

export const addDefinitionTagSchema = z.object({
  entityType: curriculumPackDefinitionTypeSchema,
  definitionId: z.string().uuid(),
  namespace: z.string().min(1).max(50).default('general'),
  tag: z.string().min(1).max(100),
});

export type AddDefinitionTagDto = z.input<typeof addDefinitionTagSchema>;
export type AddDefinitionTagOutput = z.output<typeof addDefinitionTagSchema>;

export const definitionTagResponseSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  definitionId: z.string().uuid(),
  namespace: z.string(),
  tag: z.string(),
  createdAt: z.string(),
});

export type DefinitionTagResponseDto = z.infer<typeof definitionTagResponseSchema>;

// Reverse lookup (section 37: "definitions são pesquisáveis por ... tags").
export const searchDefinitionsByTagSchema = z.object({
  tag: z.string().min(1).max(100),
  namespace: z.string().min(1).max(50).optional(),
  entityType: curriculumPackDefinitionTypeSchema.optional(),
});

export type SearchDefinitionsByTagDto = z.infer<typeof searchDefinitionsByTagSchema>;
