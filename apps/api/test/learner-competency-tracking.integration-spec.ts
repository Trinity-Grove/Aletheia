import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Learner competency tracking (issue #126 item 3) against real Postgres.
// This is the missing link that makes a CurriculumDefinition's bundled
// competencies into a family's actual per-learner working set --
// activating a curriculum fans out over its CurriculumDefinitionCompetency
// joins and creates one LearnerCompetencyTracking row per competency,
// snapshotting the exact version reached at activation time.
describe('Learner Competency Tracking (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyACookie: string;
  let familyAId: string;
  let familyALearnerId: string;
  let familyBCookie: string;
  let familyBId: string;
  let familyBLearnerId: string;
  const adminEmail = `competency-tracking-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerWithFamilyAndLearner(
    prefix: string,
  ): Promise<{ cookie: string; familyId: string; learnerId: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Competency Tracking Test Guardian' })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);
    const familyId = familyResponse.body.id;

    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Test', lastName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);

    return { cookie, familyId, learnerId: learnerResponse.body.id };
  }

  async function createCompetency(codeSuffix: string): Promise<{ id: string; version: number }> {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRACKING.DOMAIN.${codeSuffix}`, name: 'Tracking Test Domain' })
      .expect(201);
    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRACKING.COMPETENCY.${codeSuffix}`, domainId: domain.body.id, title: 'Tracking Test Competency' })
      .expect(201);
    return { id: competency.body.id, version: competency.body.version };
  }

  async function createPublishedCurriculumWithCompetencies(
    codeSuffix: string,
    competencyIds: string[],
  ): Promise<{ id: string; code: string }> {
    const curriculum = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/curriculum-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRACKING.CURRICULUM.${codeSuffix}`, name: 'Tracking Test Curriculum' })
      .expect(201);

    for (const competencyId of competencyIds) {
      await supertest(app.getHttpServer())
        .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/competencies`)
        .set('Cookie', adminCookie)
        .send({ competencyId })
        .expect(201);
    }

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    return { id: curriculum.body.id, code: curriculum.body.code };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Competency Tracking Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyA = await registerWithFamilyAndLearner('tracking-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyALearnerId = familyA.learnerId;

    const familyB = await registerWithFamilyAndLearner('tracking-family-b');
    familyBCookie = familyB.cookie;
    familyBId = familyB.familyId;
    familyBLearnerId = familyB.learnerId;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('activates a curriculum for a learner, creating one tracking row per competency', async () => {
    const suffix = `ACTIVATE.${Date.now()}`;
    const competencyOne = await createCompetency(`${suffix}.A`);
    const competencyTwo = await createCompetency(`${suffix}.B`);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [
      competencyOne.id,
      competencyTwo.id,
    ]);

    const activation = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: curriculum.id })
      .expect(201);

    expect(activation.body.createdCount).toBe(2);
    expect(activation.body.alreadyActiveCount).toBe(0);
    expect(activation.body.trackings).toHaveLength(2);
    const trackedCompetencyIds = activation.body.trackings.map((t: { competencyDefinitionId: string }) => t.competencyDefinitionId);
    expect(trackedCompetencyIds).toContain(competencyOne.id);
    expect(trackedCompetencyIds).toContain(competencyTwo.id);
    for (const tracking of activation.body.trackings) {
      expect(tracking.status).toBe('ACTIVE');
      expect(tracking.curriculumDefinitionId).toBe(curriculum.id);
      expect(tracking.competencyVersion).toBe(1);
      expect(tracking.competency.title).toBe('Tracking Test Competency');
    }
  });

  it('is idempotent: activating the same curriculum for the same learner twice does not duplicate rows', async () => {
    const suffix = `IDEMPOTENT.${Date.now()}`;
    const competency = await createCompetency(suffix);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [competency.id]);

    const first = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: curriculum.id })
      .expect(201);
    expect(first.body.createdCount).toBe(1);

    const second = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: curriculum.id })
      .expect(201);
    expect(second.body.createdCount).toBe(0);
    expect(second.body.alreadyActiveCount).toBe(1);
    expect(second.body.trackings).toHaveLength(1);

    const list = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/competency-tracking`)
      .set('Cookie', familyACookie)
      .query({ learnerId: familyALearnerId })
      .expect(200);
    const matching = list.body.filter(
      (t: { competencyDefinitionId: string }) => t.competencyDefinitionId === competency.id,
    );
    expect(matching).toHaveLength(1);
  });

  it('lists a learner tracked competencies and supports retiring one', async () => {
    const suffix = `LISTRETIRE.${Date.now()}`;
    const competency = await createCompetency(suffix);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [competency.id]);

    const activation = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: curriculum.id })
      .expect(201);
    const trackingId = activation.body.trackings[0].id;

    const activeList = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/competency-tracking`)
      .set('Cookie', familyACookie)
      .query({ learnerId: familyALearnerId, status: 'ACTIVE' })
      .expect(200);
    expect(activeList.body.map((t: { id: string }) => t.id)).toContain(trackingId);

    const retired = await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyAId}/curriculum/competency-tracking/${trackingId}/retire`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(retired.body.status).toBe('RETIRED');
    expect(retired.body.retiredAt).toBeTruthy();

    const activeListAfter = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/competency-tracking`)
      .set('Cookie', familyACookie)
      .query({ learnerId: familyALearnerId, status: 'ACTIVE' })
      .expect(200);
    expect(activeListAfter.body.map((t: { id: string }) => t.id)).not.toContain(trackingId);
  });

  it('rejects activation for a learner that does not belong to the family', async () => {
    const suffix = `CROSSLEARNER.${Date.now()}`;
    const competency = await createCompetency(suffix);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [competency.id]);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyBLearnerId, curriculumDefinitionId: curriculum.id })
      .expect(404);
  });

  it('rejects activation of a curriculum that does not exist, 404 not 500', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
  });

  it('rejects activation of a curriculum with no competencies, 400 not silently a no-op', async () => {
    const emptyCurriculum = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/curriculum-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRACKING.EMPTY.${Date.now()}`, name: 'Empty Curriculum' })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${emptyCurriculum.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: emptyCurriculum.body.id })
      .expect(400);
  });

  it('tenant isolation: family B cannot list or retire family A tracked competencies', async () => {
    const suffix = `ISOLATION.${Date.now()}`;
    const competency = await createCompetency(suffix);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [competency.id]);

    const activation = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyACookie)
      .send({ learnerId: familyALearnerId, curriculumDefinitionId: curriculum.id })
      .expect(201);
    const trackingId = activation.body.trackings[0].id;

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/competency-tracking`)
      .set('Cookie', familyBCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyAId}/curriculum/competency-tracking/${trackingId}/retire`)
      .set('Cookie', familyBCookie)
      .expect(403);

    const ownList = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyBId}/curriculum/competency-tracking`)
      .set('Cookie', familyBCookie)
      .expect(200);
    expect(ownList.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: trackingId })]),
    );
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/competency-tracking`)
      .expect(401);
  });

  it('lists published curriculum definitions and evidence types via the new family-facing catalogs', async () => {
    const suffix = `CATALOG.${Date.now()}`;
    const competency = await createCompetency(suffix);
    const curriculum = await createPublishedCurriculumWithCompetencies(suffix, [competency.id]);

    const curriculumCatalog = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/curriculum-definitions/catalog`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(curriculumCatalog.body.map((c: { id: string }) => c.id)).toContain(curriculum.id);

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRACKING.EVIDENCETYPE.${suffix}`, name: 'Tracking Test Evidence Type' })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/evidence-type-definitions/${evidenceType.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const evidenceTypeCatalog = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/evidence-types/catalog`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(evidenceTypeCatalog.body.map((e: { id: string }) => e.id)).toContain(evidenceType.body.id);
  });

  it('lists only executable published progression policies in the family catalog', async () => {
    const suffix = `POLICYCATALOG.${Date.now()}`;
    const supported = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.TRACKING.POLICY.${suffix}`,
        name: 'Tracking Test Evidence Policy',
        policyType: 'EVIDENCE_COUNT',
        rules: { minimumEvidenceCount: 2, prerequisites: [] },
      })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/progression-policies/${supported.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const unsupported = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.TRACKING.UNSUPPORTED_POLICY.${suffix}`,
        name: 'Unsupported Tracking Policy',
        policyType: 'HOURS',
        rules: { minimumHours: 2 },
      })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/progression-policies/${unsupported.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const catalog = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/progression-policies/catalog`)
      .set('Cookie', familyACookie)
      .expect(200);

    expect(catalog.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: supported.body.id,
        code: supported.body.code,
        policyType: 'EVIDENCE_COUNT',
        minimumEvidenceCount: 2,
      }),
    ]));
    expect(catalog.body).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: unsupported.body.id }),
    ]));
  });
});
