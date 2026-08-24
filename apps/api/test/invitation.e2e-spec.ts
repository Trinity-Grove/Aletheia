import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { InvitationService } from '../src/modules/families/application/invitation.service.js';

describe('Invitations E2E', () => {
  let app: NestFastifyApplication;

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
      return null;
    });

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
});
