import { z } from 'zod';

export const CURRICULUM_PACK_MODERATION_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'SUSPENDED',
  'REJECTED',
] as const;

export const curriculumPackModerationStatusSchema = z.enum(CURRICULUM_PACK_MODERATION_STATUSES);
export type CurriculumPackModerationStatus = z.infer<typeof curriculumPackModerationStatusSchema>;

export const AUTHOR_TRUST_TIERS = ['NOVICE', 'VERIFIED', 'TRUSTED'] as const;
export const authorTrustTierSchema = z.enum(AUTHOR_TRUST_TIERS);
export type AuthorTrustTier = z.infer<typeof authorTrustTierSchema>;

export const PACK_REPORT_REASONS = [
  'SPAM_COMMERCIAL',
  'HARMFUL_INAPPROPRIATE',
  'COPYRIGHT_PLAGIARISM',
  'MALFORMED_QUALITY',
  'OTHER',
] as const;
export const packReportReasonSchema = z.enum(PACK_REPORT_REASONS);
export type PackReportReason = z.infer<typeof packReportReasonSchema>;

export const PACK_REPORT_STATUSES = ['OPEN', 'UPHELD', 'DISMISSED'] as const;
export const packReportStatusSchema = z.enum(PACK_REPORT_STATUSES);
export type PackReportStatus = z.infer<typeof packReportStatusSchema>;

export const createPackReportSchema = z.object({
  reason: packReportReasonSchema,
  details: z.string().max(2000).nullish(),
});
export type CreatePackReportDto = z.input<typeof createPackReportSchema>;
export type CreatePackReportOutput = z.output<typeof createPackReportSchema>;

export const packReportResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  reporterUserId: z.string().uuid(),
  reporterFamilyId: z.string().uuid(),
  reason: packReportReasonSchema,
  details: z.string().nullable(),
  status: packReportStatusSchema,
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  resolvedByUserId: z.string().uuid().nullable(),
});
export type PackReportResponseDto = z.infer<typeof packReportResponseSchema>;

export const authorTrustProfileResponseSchema = z.object({
  userId: z.string().uuid(),
  trustScore: z.number().int().min(0).max(100),
  tier: authorTrustTierSchema,
  approvedPacksCount: z.number().int().min(0),
  rejectedPacksCount: z.number().int().min(0),
  upheldReportsCount: z.number().int().min(0),
  lastEvaluatedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AuthorTrustProfileResponseDto = z.infer<typeof authorTrustProfileResponseSchema>;

export const adminModeratePackSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'RESTORE']),
  notes: z.string().max(2000).nullish(),
});
export type AdminModeratePackDto = z.input<typeof adminModeratePackSchema>;
export type AdminModeratePackOutput = z.output<typeof adminModeratePackSchema>;

export const adminResolveReportSchema = z.object({
  status: z.enum(['UPHELD', 'DISMISSED']),
  notes: z.string().max(2000).nullish(),
});
export type AdminResolveReportDto = z.input<typeof adminResolveReportSchema>;
export type AdminResolveReportOutput = z.output<typeof adminResolveReportSchema>;
