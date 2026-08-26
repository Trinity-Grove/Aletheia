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
