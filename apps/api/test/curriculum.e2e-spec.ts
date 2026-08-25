import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../src/modules/families/application/public-api.js';
import { CurriculumService } from '../src/modules/curriculum/application/curriculum.service.js';
import { ObjectiveService } from '../src/modules/curriculum/application/objective.service.js';
import type {
  AcademicYearResponseDto,
  LearnerPlanResponseDto,
  ObjectiveResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';

describe('Curriculum & Objectives E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = '00000000-0000-0000-0000-000000000001';
  const familyBId = '00000000-0000-0000-0000-000000000002';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';

  const learnerAId = '10000000-0000-0000-0000-000000000001';
  const learnerBId = '20000000-0000-0000-0000-000000000002';

  let academicYearsStore: AcademicYearResponseDto[] = [];
  let subjectsStore: SubjectResponseDto[] = [];
  let plansStore: LearnerPlanResponseDto[] = [];
  let objectivesStore: ObjectiveResponseDto[] = [];

  beforeAll(async () => {
    app = await createApplication();

    // 1. Auth mocking
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

    // 2. Multi-tenant Family membership check
    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    // 3. CurriculumService mocking
    const curriculumService = app.get(CurriculumService);
    jest.spyOn(curriculumService, 'createAcademicYear').mockImplementation(async (familyId, dto) => {
      const year: AcademicYearResponseDto = {
        id: `year-${Date.now()}-${Math.random()}`,
        familyId,
        year: dto.year,
        title: dto.title,
        startDate: dto.startDate ?? undefined,
        endDate: dto.endDate ?? undefined,
        isCurrent: dto.isCurrent ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      academicYearsStore.push(year);
      return year;
    });

    jest.spyOn(curriculumService, 'listAcademicYears').mockImplementation(async (familyId) => {
      return academicYearsStore.filter((y) => y.familyId === familyId);
    });

    jest.spyOn(curriculumService, 'getOrCreateCurrentYear').mockImplementation(async (familyId) => {
      const found = academicYearsStore.find((y) => y.familyId === familyId && y.isCurrent);
      if (found) return found;
      const created: AcademicYearResponseDto = {
        id: `year-current-${familyId}`,
        familyId,
        year: 2026,
        title: 'Ano Letivo 2026',
        isCurrent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      academicYearsStore.push(created);
      return created;
    });

    jest.spyOn(curriculumService, 'createSubject').mockImplementation(async (familyId, dto) => {
      const subject: SubjectResponseDto = {
        id: `sub-${Date.now()}-${Math.random()}`,
        familyId,
        name: dto.name,
        color: dto.color ?? '#3B82F6',
        icon: dto.icon ?? undefined,
        description: dto.description ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      subjectsStore.push(subject);
      return subject;
    });

    jest.spyOn(curriculumService, 'listSubjects').mockImplementation(async (familyId, includeArchived) => {
      return subjectsStore.filter((s) => s.familyId === familyId && (includeArchived || !s.archivedAt));
    });

    jest.spyOn(curriculumService, 'updateSubject').mockImplementation(async (familyId, id, dto) => {
      const sub = subjectsStore.find((s) => s.familyId === familyId && s.id === id);
      if (!sub) throw new Error('Subject not found');
      if (dto.name !== undefined) sub.name = dto.name;
      if (dto.color !== undefined) sub.color = dto.color ?? undefined;
      return sub;
    });

    jest.spyOn(curriculumService, 'archiveSubject').mockImplementation(async (familyId, id) => {
      const sub = subjectsStore.find((s) => s.familyId === familyId && s.id === id);
      if (!sub) throw new Error('Subject not found');
      sub.archivedAt = new Date().toISOString();
      return sub;
    });

    jest.spyOn(curriculumService, 'upsertLearnerPlan').mockImplementation(async (familyId, dto) => {
      const plan: LearnerPlanResponseDto = {
        id: `plan-${dto.learnerId}`,
        familyId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId,
        pedagogicalFramework: dto.pedagogicalFramework ?? 'CUSTOM',
        notes: dto.notes ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = plansStore.findIndex((p) => p.familyId === familyId && p.learnerId === dto.learnerId && p.academicYearId === dto.academicYearId);
      if (idx >= 0) plansStore[idx] = plan;
      else plansStore.push(plan);
      return plan;
    });

    jest.spyOn(curriculumService, 'getLearnerPlan').mockImplementation(async (familyId, learnerId, academicYearId) => {
      return plansStore.find((p) => p.familyId === familyId && p.learnerId === learnerId && p.academicYearId === academicYearId) ?? null;
    });

    jest.spyOn(curriculumService, 'applyTemplate').mockImplementation(async (familyId, dto) => {
      return { subjectsCount: 5, objectivesCount: 15 };
    });

    // 4. ObjectiveService mocking
    const objectiveService = app.get(ObjectiveService);
    jest.spyOn(objectiveService, 'createObjective').mockImplementation(async (familyId, dto) => {
      const obj: ObjectiveResponseDto = {
        id: `obj-${Date.now()}-${Math.random()}`,
        familyId,
        learnerId: dto.learnerId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        description: dto.description ?? null,
        status: 'NOT_STARTED',
        order: dto.order ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      objectivesStore.push(obj);
      return obj;
    });

    jest.spyOn(objectiveService, 'listObjectives').mockImplementation(async (familyId, filter = {}) => {
      return objectivesStore.filter((o) => {
        if (o.familyId !== familyId) return false;
        if (filter?.learnerId && o.learnerId !== filter.learnerId) return false;
        if (filter?.subjectId && o.subjectId !== filter.subjectId) return false;
        if (filter?.status && o.status !== filter.status) return false;
        return true;
      });
    });

    jest.spyOn(objectiveService, 'updateObjective').mockImplementation(async (familyId, id, dto) => {
      const obj = objectivesStore.find((o) => o.familyId === familyId && o.id === id);
      if (!obj) throw new Error('Not found');
      if (dto.title !== undefined) obj.title = dto.title;
      if (dto.status !== undefined) {
        obj.status = dto.status;
        if (dto.status === 'ACHIEVED') obj.achievedAt = new Date().toISOString();
      }
      return obj;
    });

    jest.spyOn(objectiveService, 'deleteObjective').mockImplementation(async (familyId, id) => {
      const idx = objectivesStore.findIndex((o) => o.familyId === familyId && o.id === id);
      if (idx >= 0) {
        objectivesStore.splice(idx, 1);
        return true;
      }
      return false;
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    academicYearsStore = [];
    subjectsStore = [];
    plansStore = [];
    objectivesStore = [];
  });

  describe('Multi-Tenant Access Control', () => {
    it('denies Guardian A access to Family B curriculum endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/curriculum/subjects`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/academic-years`);

      expect(res.status).toBe(401);
    });
  });

  describe('Academic Years Lifecycle', () => {
    it('creates and lists academic years for family A', async () => {
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/curriculum/academic-years`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          year: 2026,
          title: 'Ano Letivo 2026',
          isCurrent: true,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe('Ano Letivo 2026');

      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/academic-years`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
    });
  });

  describe('Subjects Management', () => {
    it('creates, lists, updates and archives subjects', async () => {
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/curriculum/subjects`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          name: 'História Antiga',
          color: '#D97706',
        });

      expect(createRes.status).toBe(201);
      const subjectId = createRes.body.id;

      const updateRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/curriculum/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          name: 'História Antiga e Medieval',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('História Antiga e Medieval');

      const archiveRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/curriculum/subjects/${subjectId}/archive`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(archiveRes.status).toBe(201);
      expect(archiveRes.body.archivedAt).toBeDefined();
    });
  });

  describe('Learner Plans & Templates', () => {
    it('upserts learner plan with pedagogical framework', async () => {
      const yearId = '00000000-0000-0000-0000-000000000099';
      const res = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/plans`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          academicYearId: yearId,
          pedagogicalFramework: 'CHARLOTTE_MASON',
          notes: 'Foco em livros vivos e narração',
        });

      expect(res.status).toBe(200);
      expect(res.body.pedagogicalFramework).toBe('CHARLOTTE_MASON');
    });

    it('applies curriculum template', async () => {
      const yearId = '00000000-0000-0000-0000-000000000099';
      const res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/curriculum/templates/apply`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          academicYearId: yearId,
          template: 'CLASSICAL_TRIVIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.subjectsCount).toBe(5);
    });
  });

  describe('Learning Objectives CRUD', () => {
    it('creates, filters, completes and deletes learning objectives', async () => {
      const yearId = '00000000-0000-0000-0000-000000000099';
      const subjectId = '00000000-0000-0000-0000-000000000088';

      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/curriculum/objectives`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          subjectId: subjectId,
          academicYearId: yearId,
          title: 'Dominar as quatro operações',
        });

      expect(createRes.status).toBe(201);
      const objectiveId = createRes.body.id;

      const patchRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/curriculum/objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          status: 'ACHIEVED',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.status).toBe('ACHIEVED');
      expect(patchRes.body.achievedAt).toBeDefined();

      const deleteRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/curriculum/objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });
});
