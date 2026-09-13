import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Admin CRUD for CurriculumPack + manifest + dependencies (issue #96
// Fase 4, section 27) against real Postgres.
describe('Curriculum pack admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let outsiderCookie: string;
  const adminEmail = `curriculum-pack-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(emailPrefix: string): Promise<string> {
    const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Curriculum Pack Test' })
      .expect(201);
    return [response.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Curriculum Pack Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    outsiderCookie = await registerAndGetCookie('curriculum-pack-outsider');
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer()).get('/api/v1/admin/curriculum-packs').expect(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-packs')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });

  it('creates, lists, and transitions a curriculum pack end-to-end -- packs possuem versão', async () => {
    const code = `TEST.PACK.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Test Pack' })
      .expect(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.version).toBe(1);

    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Duplicate' })
      .expect(400);

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === created.body.id)).toBe(true);

    const fetched = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${created.body.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(fetched.body.code).toBe(code);

    const statusUrl = `/api/v1/admin/curriculum-packs/${created.body.id}/status`;
    const published = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.publishedAt).not.toBeNull();
  });

  it('bundles multiple definition types into one pack manifest -- pack pode conter domains, competências, rubricas, atividades, pedagogical model, config teológica', async () => {
    const pack = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PACK.MANIFEST.${Date.now()}`, name: 'Manifest Test Pack' })
      .expect(201);

    const itemsToAdd: Array<{ definitionType: string; code: string; version: number }> = [
      { definitionType: 'LearningDomain', code: 'TEST.DOMAIN.X', version: 1 },
      { definitionType: 'CompetencyDefinition', code: 'TEST.COMPETENCY.X', version: 1 },
      { definitionType: 'RubricDefinition', code: 'TEST.RUBRIC.X', version: 1 },
      { definitionType: 'ActivityDefinition', code: 'TEST.ACTIVITY.X', version: 1 },
      { definitionType: 'PedagogicalModelDefinition', code: 'CLASSICAL_TRIVIUM', version: 1 },
      { definitionType: 'TheologicalTraditionDefinition', code: 'TEST.TRADITION.X', version: 1 },
    ];

    for (const item of itemsToAdd) {
      await supertest(app.getHttpServer())
        .post(`/api/v1/admin/curriculum-packs/${pack.body.id}/items`)
        .set('Cookie', adminCookie)
        .send(item)
        .expect(201);
    }

    const listed = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.body.id}/items`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body).toHaveLength(itemsToAdd.length);
    const types = listed.body.map((row: { definitionType: string }) => row.definitionType);
    for (const item of itemsToAdd) {
      expect(types).toContain(item.definitionType);
    }
  });

  it('rejects an unknown definition type in a manifest item, 400 not 500', async () => {
    const pack = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PACK.BADTYPE.${Date.now()}`, name: 'Bad Type Pack' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-packs/${pack.body.id}/items`)
      .set('Cookie', adminCookie)
      .send({ definitionType: 'NotARealDefinitionType', code: 'X', version: 1 })
      .expect(400);
  });

  it('declares a pack-level dependency on another pack -- packs podem possuir dependências', async () => {
    const pack = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PACK.DEPENDENT.${Date.now()}`, name: 'Dependent Pack' })
      .expect(201);

    const dependency = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-packs/${pack.body.id}/dependencies`)
      .set('Cookie', adminCookie)
      .send({ dependsOnCode: 'BASE_PACK_NOT_YET_CREATED', dependsOnVersion: 1 })
      .expect(201);
    expect(dependency.body.dependsOnCode).toBe('BASE_PACK_NOT_YET_CREATED');

    const listed = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.body.id}/dependencies`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body).toHaveLength(1);
  });

  it('allows two published packs to coexist without conflict -- packs podem coexistir', async () => {
    const suffix = Date.now();
    const packA = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PACK.COEXIST.A.${suffix}`, name: 'Pack A' })
      .expect(201);
    const packB = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PACK.COEXIST.B.${suffix}`, name: 'Pack B' })
      .expect(201);

    for (const pack of [packA, packB]) {
      await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/curriculum-packs/${pack.body.id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);
    }

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .expect(200);
    const bothPublished = listed.body.filter(
      (row: { id: string; status: string }) =>
        (row.id === packA.body.id || row.id === packB.body.id) && row.status === 'PUBLISHED',
    );
    expect(bothPublished).toHaveLength(2);
  });

  it('returns 404 for a nonexistent pack id on item/dependency routes', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';
    await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${missingId}/items`)
      .set('Cookie', adminCookie)
      .expect(404);
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-packs/${missingId}/items`)
      .set('Cookie', adminCookie)
      .send({ definitionType: 'LearningDomain', code: 'X', version: 1 })
      .expect(404);
  });
});
