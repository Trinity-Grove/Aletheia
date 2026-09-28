import { z } from 'zod';

// Distinct from userSummarySchema (auth.ts) -- that one is what a user
// sees about themself; this is what a platform admin sees about anyone,
// so it also carries disabled status, which self-service never exposes.
export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  isPlatformAdmin: z.boolean(),
  disabled: z.boolean(),
  createdAt: z.string(),
});

export type AdminUserSummaryDto = z.infer<typeof adminUserSummarySchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;

export const listUsersResponseSchema = z.object({
  users: z.array(adminUserSummarySchema),
  totalCount: z.number().int().min(0),
});

export type ListUsersResponseDto = z.infer<typeof listUsersResponseSchema>;

export const updateUserFullNameSchema = z.object({
  fullName: z.string().min(1),
});

export type UpdateUserFullNameDto = z.infer<typeof updateUserFullNameSchema>;
