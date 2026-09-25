import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Admin CRUD surface for TheologicalTraditionDefinition and
// TheologicalPositionDefinition (issue #96 Fase 1, section 14 -- tables
// added in PR #111, shape only, no real theological content). Same
// PlatformAdminGuard-gated pattern as every other resource on
// DefinitionsController: create + list + explicit status-transition.
// This is what makes section 1's "adicionar uma nova tradição teológica
// não exige deploy" true end-to-end -- a new tradition/position is now a
// data write through this API, not a code change.
describe('Theological taxonomy admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let outsiderCookie: string;
  const adminEmail = `theo-taxonomy-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(emailPrefix: string): Promise<string> {
    const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Theological Taxonomy Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
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
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Theological Taxonomy Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    outsiderCookie = await registerAndGetCookie('theo-taxonomy-outsider');
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .expect(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });

  it('creates, lists, and transitions a theological tradition definition end-to-end', async () => {
    const code = `TEST.TRADITION.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Test Reformed Tradition' })
      .expect(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.code).toBe(code);

    // Duplicate (code, version) is rejected as a caller mistake, not a 500.
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Duplicate tradition' })
      .expect(400);

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === created.body.id)).toBe(true);

    const statusUrl = `/api/v1/admin/curriculum-definitions/theological-tradition-definitions/${created.body.id}/status`;
    const published = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');
    expect(published.body.publishedAt).not.toBeNull();

    // Backwards transition is rejected by the shared state machine.
    await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'DRAFT' })
      .expect(400);

    await supertest(app.getHttpServer())
      .patch('/api/v1/admin/curriculum-definitions/theological-tradition-definitions/00000000-0000-0000-0000-000000000000/status')
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(404);
  });

  it('adds a position to a tradition later, proving positions can be added without a deploy', async () => {
    // "Later" as a distinct admin action against an already-created,
    // already-published tradition -- not something bundled into tradition
    // creation.
    const tradition = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TRADITION.POS.${Date.now()}`, name: 'Tradition For Positions' })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/theological-tradition-definitions/${tradition.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const positionCode = `TEST.POSITION.${Date.now()}`;
    const position = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: positionCode,
        traditionId: tradition.body.id,
        topic: 'soteriology',
        name: 'Test Position',
      })
      .expect(201);
    expect(position.body.status).toBe('DRAFT');
    expect(position.body.traditionId).toBe(tradition.body.id);
    expect(position.body.topic).toBe('soteriology');

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === position.body.id)).toBe(true);

    const statusUrl = `/api/v1/admin/curriculum-definitions/theological-position-definitions/${position.body.id}/status`;
    const published = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');

    const deprecated = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'DEPRECATED' })
      .expect(200);
    expect(deprecated.body.deprecatedAt).not.toBeNull();
  });

  it('rejects a position referencing a tradition that does not exist with 400, not 500', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.POSITION.BADFK.${Date.now()}`,
        traditionId: '00000000-0000-0000-0000-000000000000',
        topic: 'eschatology',
        name: 'Orphan Position',
      })
      .expect(400);
  });

  it('rejects an unauthenticated or non-admin request for theological position definitions', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .expect(401);
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });
});
