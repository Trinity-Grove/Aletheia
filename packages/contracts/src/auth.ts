import { z } from 'zod';

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email(),
});

export type ChangeEmailDto = z.infer<typeof changeEmailSchema>;

export const accountAuditEventTypeSchema = z.enum([
  'LOGIN_SUCCEEDED',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_CHANGED',
  'EMAIL_VERIFIED',
  'REFRESH_TOKEN_REUSE_DETECTED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'MFA_CHALLENGE_FAILED',
]);

export type AccountAuditEventType = z.infer<typeof accountAuditEventTypeSchema>;

export const accountAuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  eventType: accountAuditEventTypeSchema,
  createdAt: z.string(),
});

export type AccountAuditLogEntryDto = z.infer<typeof accountAuditLogEntrySchema>;

export const mfaSetupRequestSchema = z.object({ password: z.string().min(1) });

export type MfaSetupRequestDto = z.infer<typeof mfaSetupRequestSchema>;

export const mfaSetupResponseSchema = z.object({
  otpauthUri: z.string().min(1),
  recoveryCodes: z.array(z.string()).length(10),
});

export type MfaSetupResponseDto = z.infer<typeof mfaSetupResponseSchema>;

export const mfaConfirmSchema = z.object({ code: z.string().min(1) });

export type MfaConfirmDto = z.infer<typeof mfaConfirmSchema>;

export const mfaDisableSchema = z.object({ password: z.string().min(1) });

export type MfaDisableDto = z.infer<typeof mfaDisableSchema>;

export const mfaVerifySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().min(1),
});

export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;

export const mfaChallengeIssuedSchema = z.object({
  mfaRequired: z.literal(true),
  challengeToken: z.string().min(1),
});

export type MfaChallengeIssuedDto = z.infer<typeof mfaChallengeIssuedSchema>;

export const loginResultSchema = z.union([authResponseSchema, mfaChallengeIssuedSchema]);

export type LoginResultDto = z.infer<typeof loginResultSchema>;
