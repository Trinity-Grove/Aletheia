import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { InvitationRepository } from '../infrastructure/invitation.repository.js';
import { FamilyRepository } from '../infrastructure/family.repository.js';
import { FamilyInvitationEntity } from '../domain/invitation.entity.js';

describe('InvitationService', () => {
  let service: InvitationService;
  let fakeInvitations: Map<string, FamilyInvitationEntity>;
  let mockFamilyRepo: any;
  let mockInvRepo: any;

  beforeEach(() => {
    fakeInvitations = new Map();
    mockFamilyRepo = {
      isMember: async (userId: string, familyId: string) => userId === 'owner-1' && familyId === 'family-1',
    };
    mockInvRepo = {
      create: async (data: any) => {
        const entity = new FamilyInvitationEntity({
          id: 'inv-uuid-1',
          familyId: data.familyId,
          email: data.email,
          role: data.role,
          token: data.token,
          invitedBy: data.invitedBy,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        });
        fakeInvitations.set(entity.token, entity);
        return entity;
      },
      findByToken: async (token: string) => fakeInvitations.get(token) ?? null,
      findById: async (id: string) => {
        for (const i of fakeInvitations.values()) {
          if (i.id === id) return i;
        }
        return null;
      },
      accept: async (id: string) => {
        for (const [t, i] of fakeInvitations.entries()) {
          if (i.id === id) {
            fakeInvitations.set(
              t,
              new FamilyInvitationEntity({
                id: i.id,
                familyId: i.familyId,
                email: i.email,
                role: i.role,
                token: i.token,
                invitedBy: i.invitedBy,
                expiresAt: i.expiresAt,
                acceptedAt: new Date(),
                createdAt: i.createdAt,
              }),
            );
          }
        }
      },
      delete: async (id: string) => {
        for (const [t, i] of fakeInvitations.entries()) {
          if (i.id === id) {
            fakeInvitations.delete(t);
          }
        }
      },
    };

    service = new InvitationService(mockInvRepo as InvitationRepository, mockFamilyRepo as FamilyRepository);
  });

  it('creates an invitation token for a family member', async () => {
    const inv = await service.createInvitation('owner-1', 'family-1', {
      email: 'coguardian@test.com',
      role: 'CO_GUARDIAN',
    });

    expect(inv.token).toBeDefined();
    expect(inv.email).toBe('coguardian@test.com');
  });

  it('rejects invitation creation from non-family members', async () => {
    await expect(
      service.createInvitation('stranger', 'family-1', {
        email: 'coguardian@test.com',
        role: 'CO_GUARDIAN',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows accepting a valid invitation token', async () => {
    const inv = await service.createInvitation('owner-1', 'family-1', {
      email: 'coguardian@test.com',
      role: 'CO_GUARDIAN',
    });

    const result = await service.acceptInvitation('user-2', inv.token!);
    expect(result.success).toBe(true);
    expect(result.familyId).toBe('family-1');
  });

  it('rejects already accepted invitations', async () => {
    const inv = await service.createInvitation('owner-1', 'family-1', {
      email: 'coguardian@test.com',
      role: 'CO_GUARDIAN',
    });

    await service.acceptInvitation('user-2', inv.token!);

    await expect(
      service.acceptInvitation('user-3', inv.token!),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid or missing invitation token', async () => {
    await expect(
      service.acceptInvitation('user-2', 'non-existent-token'),
    ).rejects.toThrow(NotFoundException);
  });
});
