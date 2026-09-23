import { z } from 'zod';

// --- Mentor/external instructor (Aletheia issue #95 section 30, #232) ---
//
// Same invite-by-email + hashed-token pattern as FamilyInvitation
// (families module): the mentor is external to the family and may not
// have an account yet, so the grant exists from the moment of invite.
// `role` is a free-form string ("professor de música", "mestre de
// ofício", "pastor", ...) -- reuses the same "not a closed enum"
// philosophy already established for `assessorType`
// (assessment-result.ts) and tag/namespace values (definition-tag.ts).

export const mentorGrantStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REVOKED']);
export type MentorGrantStatus = z.infer<typeof mentorGrantStatusSchema>;

export const inviteMentorSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1).max(100),
});

export type InviteMentorDto = z.infer<typeof inviteMentorSchema>;

export const mentorGrantResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  email: z.string(),
  role: z.string(),
  status: mentorGrantStatusSchema,
  mentorUserId: z.string().uuid().nullable().optional(),
  // Only present in the response of the create call -- the plaintext
  // token is never persisted or read back afterward (same discipline as
  // FamilyInvitationDto.token).
  token: z.string().optional(),
  invitedBy: z.string().uuid(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable().optional(),
  revokedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type MentorGrantResponseDto = z.infer<typeof mentorGrantResponseSchema>;

export const acceptMentorGrantResponseSchema = z.object({
  success: z.boolean(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
});

export type AcceptMentorGrantResponseDto = z.infer<typeof acceptMentorGrantResponseSchema>;
