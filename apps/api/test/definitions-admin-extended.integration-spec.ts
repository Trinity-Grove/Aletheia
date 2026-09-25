import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Extends the admin CRUD surface coverage (see
// definitions-admin.integration-spec.ts for the original five resources)
// to the four tables added after PR #100: RubricDefinition (+ criteria),
// EvidenceTypeDefinition, CurriculumDefinition (+ its domain/competency/
// rubric/activity join management), and ActivityDefinition (+ its
// competency/evidence-type joins). Same auth (PlatformAdminGuard), same
// shape (create + list + explicit status-transition per resource).
describe('Curriculum definitions admin API -- rubric/evidence/curriculum/activity (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `definitions-admin-ext-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Definitions Admin Ext Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it.each([
    'rubric-definitions',
    'evidence-type-definitions',
    'curriculum-definitions',
    'activity-definitions',
    'project-definitions',
  ])('lists and enforces the lifecycle of %s', async (resource) => {
    const base = `/api/v1/admin/curriculum-definitions/${resource}`;
    await supertest(app.getHttpServer()).get(base).expect(401);
    const created = await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({ code: `TEST.LIFECYCLE.${Date.now()}`, name: 'Lifecycle test' })
      .expect(201);
    expect(created.body.status).toBe('DRAFT');
    await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({ code: created.body.code, name: 'Duplicate definition' })
      .expect(400);

    const listed = await supertest(app.getHttpServer())
      .get(base)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === created.body.id)).toBe(true);

    const statusUrl = `${base}/${created.body.id}/status`;
    const published = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.publishedAt).not.toBeNull();
    await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'DRAFT' })
      .expect(400);

    // Issue #96 section 32 (Auditoria): creation and every status
    // transition are logged generically, with who and (optionally) why --
    // same log every other Definition/Version table already uses for
    // migrate/rollback, reused here for CREATE/STATUS_TRANSITION.
    const logsAfterPublish = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/version-operations/logs?code=${created.body.code}`)
      .set('Cookie', adminCookie)
      .expect(200);
    const createLog = logsAfterPublish.body.find((l: { operationType: string }) => l.operationType === 'CREATE');
    expect(createLog).toBeTruthy();
    expect(createLog.performedByUserId).toBeTruthy();
    const publishLog = logsAfterPublish.body.find(
      (l: { operationType: string; metadata: { toStatus: string } }) =>
        l.operationType === 'STATUS_TRANSITION' && l.metadata.toStatus === 'PUBLISHED',
    );
    expect(publishLog).toBeTruthy();
    expect(publishLog.metadata.fromStatus).toBe('DRAFT');

    const deprecated = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'DEPRECATED', reason: 'Superseded by a newer version for this lifecycle test.' })
      .expect(200);
    expect(deprecated.body.status).toBe('DEPRECATED');
    expect(deprecated.body.deprecatedAt).not.toBeNull();

    const logsAfterDeprecate = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/version-operations/logs?code=${created.body.code}`)
      .set('Cookie', adminCookie)
      .expect(200);
    const deprecateLog = logsAfterDeprecate.body.find(
      (l: { operationType: string; metadata: { toStatus: string } }) =>
        l.operationType === 'STATUS_TRANSITION' && l.metadata.toStatus === 'DEPRECATED',
    );
    expect(deprecateLog.metadata.reason).toBe('Superseded by a newer version for this lifecycle test.');

    await supertest(app.getHttpServer())
      .patch(`${base}/00000000-0000-0000-0000-000000000000/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(404);
  });

  it('creates a rubric definition, adds criteria, and transitions its status', async () => {
    const code = `TEST.RUBRIC.${Date.now()}`;
    const rubric = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Test Rubric' })
      .expect(201);
    expect(rubric.body.status).toBe('DRAFT');

    const criterion = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubric.body.id}/criteria`)
      .set('Cookie', adminCookie)
      .send({ code: 'CLARITY', label: 'Clareza', weight: 2 })
      .expect(201);
    expect(criterion.body.weight).toBe(2);

    const criteriaList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubric.body.id}/criteria`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(criteriaList.body.some((c: { id: string }) => c.id === criterion.body.id)).toBe(true);

    const published = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubric.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');
  });

  it('rejects a criterion on a rubric that does not exist', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions/00000000-0000-0000-0000-000000000000/criteria')
      .set('Cookie', adminCookie)
      .send({ code: 'CLARITY', label: 'Clareza' })
      .expect(404);
  });

  it('creates and lists evidence type definitions', async () => {
    const code = `TEST.EVIDENCE.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Test Evidence Type' })
      .expect(201);

    const listResponse = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listResponse.body.some((e: { id: string }) => e.id === created.body.id)).toBe(true);
  });

  it('creates a curriculum definition and links a domain, a competency, a rubric, and an activity', async () => {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CURRIC.DOMAIN.${Date.now()}`, name: 'Curriculum Test Domain' })
      .expect(201);

    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.CURRIC.COMPETENCY.${Date.now()}`,
        domainId: domain.body.id,
        title: 'Curriculum Test Competency',
      })
      .expect(201);

    const rubric = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CURRIC.RUBRIC.${Date.now()}`, name: 'Curriculum Test Rubric' })
      .expect(201);

    const activity = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/activity-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CURRIC.ACTIVITY.${Date.now()}`, name: 'Curriculum Test Activity' })
      .expect(201);

    const curriculum = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/curriculum-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CURRIC.${Date.now()}`, name: 'Curriculum Test' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/domains`)
      .set('Cookie', adminCookie)
      .send({ domainId: domain.body.id })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/competencies`)
      .set('Cookie', adminCookie)
      .send({ competencyId: competency.body.id })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/rubrics`)
      .set('Cookie', adminCookie)
      .send({ rubricId: rubric.body.id })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/activities`)
      .set('Cookie', adminCookie)
      .send({ activityId: activity.body.id })
      .expect(201);

    const domainsList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/domains`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(domainsList.body).toHaveLength(1);
    expect(domainsList.body[0].domainId).toBe(domain.body.id);

    const activitiesList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/activities`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(activitiesList.body).toHaveLength(1);
    expect(activitiesList.body[0].activityId).toBe(activity.body.id);

    // Linking the same domain twice violates the unique constraint --
    // surfaced as 400, not a raw 500.
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/domains`)
      .set('Cookie', adminCookie)
      .send({ domainId: domain.body.id })
      .expect(400);

    // Linking a domain that doesn't exist is a 400 (FK violation), not a
    // raw 500.
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/domains`)
      .set('Cookie', adminCookie)
      .send({ domainId: '00000000-0000-0000-0000-000000000000' })
      .expect(400);
  });

  it('creates an activity definition and links a competency and an evidence type', async () => {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ACT.DOMAIN.${Date.now()}`, name: 'Activity Test Domain' })
      .expect(201);

    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.ACT.COMPETENCY.${Date.now()}`,
        domainId: domain.body.id,
        title: 'Activity Test Competency',
      })
      .expect(201);

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ACT.EVIDENCE.${Date.now()}`, name: 'Activity Test Evidence Type' })
      .expect(201);

    const activity = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/activity-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.ACT.${Date.now()}`,
        name: 'Activity Test',
        supervisionRequired: true,
        evidenceRequirementMode: 'ALL',
      })
      .expect(201);
    expect(activity.body.evidenceRequirementMode).toBe('ALL');

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/activity-definitions/${activity.body.id}/competencies`)
      .set('Cookie', adminCookie)
      .send({ competencyId: competency.body.id })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/activity-definitions/${activity.body.id}/evidence-types`)
      .set('Cookie', adminCookie)
      .send({ evidenceTypeId: evidenceType.body.id })
      .expect(201);

    const competenciesList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/activity-definitions/${activity.body.id}/competencies`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(competenciesList.body).toHaveLength(1);

    const evidenceTypesList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/activity-definitions/${activity.body.id}/evidence-types`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(evidenceTypesList.body).toHaveLength(1);

    const published = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/activity-definitions/${activity.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');
  });

  // Issue #96 section 8's own literal test: "Construir uma horta" pode
  // validar Matemática, Ciências, Cultivo e Planejamento sem criar
  // lógica especial para horta. Every call below is the exact same
  // generic admin CRUD surface every other Definition/Version table
  // already uses -- nothing "garden-specific" exists anywhere in the
  // engine.
  it('creates an interdisciplinary project mapping multiple domains and competencies, with milestones and a rubric', async () => {
    const stamp = Date.now();
    const domainMath = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.MATH.${stamp}`, name: 'Matemática (Test)' })
      .expect(201);
    const domainScience = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.SCIENCE.${stamp}`, name: 'Ciências (Test)' })
      .expect(201);
    const domainGardening = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.GARDENING.${stamp}`, name: 'Cultivo (Test)' })
      .expect(201);
    const domainPlanning = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.PLANNING.${stamp}`, name: 'Planejamento (Test)' })
      .expect(201);

    const competencyMath = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.PROJ.MATH.AREA.${stamp}`,
        domainId: domainMath.body.id,
        title: 'Calcular a área do canteiro',
      })
      .expect(201);
    const competencyGardening = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.PROJ.GARDENING.SOIL.${stamp}`,
        domainId: domainGardening.body.id,
        title: 'Preparar o solo para plantio',
      })
      .expect(201);

    const rubric = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.RUBRIC.${stamp}`, name: 'Rubrica do projeto de horta' })
      .expect(201);

    const project = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/project-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `GARDEN_BUILD.${stamp}`,
        name: 'Construir uma horta',
        description: 'Projeto interdisciplinar de planejamento e cultivo de uma horta familiar.',
        estimatedDurationDays: 30,
        rubricDefinitionId: rubric.body.id,
      })
      .expect(201);
    expect(project.body.rubricDefinitionId).toBe(rubric.body.id);

    for (const domain of [domainMath, domainScience, domainGardening, domainPlanning]) {
      await supertest(app.getHttpServer())
        .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/domains`)
        .set('Cookie', adminCookie)
        .send({ domainId: domain.body.id })
        .expect(201);
    }

    for (const competency of [competencyMath, competencyGardening]) {
      await supertest(app.getHttpServer())
        .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/competencies`)
        .set('Cookie', adminCookie)
        .send({ competencyId: competency.body.id })
        .expect(201);
    }

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/milestones`)
      .set('Cookie', adminCookie)
      .send({ code: 'PLANNING', title: 'Planejar o canteiro e a lista de espécies', order: 0 })
      .expect(201);
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/milestones`)
      .set('Cookie', adminCookie)
      .send({ code: 'SOIL_PREP', title: 'Preparar o solo', order: 1 })
      .expect(201);
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/milestones`)
      .set('Cookie', adminCookie)
      .send({ code: 'HARVEST', title: 'Colher e registrar os resultados', order: 2 })
      .expect(201);

    const domainsList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/domains`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(domainsList.body).toHaveLength(4);

    const competenciesList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/competencies`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(competenciesList.body).toHaveLength(2);

    const milestonesList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/milestones`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(milestonesList.body.map((m: { code: string }) => m.code)).toEqual([
      'PLANNING',
      'SOIL_PREP',
      'HARVEST',
    ]);

    // Reusable: the same published project can be linked into a real
    // curriculum, same as any activity.
    const curriculum = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/curriculum-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PROJ.CURRICULUM.${stamp}`, name: 'Curriculum with a project' })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/projects`)
      .set('Cookie', adminCookie)
      .send({ projectId: project.body.id })
      .expect(201);
    const curriculumProjectsList = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculum.body.id}/projects`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(curriculumProjectsList.body).toHaveLength(1);
    expect(curriculumProjectsList.body[0].projectId).toBe(project.body.id);

    // Linking a domain that doesn't exist is a 400 (FK violation), not a
    // raw 500 -- same discipline as every other join in this file.
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/project-definitions/${project.body.id}/domains`)
      .set('Cookie', adminCookie)
      .send({ domainId: '00000000-0000-0000-0000-000000000000' })
      .expect(400);
  });
});
