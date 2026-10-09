import { z } from 'zod';

export const feedbackCategorySchema = z.enum(['BUG', 'IDEA', 'QUESTION', 'PRAISE']);
export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;

export const feedbackStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;

// No name/email fields on purpose: when identifySelf is true the API
// reads the submitter's own account through IDENTITY_PUBLIC_API, so a
// client can never attach someone else's identity to a submission.
export const createFeedbackSchema = z.object({
  category: feedbackCategorySchema,
  message: z.string().trim().min(10).max(4000),
  identifySelf: z.boolean().default(false),
  pagePath: z.string().max(200).optional(),
  locale: z.string().max(10).optional(),
  appVersion: z.string().max(40).optional(),
  userAgent: z.string().max(400).optional(),
});

export type CreateFeedbackDto = z.input<typeof createFeedbackSchema>;
export type CreateFeedbackOutput = z.output<typeof createFeedbackSchema>;

// Deliberately narrower than the admin view: the family never gets back
// submitterEmail or anything else that could leak across.
export const submitterFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  status: feedbackStatusSchema,
  category: feedbackCategorySchema,
  identifySelf: z.boolean(),
  createdAt: z.string(),
});

export type SubmitterFeedbackResponseDto = z.infer<typeof submitterFeedbackResponseSchema>;

export const approveFeedbackSchema = z.object({
  title: z.string().trim().min(5).max(180),
  labels: z.array(z.string().trim().min(1).max(50)).max(8).default([]),
  adminNote: z.string().trim().max(2000).optional(),
});

export type ApproveFeedbackDto = z.input<typeof approveFeedbackSchema>;
export type ApproveFeedbackOutput = z.output<typeof approveFeedbackSchema>;

export const rejectFeedbackSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export type RejectFeedbackDto = z.infer<typeof rejectFeedbackSchema>;

export const adminFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  category: feedbackCategorySchema,
  message: z.string(),
  status: feedbackStatusSchema,
  identifySelf: z.boolean(),
  // Null whenever identifySelf is false -- the columns are only written
  // when the submitter explicitly consented at submission time.
  submitterName: z.string().nullable(),
  submitterEmail: z.string().nullable(),
  pagePath: z.string().nullable(),
  locale: z.string().nullable(),
  appVersion: z.string().nullable(),
  adminNote: z.string().nullable(),
  lastIssueError: z.string().nullable(),
  githubIssueNumber: z.number().int().nullable(),
  githubIssueUrl: z.string().nullable(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
});

export type AdminFeedbackResponseDto = z.infer<typeof adminFeedbackResponseSchema>;

export const listAdminFeedbackQuerySchema = z.object({
  status: feedbackStatusSchema.optional(),
  category: feedbackCategorySchema.optional(),
  take: z.number().int().positive().max(100).optional(),
  skip: z.number().int().min(0).optional(),
});

export type ListAdminFeedbackQueryDto = z.infer<typeof listAdminFeedbackQuerySchema>;

export const adminFeedbackListResponseSchema = z.object({
  items: z.array(adminFeedbackResponseSchema),
  total: z.number().int().nonnegative(),
});

export type AdminFeedbackListResponseDto = z.infer<typeof adminFeedbackListResponseSchema>;
