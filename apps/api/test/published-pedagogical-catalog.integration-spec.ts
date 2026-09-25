import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { PedagogicalModelDefinitionResponseDto, TemplateSubjectDefinition } from '@aletheia/contracts';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { CurriculumTemplateEngine } from '../src/modules/curriculum/infrastructure/curriculum-template.engine.js';

type FamilyFixture = { cookie: string; familyId: string; learnerId: string; academicYearId: string };

describe('Published pedagogical catalog (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const previousAdminEmails = process.env.PLATFORM_ADMIN_EMAILS;
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2).toUpperCase()}`;
  const adminEmail = `catalog-admin-${unique}@example.com`;
  const definitionsUrl = '/api/v1/admin/curriculum-definitions/pedagogical-model-definitions';
  const subjects: [TemplateSubjectDefinition] = [{
    name: 'Community observation', color: '#123ABC', icon: 'compass',
    description: 'Content authored through the catalog API.',
    starterObjectives: ['Observe a local habitat', 'Record three findings'],
  }];

  async function register(email: string): Promise<string> {
    const response = await supertest(app.getHttpServer()).post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Catalog Acceptance', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true }).expect(201);
    const cookie = [response.headers['set-cookie']].flat()
      .find((value) => value?.startsWith('aletheia_session='));
    expect(cookie).toBeDefined();
    return cookie!;
  }

  async function family(label: string): Promise<FamilyFixture> {
    const cookie = await register(`catalog-${label}-${unique}@example.com`);
    const created = await supertest(app.getHttpServer()).post('/api/v1/families')
      .set('Cookie', cookie).send({ name: `Catalog ${label}`, countryCode: 'BR' }).expect(201);
    const familyId = created.body.id as string;
    const learner = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie).send({ firstName: 'Learner', birthDate: '2017-03-10', acceptedDataConsent: true }).expect(201);
    const year = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum/academic-years`).set('Cookie', cookie)
      .send({ year: 2026, title: 'Catalog acceptance year', isCurrent: true }).expect(201);
    return { cookie, familyId, learnerId: learner.body.id, academicYearId: year.body.id };
  }

  async function createModel(code: string, version = 1, content: TemplateSubjectDefinition[] = subjects): Promise<string> {
    const response = await supertest(app.getHttpServer()).post(definitionsUrl).set('Cookie', adminCookie)
      .send({ code, version, name: 'API-authored model', metadata: { subjects: content } }).expect(201);
    expect(response.body.status).toBe('DRAFT');
    return response.body.id as string;
  }

  async function publish(id: string): Promise<void> {
    await supertest(app.getHttpServer()).patch(`${definitionsUrl}/${id}/status`)
      .set('Cookie', adminCookie).send({ status: 'PUBLISHED' }).expect(200);
  }

  function apply(target: FamilyFixture, template: string, overrides: Partial<FamilyFixture> = {}) {
    return supertest(app.getHttpServer())
      .post(`/api/v1/families/${target.familyId}/curriculum/templates/apply`)
      .set('Cookie', target.cookie).send({ learnerId: target.learnerId,
        academicYearId: target.academicYearId, ...overrides, template });
  }

  async function snapshot(target: FamilyFixture) {
    const base = `/api/v1/families/${target.familyId}/curriculum`;
    const [subjectResponse, objectiveResponse, planResponse] = await Promise.all([
      supertest(app.getHttpServer()).get(`${base}/subjects`).set('Cookie', target.cookie).expect(200),
      supertest(app.getHttpServer()).get(`${base}/objectives`).set('Cookie', target.cookie).expect(200),
      supertest(app.getHttpServer()).get(`${base}/plans`).set('Cookie', target.cookie)
        .query({ learnerId: target.learnerId, academicYearId: target.academicYearId }).expect(200),
    ]);
    return { subjects: subjectResponse.body, objectives: objectiveResponse.body, plan: planResponse.body };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    adminCookie = await register(adminEmail);
  });

  afterAll(async () => {
    try { await app?.close(); } finally {
      if (previousAdminEmails === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
      else process.env.PLATFORM_ADMIN_EMAILS = previousAdminEmails;
    }
  });

  it('applies an admin-authored code and pins its version until explicit reapplication', async () => {
    const target = await family('published');
    const code = `ACCEPTANCE.NEW_MODEL.${unique}`;
    const firstId = await createModel(code);
    await publish(firstId);
    const applied = await apply(target, code).expect(201);
    expect(applied.body).toEqual({ subjectsCount: 1, objectivesCount: 2 });
    const first = await snapshot(target);
    expect(first.subjects).toHaveLength(1);
    expect(first.subjects[0]).toMatchObject({ name: subjects[0].name, color: subjects[0].color,
      icon: subjects[0].icon, description: subjects[0].description, familyId: target.familyId });
    expect(first.objectives).toHaveLength(2);
    expect(first.objectives).toEqual(expect.arrayContaining(subjects[0].starterObjectives.map((title) =>
      expect.objectContaining({ title, learnerId: target.learnerId, academicYearId: target.academicYearId,
        subjectId: first.subjects[0].id }))));
    expect(first.plan).toMatchObject({ pedagogicalModelDefinitionId: firstId, pedagogicalFramework: 'CUSTOM' });

    const secondId = await createModel(code, 2, [{ ...subjects[0], name: 'Community mapping',
      starterObjectives: ['Draw a habitat map'] }]);
    await publish(secondId);
    expect(await snapshot(target)).toEqual(first);
    for (const update of [{ notes: 'Updated notes' }, { pedagogicalFramework: 'CUSTOM', notes: 'Legacy UI edit' }]) {
      const edited = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${target.familyId}/curriculum/plans`).set('Cookie', target.cookie)
        .send({ learnerId: target.learnerId, academicYearId: target.academicYearId, ...update }).expect(200);
      expect(edited.body).toMatchObject({ id: first.plan.id, pedagogicalModelDefinitionId: firstId,
        pedagogicalFramework: 'CUSTOM', notes: update.notes });
      const afterEdit = await snapshot(target);
      expect(afterEdit.plan.pedagogicalModelDefinitionId).toBe(firstId);
      expect(afterEdit.subjects).toEqual(first.subjects);
      expect(afterEdit.objectives).toEqual(first.objectives);
    }
    expect((await apply(target, code).expect(201)).body).toEqual({ subjectsCount: 1, objectivesCount: 1 });
    const second = await snapshot(target);
    expect(second.plan).toMatchObject({ id: first.plan.id, pedagogicalModelDefinitionId: secondId });
    expect(second.subjects).toHaveLength(2);
    expect(second.objectives).toHaveLength(3);
    expect(second.objectives).toEqual(expect.arrayContaining(first.objectives));
    expect(second.objectives).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Draw a habitat map' })]));
  });

  it('preserves legacy CUSTOM content using the migration-published TRADITIONAL definition', async () => {
    const target = await family('custom');
    const catalog = await supertest(app.getHttpServer()).get(definitionsUrl)
      .set('Cookie', adminCookie).expect(200);
    const traditional = (catalog.body as PedagogicalModelDefinitionResponseDto[])
      .filter((model) => model.code === 'TRADITIONAL' && model.status === 'PUBLISHED')
      .sort((left, right) => right.version - left.version)[0];
    expect(traditional).toBeDefined();
    // The retired engine is used only as a fixture proving compatibility.
    const legacy = new CurriculumTemplateEngine().getTemplateDefinitions('CUSTOM');
    expect(legacy.length).toBeGreaterThan(0);
    expect(traditional!.metadata.subjects).toEqual(legacy);
    const applied = await apply(target, 'CUSTOM').expect(201);
    expect(applied.body).toEqual({ subjectsCount: legacy.length,
      objectivesCount: legacy.reduce((count, subject) => count + subject.starterObjectives.length, 0) });
    const actual = await snapshot(target);
    expect(actual.plan).toMatchObject({ pedagogicalFramework: 'CUSTOM',
      pedagogicalModelDefinitionId: traditional!.id });
    expect(actual.subjects).toHaveLength(legacy.length);
    expect(actual.objectives).toHaveLength(applied.body.objectivesCount);
    for (const subject of legacy) {
      expect(actual.subjects).toEqual(expect.arrayContaining([expect.objectContaining({
        name: subject.name, color: subject.color, description: subject.description,
      })]));
      for (const title of subject.starterObjectives) {
        expect(actual.objectives).toEqual(expect.arrayContaining([expect.objectContaining({ title })]));
      }
    }
  });

  it('rejects unpublished and unknown codes without creating curriculum records', async () => {
    const target = await family('unavailable');
    const draft = `ACCEPTANCE.DRAFT.${unique}`;
    await createModel(draft);
    const before = await snapshot(target);
    for (const code of [draft, `ACCEPTANCE.UNKNOWN.${unique}`]) {
      await apply(target, code).expect(404);
      expect(await snapshot(target)).toEqual(before);
    }
  });

  it('rejects a foreign-family learner or academic year without changing either family', async () => {
    const target = await family('tenant');
    const foreign = await family('foreign');
    const code = `ACCEPTANCE.ISOLATION.${unique}`;
    await publish(await createModel(code));
    const before = await snapshot(target);
    const foreignBefore = await snapshot(foreign);
    for (const overrides of [{ learnerId: foreign.learnerId }, { academicYearId: foreign.academicYearId }]) {
      await apply(target, code, overrides).expect(404);
      expect(await snapshot(target)).toEqual(before);
      expect(await snapshot(foreign)).toEqual(foreignBefore);
    }
  });
});
