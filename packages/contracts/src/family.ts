import { z } from 'zod';
import { userSummarySchema } from './auth.js';

export const familyRoleSchema = z.enum([
  'OWNER_GUARDIAN',
  'GUARDIAN',
  'CO_GUARDIAN',
  'EDUCATOR',
]);

export type FamilyRole = z.infer<typeof familyRoleSchema>;

export const createFamilySchema = z.object({
  name: z.string().min(1),
  countryCode: z.string().min(2).max(3),
  stateProvince: z.string().nullish(),
});

export type CreateFamilyDto = z.infer<typeof createFamilySchema>;

export const familyMemberSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: familyRoleSchema,
  user: userSummarySchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type FamilyMemberDto = z.infer<typeof familyMemberSchema>;

export const familyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  countryCode: z.string().min(2).max(3),
  stateProvince: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  members: z.array(familyMemberSchema).optional(),
});

export type FamilyResponseDto = z.infer<typeof familyResponseSchema>;

export const inviteGuardianSchema = z.object({
  email: z.string().email(),
  role: familyRoleSchema,
});

export type InviteGuardianDto = z.infer<typeof inviteGuardianSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;

export const familyInvitationSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  email: z.string().email(),
  role: familyRoleSchema,
  token: z.string().optional(),
  invitedBy: z.string().uuid(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type FamilyInvitationDto = z.infer<typeof familyInvitationSchema>;
