import { ForbiddenException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FamilyService } from '../src/modules/families/application/family.service.js';

describe('Multi-Tenant Family Isolation E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();

    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === 'guardian-a-token') {
        return { userId: 'guardian-a-id', email: 'guardian-a@test.com' };
      }
      if (token === 'guardian-b-token') {
        return { userId: 'guardian-b-id', email: 'guardian-b@test.com' };
      }
      return null;
    });

    const familyService = app.get(FamilyService);
    jest.spyOn(familyService, 'getFamilyById').mockImplementation(async (userId, familyId) => {
      if (userId === 'guardian-a-id' && familyId === 'family-a-id') {
        return {
          id: 'family-a-id',
          name: 'Family Alpha',
          countryCode: 'USA',
          stateProvince: 'TX',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      if (userId === 'guardian-b-id' && familyId === 'family-b-id') {
        return {
          id: 'family-b-id',
          name: 'Family Beta',
          countryCode: 'BRA',
          stateProvince: 'SP',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      throw new ForbiddenException('You do not have access to this family.');
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows guardian to access their own family tenancy', async () => {
    const resA = await supertest(app.getHttpServer())
      .get('/api/v1/families/family-a-id')
      .set('Authorization', 'Bearer guardian-a-token')
      .expect(200);

    expect(resA.body.id).toBe('family-a-id');
    expect(resA.body.name).toBe('Family Alpha');

    const resB = await supertest(app.getHttpServer())
      .get('/api/v1/families/family-b-id')
      .set('Authorization', 'Bearer guardian-b-token')
      .expect(200);

    expect(resB.body.id).toBe('family-b-id');
    expect(resB.body.name).toBe('Family Beta');
  });

  it('strictly blocks cross-tenant family access with 403 Forbidden', async () => {
    // Guardian A tries to access Family B
    await supertest(app.getHttpServer())
      .get('/api/v1/families/family-b-id')
      .set('Authorization', 'Bearer guardian-a-token')
      .expect(403);

    // Guardian B tries to access Family A
    await supertest(app.getHttpServer())
      .get('/api/v1/families/family-a-id')
      .set('Authorization', 'Bearer guardian-b-token')
      .expect(403);
  });
});
