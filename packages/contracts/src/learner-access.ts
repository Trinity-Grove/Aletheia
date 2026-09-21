import { z } from 'zod';

export const learnerAccessGrantSchema = z.object({
  learnerId: z.string().uuid(),
  enabled: z.boolean(),
  createdAt: z.string().nullable(),
  regeneratedAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  accessUrl: z.string().optional(),
});

export type LearnerAccessGrantDto = z.infer<typeof learnerAccessGrantSchema>;

// Returned exactly once, right after grant/regenerate -- never persisted in
// plaintext, never returned by any other endpoint.
export const learnerAccessCodeSchema = z.object({
  grant: learnerAccessGrantSchema,
  code: z.string(),
  accessToken: z.string().optional(),
  accessUrl: z.string().optional(),
});

export type LearnerAccessCodeDto = z.infer<typeof learnerAccessCodeSchema>;

export const learnerAccessOptionSchema = z.object({
  learnerId: z.string().uuid(),
  displayName: z.string(),
});

export type LearnerAccessOptionDto = z.infer<typeof learnerAccessOptionSchema>;

export const learnerLoginSchema = z.object({
  learnerId: z.string().uuid(),
  code: z.string().min(4).max(16),
});

export type LearnerLoginDto = z.infer<typeof learnerLoginSchema>;

export const learnerTokenLoginSchema = z.object({
  token: z.string().min(10),
});

export type LearnerTokenLoginDto = z.infer<typeof learnerTokenLoginSchema>;

// No token in the body -- the session lives only in the httpOnly cookie, to
// limit what a page meant for shared/kiosk-style devices ever exposes to JS.
export const learnerSessionResponseSchema = z.object({
  learnerId: z.string().uuid(),
  familyId: z.string().uuid(),
  displayName: z.string(),
  expiresAt: z.string(),
});

export type LearnerSessionResponseDto = z.infer<typeof learnerSessionResponseSchema>;
