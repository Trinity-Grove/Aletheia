import { z } from 'zod';

export const evidenceTypeSchema = z.enum([
  'IMAGE',
  'AUDIO',
  'VIDEO',
  'DOCUMENT',
  'LINK',
  'TEXT',
  'CERTIFICATE',
]);

export type EvidenceType = z.infer<typeof evidenceTypeSchema>;

export const createPortfolioItemSchema = z.object({
  learnerId: z.string().uuid(),
  learningRecordId: z.string().uuid().nullish(),
  academicYearId: z.string().uuid().nullish(),
  subjectId: z.string().uuid().nullish(),
  title: z.string().min(1).max(200),
  description: z.string().nullish(),
  type: evidenceTypeSchema,
  fileUrl: z.string().url().nullish(),
  textContent: z.string().nullish(),
  mimeType: z.string().nullish(),
  fileSizeBytes: z.number().int().nonnegative().nullish(),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'capturedAt must be in YYYY-MM-DD format').nullish(),
  isHighlight: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(50)).default([]),
});

export type CreatePortfolioItemDto = z.input<typeof createPortfolioItemSchema>;
export type CreatePortfolioItemOutput = z.output<typeof createPortfolioItemSchema>;

export const updatePortfolioItemSchema = createPortfolioItemSchema.partial();
export type UpdatePortfolioItemDto = z.infer<typeof updatePortfolioItemSchema>;

export const portfolioItemFilterSchema = z.object({
  learnerId: z.string().uuid().optional(),
  learningRecordId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  type: evidenceTypeSchema.optional(),
  isHighlight: z.boolean().optional(),
  tag: z.string().optional(),
});

export type PortfolioItemFilterDto = z.infer<typeof portfolioItemFilterSchema>;

export const portfolioItemResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  learningRecordId: z.string().uuid().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: evidenceTypeSchema,
  fileUrl: z.string().nullable().optional(),
  textContent: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSizeBytes: z.number().int().nullable().optional(),
  capturedAt: z.string().nullable().optional(),
  isHighlight: z.boolean(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PortfolioItemResponseDto = z.infer<typeof portfolioItemResponseSchema>;

// Evidence upload (issue #29): direct-to-storage presigned URL flow. The
// allowlist and size cap are shared between client-side and server-side
// validation, per this issue's "limites validados no cliente e no
// servidor" acceptance criterion — one source of truth for both.
export const ALLOWED_PORTFOLIO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
] as const;

export type AllowedPortfolioMimeType = (typeof ALLOWED_PORTFOLIO_MIME_TYPES)[number];

export const PORTFOLIO_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const requestPortfolioUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_PORTFOLIO_MIME_TYPES),
  fileSizeBytes: z.number().int().positive().max(PORTFOLIO_MAX_FILE_SIZE_BYTES),
});

export type RequestPortfolioUploadDto = z.infer<typeof requestPortfolioUploadSchema>;

export const portfolioUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresAt: z.string(),
});

export type PortfolioUploadUrlResponseDto = z.infer<typeof portfolioUploadUrlResponseSchema>;

export const portfolioDownloadUrlResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresAt: z.string(),
});

export type PortfolioDownloadUrlResponseDto = z.infer<typeof portfolioDownloadUrlResponseSchema>;
