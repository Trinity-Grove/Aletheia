import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Progression policy (Aletheia issue #96, Fase 2, section 11) ---
//
// Platform/family configuration, so it follows the Definition/Version
// pattern like every other catalog table (contrast with
// EvidenceSubmission/AssessmentResult, which are user data). `policyType`
// is a free-form string, not a closed enum, per this issue's own anti-
// hardcode principle -- e.g. "MASTERY", "HOURS", "PROJECTS",
// "EVIDENCE_COUNT", "MENTOR_APPROVAL", or any future value, without a
// migration. `rules` is JSONB because its shape genuinely varies per
// policyType.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createProgressionPolicySchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MASTERY.DEFAULT'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  policyType: z.string().min(1).max(100),
  rules: z.record(z.string(), z.unknown()).default({}),
  competencyDefinitionId: z.string().uuid().nullish(),
  curriculumDefinitionId: z.string().uuid().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateProgressionPolicyDto = z.input<typeof createProgressionPolicySchema>;
export type CreateProgressionPolicyOutput = z.output<typeof createProgressionPolicySchema>;

export const progressionPolicyResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  policyType: z.string(),
  rules: z.record(z.string(), z.unknown()),
  competencyDefinitionId: z.string().uuid().nullable().optional(),
  curriculumDefinitionId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type ProgressionPolicyResponseDto = z.infer<typeof progressionPolicyResponseSchema>;

// Lean family-facing catalog entry. Only policies the live activation and
// evaluation path can execute are exposed here; the full definition remains
// an admin concern.
export const progressionPolicyCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  policyType: z.literal('EVIDENCE_COUNT'),
  minimumEvidenceCount: z.number().int().positive(),
  curriculumDefinitionId: z.string().uuid().nullable().optional(),
});

export type ProgressionPolicyCatalogEntryDto = z.infer<typeof progressionPolicyCatalogEntrySchema>;
