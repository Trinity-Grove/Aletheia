import { z } from 'zod';

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  emailVerified: z.boolean(),
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

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
