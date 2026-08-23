import { z } from 'zod';

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  createdAt: z.string(),
});

export type UserSummaryDto = z.infer<typeof userSummarySchema>;

export const registerGuardianSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

export type RegisterGuardianDto = z.infer<typeof registerGuardianSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: userSummarySchema,
});

export type AuthResponseDto = z.infer<typeof authResponseSchema>;
