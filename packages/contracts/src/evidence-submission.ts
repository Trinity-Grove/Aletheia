import { z } from 'zod';

// --- Evidence submission (Aletheia issue #96, Fase 2, section 9) ---
//
// A learner's actual evidence record -- USER DATA, not a Definition/
// Version catalog table (contrast with EvidenceTypeDefinition, which is
// the platform's catalog of *kinds* of evidence). Content reuses the
// exact shape PortfolioItem already established (fileUrl/textContent/
// mimeType/fileSizeBytes/storageKey/checksumSha256) rather than
// inventing new file handling -- see packages/contracts/src/portfolio.ts.
//
// Multi-competency support ("uma evidência pode validar várias
// competências") is a real array of {competencyDefinitionId, version}
// pairs at the API boundary, persisted through a join table server-side
// -- not a single competencyId field.

export const evidenceValidationStatusSchema = z.enum(['UNVALIDATED', 'VALIDATED', 'REJECTED']);
export type EvidenceValidationStatus = z.infer<typeof evidenceValidationStatusSchema>;

export const evidenceSubmissionCompetencyLinkSchema = z.object({
  competencyDefinitionId: z.string().uuid(),
});

const createEvidenceSubmissionBaseSchema = z.object({
  learnerId: z.string().uuid(),
  evidenceTypeId: z.string().uuid(),
  // Which interdisciplinary project (if any) produced this evidence
  // (issue #96 section 8: "pode gerar múltiplas evidências") -- most
  // evidence is not project work, so this stays optional.
  projectDefinitionId: z.string().uuid().nullish(),
  competencies: z.array(evidenceSubmissionCompetencyLinkSchema).min(1),
  textContent: z.string().max(20000).nullish(),
  fileUrl: z.string().url().nullish(),
  storageKey: z.string().min(1).max(500).nullish(),
  mimeType: z.string().max(150).nullish(),
  fileSizeBytes: z.number().int().nonnegative().nullish(),
  checksumSha256: z.string().length(64).nullish(),
});

const requiresTextContentOrFileUrl = (dto: {
  textContent?: string | null | undefined;
  fileUrl?: string | null | undefined;
}) => Boolean(dto.textContent) || Boolean(dto.fileUrl);

function requiresTextContentOrFileUrlRefinement() {
  return {
    message: 'An evidence submission needs either textContent or a fileUrl.',
    path: ['textContent'],
  };
}

export const createEvidenceSubmissionSchema = createEvidenceSubmissionBaseSchema.refine(
  requiresTextContentOrFileUrl,
  requiresTextContentOrFileUrlRefinement(),
);

export type CreateEvidenceSubmissionDto = z.input<typeof createEvidenceSubmissionSchema>;
export type CreateEvidenceSubmissionOutput = z.output<typeof createEvidenceSubmissionSchema>;

// Learner-facing variant (issue #34): identical validation, minus
// `learnerId`. The learner-access route's :learnerId param (verified
// against the learner's own session by LearnerSelfGuard) is the only
// source of truth for whose evidence this is -- there is structurally no
// field here a learner could use to submit evidence for another learner,
// sibling included.
export const learnerSubmitEvidenceSchema = createEvidenceSubmissionBaseSchema
  .omit({ learnerId: true })
  .refine(requiresTextContentOrFileUrl, requiresTextContentOrFileUrlRefinement());

export type LearnerSubmitEvidenceDto = z.input<typeof learnerSubmitEvidenceSchema>;
export type LearnerSubmitEvidenceOutput = z.output<typeof learnerSubmitEvidenceSchema>;

export const validateEvidenceSubmissionSchema = z.object({
  status: z.enum(['VALIDATED', 'REJECTED']),
});

export type ValidateEvidenceSubmissionDto = z.infer<typeof validateEvidenceSubmissionSchema>;

export const evidenceSubmissionCompetencyResponseSchema = z.object({
  id: z.string().uuid(),
  evidenceSubmissionId: z.string().uuid(),
  competencyDefinitionId: z.string().uuid(),
  competencyVersion: z.number().int(),
  createdAt: z.string(),
});

export type EvidenceSubmissionCompetencyResponseDto = z.infer<
  typeof evidenceSubmissionCompetencyResponseSchema
>;

export const evidenceSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  evidenceTypeId: z.string().uuid(),
  projectDefinitionId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid(),
  textContent: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  storageKey: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSizeBytes: z.number().int().nullable().optional(),
  checksumSha256: z.string().nullable().optional(),
  validationStatus: evidenceValidationStatusSchema,
  validatedByUserId: z.string().uuid().nullable().optional(),
  validatedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  competencies: z.array(evidenceSubmissionCompetencyResponseSchema),
});

export type EvidenceSubmissionResponseDto = z.infer<typeof evidenceSubmissionResponseSchema>;
