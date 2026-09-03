import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { InvitationService } from '../src/modules/families/application/invitation.service.js';
import { FamilyRepository } from '../src/modules/families/infrastructure/family.repository.js';
import { InvitationRepository } from '../src/modules/families/infrastructure/invitation.repository.js';
import { FamilyInvitationEntity } from '../src/modules/families/domain/invitation.entity.js';

describe('Invitations E2E', () => {
  let app: NestFastifyApplication;

  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';
  const familyAId = 'family-a-id';
  const familyBId = 'family-b-id';

  beforeAll(async () => {
    app = await createApplication();

    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === 'valid-token') {
        return {
          userId: 'user-uuid-1',
          email: 'guardian@test.com',
        };
      }
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: 'guardian-a@test.com' };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: 'guardian-b@test.com' };
      }
      return null;
    });

    const familyRepository = app.get(FamilyRepository);
    jest.spyOn(familyRepository, 'isMember').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    const familyBInvitation = new FamilyInvitationEntity({
      id: 'inv-family-b-1',
      familyId: familyBId,
      email: 'someone@test.com',
      role: 'CO_GUARDIAN',
      invitedBy: guardianBUserId,
      expiresAt: new Date(Date.now() + 86400000),
      acceptedAt: null,
      createdAt: new Date(),
    });

    const invitationRepository = app.get(InvitationRepository);
    jest.spyOn(invitationRepository, 'findByFamilyId').mockImplementation(async (familyId) => {
      return familyId === familyBId ? [familyBInvitation] : [];
    });
    jest.spyOn(invitationRepository, 'findById').mockImplementation(async (id) => {
      return id === familyBInvitation.id ? familyBInvitation : null;
    });
    jest.spyOn(invitationRepository, 'delete').mockResolvedValue(undefined);

    const invitationService = app.get(InvitationService);
    jest.spyOn(invitationService, 'createInvitation').mockImplementation(async (userId, familyId, dto) => {
      return {
        id: 'inv-e2e-1',
        familyId,
        email: dto.email,
        role: dto.role,
        token: 'token-abc-123',
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        acceptedAt: null,
        createdAt: new Date().toISOString(),
      };
    });
    jest.spyOn(invitationService, 'acceptInvitation').mockImplementation(async (_userId, token) => {
      if (token === 'token-abc-123') {
        return {
          success: true,
          familyId: 'family-e2e-1',
        };
      }
      throw new NotFoundException('Invitation not found.');
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/families/:familyId/invitations creates invitation when authenticated', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/families/family-e2e-1/invitations')
      .set('Authorization', 'Bearer valid-token')
      .send({
        email: 'invited@test.com',
        role: 'CO_GUARDIAN',
      })
      .expect(201);

    expect(response.body.token).toBe('token-abc-123');
    expect(response.body.email).toBe('invited@test.com');
  });

  it('POST /api/v1/invitations/:token/accept accepts invitation', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/invitations/token-abc-123/accept')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.familyId).toBe('family-e2e-1');
  });

  describe('Multi-Tenant Access Control', () => {
    it('allows a member to list their own family invitations', async () => {
      const response = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/invitations`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].familyId).toBe(familyBId);
    });

    it('denies Guardian A listing Family B invitations', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/invitations`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });

    it('denies Guardian A canceling a Family B invitation', async () => {
      await supertest(app.getHttpServer())
        .delete('/api/v1/invitations/inv-family-b-1')
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });

    it('allows a member to cancel their own family invitation', async () => {
      await supertest(app.getHttpServer())
        .delete('/api/v1/invitations/inv-family-b-1')
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(204);
    });

    it('rejects unauthenticated requests', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/invitations`)
        .expect(401);
    });
  });
});
