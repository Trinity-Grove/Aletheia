import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FamilyService } from '../src/modules/families/application/family.service.js';

describe('Families E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();

    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === 'guardian-token') {
        return {
          userId: 'guardian-uuid-1',
          email: 'guardian@test.com',
        };
      }
      return null;
    });

    const familyService = app.get(FamilyService);
    jest.spyOn(familyService, 'createFamily').mockImplementation(async (userId, dto) => {
      return {
        id: 'family-e2e-1',
        name: dto.name,
        countryCode: dto.countryCode,
        stateProvince: dto.stateProvince ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: [
          {
            id: 'member-e2e-1',
            familyId: 'family-e2e-1',
            userId,
            role: 'OWNER_GUARDIAN',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    jest.spyOn(familyService, 'getMyFamilies').mockImplementation(async (_userId) => {
      return [
        {
          id: 'family-e2e-1',
          name: 'Faithful Family',
          countryCode: 'BRA',
          stateProvince: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    });
    jest.spyOn(familyService, 'getFamilyById').mockImplementation(async (_userId, familyId) => {
      if (familyId === 'family-e2e-1') {
        return {
          id: 'family-e2e-1',
          name: 'Faithful Family',
          countryCode: 'BRA',
          stateProvince: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException('Forbidden');
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/families creates family when authenticated', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', 'Bearer guardian-token')
      .send({
        name: 'Faithful Family',
        countryCode: 'BRA',
      })
      .expect(201);

    expect(response.body.id).toBe('family-e2e-1');
    expect(response.body.name).toBe('Faithful Family');
  });

  it('GET /api/v1/families/mine returns families of authenticated guardian', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/api/v1/families/mine')
      .set('Authorization', 'Bearer guardian-token')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Faithful Family');
  });

  it('GET /api/v1/families/:id returns 401 when unauthenticated', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/families/family-e2e-1')
      .expect(401);
  });
});
