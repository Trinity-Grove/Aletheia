import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Evidence type catalog (Aletheia issue #96, Fase 0, section 9) ---
//
// Same Definition/Version pattern as the rest of Fase 0. The base 7 kinds
// (text, photo, video, audio, file, certificate, observation) are seeded
// data, not a closed enum -- a new evidence type is a data row, added
// without a deploy, not a code change.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const evidenceTypeMetadataSchema = z.object({
  acceptedMimeTypes: z.array(z.string()).default([]),
  maxSizeMb: z.number().positive().optional(),
  requiresValidation: z.boolean().default(false),
});

export type EvidenceTypeMetadata = z.infer<typeof evidenceTypeMetadataSchema>;

export const createEvidenceTypeDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. PHOTO'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullish(),
  metadata: evidenceTypeMetadataSchema.partial().default({}),
});

export type CreateEvidenceTypeDefinitionDto = z.input<typeof createEvidenceTypeDefinitionSchema>;
export type CreateEvidenceTypeDefinitionOutput = z.output<typeof createEvidenceTypeDefinitionSchema>;

export const evidenceTypeDefinitionResponseSchema = z.object({
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

export type EvidenceTypeDefinitionResponseDto = z.infer<typeof evidenceTypeDefinitionResponseSchema>;

// Lean, family-facing catalog entry (issue #126 item 3): populates the
// evidence-submission form's "type of evidence" dropdown from real
// PUBLISHED data. Includes `id` (unlike the code-only catalog entries for
// PedagogicalModelDefinition/TheologicalTraditionDefinition) because
// createEvidenceSubmissionSchema.evidenceTypeId is a real FK id, not a
// code -- this table doesn't have a family-facing "resolve by code"
// concept the way profiles do.
export const evidenceTypeCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export type EvidenceTypeCatalogEntryDto = z.infer<typeof evidenceTypeCatalogEntrySchema>;
