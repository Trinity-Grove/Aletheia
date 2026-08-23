import { describe, expect, it } from 'vitest';
import {
  acceptInvitationSchema,
  createFamilySchema,
  familyInvitationSchema,
  familyMemberSchema,
  familyResponseSchema,
  familyRoleSchema,
  inviteGuardianSchema,
  type AcceptInvitationDto,
  type CreateFamilyDto,
  type FamilyInvitationDto,
  type FamilyMemberDto,
  type FamilyResponseDto,
  type FamilyRole,
  type InviteGuardianDto,
} from './family.js';

describe('family contracts', () => {
  describe('familyRoleSchema', () => {
    it('accepts valid roles', () => {
      const validRoles: FamilyRole[] = [
        'OWNER_GUARDIAN',
        'GUARDIAN',
        'CO_GUARDIAN',
        'EDUCATOR',
      ];

      for (const role of validRoles) {
        expect(familyRoleSchema.safeParse(role).success).toBe(true);
      }
    });

    it('rejects invalid roles', () => {
      expect(familyRoleSchema.safeParse('LEARNER').success).toBe(false);
      expect(familyRoleSchema.safeParse('ADMIN').success).toBe(false);
      expect(familyRoleSchema.safeParse('').success).toBe(false);
    });
  });

  describe('createFamilySchema', () => {
    it('validates a valid create family payload', () => {
      const payload: CreateFamilyDto = {
        name: 'The Smith Family',
        countryCode: 'US',
        stateProvince: 'CA',
      };

      const result = createFamilySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('allows optional stateProvince', () => {
      const payload: CreateFamilyDto = {
        name: 'The Smith Family',
        countryCode: 'GB',
      };

      const result = createFamilySchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects empty name or invalid country code', () => {
      expect(
        createFamilySchema.safeParse({
          name: '',
          countryCode: 'US',
        }).success,
      ).toBe(false);

      expect(
        createFamilySchema.safeParse({
          name: 'Valid Name',
          countryCode: '',
        }).success,
      ).toBe(false);
    });
  });

  describe('familyMemberSchema & familyResponseSchema', () => {
    it('validates family member and response DTOs', () => {
      const member: FamilyMemberDto = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        familyId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174003',
        role: 'OWNER_GUARDIAN',
        createdAt: '2026-08-23T12:00:00.000Z',
      };

      expect(familyMemberSchema.safeParse(member).success).toBe(true);

      const familyResponse: FamilyResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'The Smith Family',
        countryCode: 'US',
        stateProvince: 'CA',
        createdAt: '2026-08-23T12:00:00.000Z',
        updatedAt: '2026-08-23T12:00:00.000Z',
        members: [member],
      };

      expect(familyResponseSchema.safeParse(familyResponse).success).toBe(true);
    });
  });

  describe('invitation schemas', () => {
    it('validates invite guardian payload', () => {
      const payload: InviteGuardianDto = {
        email: 'coguardian@example.com',
        role: 'CO_GUARDIAN',
      };

      expect(inviteGuardianSchema.safeParse(payload).success).toBe(true);
    });

    it('validates accept invitation payload', () => {
      const payload: AcceptInvitationDto = {
        token: 'secret-invitation-token-123',
      };

      expect(acceptInvitationSchema.safeParse(payload).success).toBe(true);
    });

    it('validates full family invitation DTO', () => {
      const invitation: FamilyInvitationDto = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        familyId: '123e4567-e89b-12d3-a456-426614174002',
        email: 'coguardian@example.com',
        role: 'CO_GUARDIAN',
        token: 'secret-token-xyz',
        invitedBy: '123e4567-e89b-12d3-a456-426614174003',
        expiresAt: '2026-08-30T12:00:00.000Z',
        acceptedAt: null,
        createdAt: '2026-08-23T12:00:00.000Z',
      };

      expect(familyInvitationSchema.safeParse(invitation).success).toBe(true);
    });
  });
});
