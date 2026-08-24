import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../src/modules/families/application/public-api.js';
import { LearnerService } from '../src/modules/learners/application/learner.service.js';
import type { LearnerResponseDto } from '@aletheia/contracts';

describe('Learners E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = 'family-a-id';
  const familyBId = 'family-b-id';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';

  let learnersStore: Array<LearnerResponseDto> = [];

  beforeAll(async () => {
    app = await createApplication();

    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: 'guardian-a@test.com' };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: 'guardian-b@test.com' };
      }
      return null;
    });

    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    const learnerService = app.get(LearnerService);

    jest.spyOn(learnerService, 'createLearner').mockImplementation(async (familyId, dto) => {
      const newLearner: LearnerResponseDto = {
        id: `learner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        preferredName: dto.preferredName ?? null,
        birthDate: dto.birthDate,
        stage: dto.stage ?? 'PRIMARY_GRAMMAR',
        customGrade: dto.customGrade ?? null,
        avatarColor: dto.avatarColor ?? null,
        specialNeeds: dto.specialNeeds ?? null,
        notes: dto.notes ?? null,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      learnersStore.push(newLearner);
      return newLearner;
    });

    jest.spyOn(learnerService, 'getFamilyLearners').mockImplementation(async (familyId, includeArchived) => {
      return learnersStore
        .filter((l) => l.familyId === familyId && (includeArchived || !l.archivedAt))
        .map((l) => ({ ...l }));
    });

    jest.spyOn(learnerService, 'getLearnerById').mockImplementation(async (familyId, learnerId) => {
      const found = learnersStore.find((l) => l.familyId === familyId && l.id === learnerId);
      if (!found) {
        throw new NotFoundException(`Learner not found: ${learnerId}`);
      }
      return { ...found };
    });

    jest.spyOn(learnerService, 'updateLearner').mockImplementation(async (familyId, learnerId, dto): Promise<LearnerResponseDto> => {
      const idx = learnersStore.findIndex((l) => l.familyId === familyId && l.id === learnerId);
      if (idx === -1) {
        throw new NotFoundException(`Learner not found: ${learnerId}`);
      }
      const current = learnersStore[idx]!;
      const updated: LearnerResponseDto = {
        ...current,
        ...dto,
        id: current.id,
        familyId: current.familyId,
        firstName: dto.firstName ?? current.firstName,
        birthDate: dto.birthDate ?? current.birthDate,
        stage: dto.stage ?? current.stage,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      learnersStore[idx] = updated;
      return { ...updated };
    });

    jest.spyOn(learnerService, 'archiveLearner').mockImplementation(async (familyId, learnerId): Promise<LearnerResponseDto> => {
      const idx = learnersStore.findIndex((l) => l.familyId === familyId && l.id === learnerId);
      if (idx === -1) {
        throw new NotFoundException(`Learner not found: ${learnerId}`);
      }
      const current = learnersStore[idx]!;
      const updated: LearnerResponseDto = {
        ...current,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      learnersStore[idx] = updated;
      return { ...updated };
    });

    jest.spyOn(learnerService, 'reactivateLearner').mockImplementation(async (familyId, learnerId): Promise<LearnerResponseDto> => {
      const idx = learnersStore.findIndex((l) => l.familyId === familyId && l.id === learnerId);
      if (idx === -1) {
        throw new NotFoundException(`Learner not found: ${learnerId}`);
      }
      const current = learnersStore[idx]!;
      const updated: LearnerResponseDto = {
        ...current,
        archivedAt: null,
        updatedAt: new Date().toISOString(),
      };
      learnersStore[idx] = updated;
      return { ...updated };
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    learnersStore = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Access', () => {
    it('returns 401 Unauthorized when no auth token is provided', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/learners`)
        .send({ firstName: 'Test', birthDate: '2016-05-15' })
        .expect(401);
    });

    it('returns 401 Unauthorized when invalid auth token is provided', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Multi-Tenant Isolation & Security Boundary', () => {
    it('returns 403 Forbidden when Guardian B attempts to access Family A learners', async () => {
      // Guardian B tries to list Family A's learners
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);

      // Guardian B tries to create a learner in Family A
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .send({ firstName: 'Intruder', birthDate: '2016-05-15' })
        .expect(403);

      // Guardian A tries to access Family B's endpoints
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/learners`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });
  });

  describe('Learner Lifecycle & Operations within Tenancy', () => {
    it('allows guardian to create, list, fetch, update, archive, and reactivate a learner profile', async () => {
      // 1. Create Learner
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          preferredName: 'Johnny',
          birthDate: '2016-05-15',
          stage: 'PRIMARY_GRAMMAR',
          notes: 'Loves reading and history',
        })
        .expect(201);

      const learnerId = createRes.body.id;
      expect(learnerId).toBeDefined();
      expect(createRes.body.firstName).toBe('John');
      expect(createRes.body.lastName).toBe('Doe');
      expect(createRes.body.preferredName).toBe('Johnny');
      expect(createRes.body.stage).toBe('PRIMARY_GRAMMAR');
      expect(createRes.body.archivedAt).toBeNull();

      // 2. List Learners (Active)
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(learnerId);

      // 3. Get Learner by ID
      const getRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners/${learnerId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(getRes.body.id).toBe(learnerId);
      expect(getRes.body.firstName).toBe('John');

      // 4. Update Learner
      const updateRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/learners/${learnerId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          preferredName: 'John D.',
          stage: 'MIDDLE_LOGIC',
        })
        .expect(200);

      expect(updateRes.body.preferredName).toBe('John D.');
      expect(updateRes.body.stage).toBe('MIDDLE_LOGIC');

      // 5. Archive (Soft-Delete) Learner
      const archiveRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/learners/${learnerId}/archive`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(archiveRes.body.archivedAt).not.toBeNull();

      // 6. List Learners - without includeArchived should return empty list
      const listAfterArchive = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listAfterArchive.body).toHaveLength(0);

      // 7. List Learners - with includeArchived=true should return the archived learner
      const listWithArchived = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners?includeArchived=true`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listWithArchived.body).toHaveLength(1);
      expect(listWithArchived.body[0].id).toBe(learnerId);
      expect(listWithArchived.body[0].archivedAt).not.toBeNull();

      // 8. Reactivate Learner
      const reactivateRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/learners/${learnerId}/reactivate`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(reactivateRes.body.archivedAt).toBeNull();

      // 9. List Learners - should now show as active again
      const listAfterReactivation = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/learners`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listAfterReactivation.body).toHaveLength(1);
      expect(listAfterReactivation.body[0].id).toBe(learnerId);
      expect(listAfterReactivation.body[0].archivedAt).toBeNull();
    });
  });
});
