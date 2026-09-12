import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Bible translation registry (Aletheia issue #96, Fase 3, section 16) ---
//
// METADATA ONLY -- this never carries actual scriptural text. Real
// passage text is fetched live from YouVersion's API on demand
// (YouVersionService.fetchPassage) and never persisted; this table just
// records which translations exist and their properties, replacing the
// hardcoded `POPULAR_BIBLE_VERSIONS` array in
// apps/api/src/modules/devotional/infrastructure/youversion.service.ts
// (not cut over in this PR -- strangler-fig, same as every other
// Definition/Version table here). `translationPhilosophy` is free-form
// (formal/dynamic equivalence, paraphrase, or anything not yet named),
// not a closed enum. "Disponibilidade pode ser ativada/desativada"
// reuses the existing DRAFT/PUBLISHED/DEPRECATED/ARCHIVED lifecycle
// rather than a separate toggle.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createBibleTranslationDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. NVI'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  language: z.string().min(1).max(50),
  youVersionId: z.string().min(1).max(50),
  translationPhilosophy: z.string().max(100).nullish(),
  publisher: z.string().max(250).nullish(),
  licensingNotes: z.string().max(2000).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateBibleTranslationDefinitionDto = z.input<typeof createBibleTranslationDefinitionSchema>;
export type CreateBibleTranslationDefinitionOutput = z.output<typeof createBibleTranslationDefinitionSchema>;

export const bibleTranslationDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  language: z.string(),
  youVersionId: z.string(),
  translationPhilosophy: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  licensingNotes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type BibleTranslationDefinitionResponseDto = z.infer<typeof bibleTranslationDefinitionResponseSchema>;

// --- Compare endpoint (family-scoped, read-only) ---
//
// Fans out to YouVersionService.fetchPassage for multiple
// BibleTranslationDefinition-referenced youVersionIds and returns them
// side by side. Never caches or persists fetched text beyond the
// request/response, per YouVersion's terms.
export const comparePassageQuerySchema = z.object({
  reference: z.string().min(1).max(200),
  translationCodes: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean)),
});

export type ComparePassageQueryDto = z.input<typeof comparePassageQuerySchema>;
export type ComparePassageQueryOutput = z.output<typeof comparePassageQuerySchema>;

export const comparePassageResultSchema = z.object({
  translationCode: z.string(),
  translationName: z.string(),
  reference: z.string(),
  content: z.string(),
  copyright: z.string().optional(),
});

export type ComparePassageResultDto = z.infer<typeof comparePassageResultSchema>;

export const comparePassageResponseSchema = z.object({
  reference: z.string(),
  results: z.array(comparePassageResultSchema),
});

export type ComparePassageResponseDto = z.infer<typeof comparePassageResponseSchema>;
