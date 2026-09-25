import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Family-facing theological tradition catalog (issue #126 item 1) --
// analogous to the pedagogical model catalog from #96 section 35 (PR
// #110), against real Postgres. NOT the platform-admin CRUD: same guard
// pair as every other family-scoped route on CurriculumController.
describe('Theological tradition catalog (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyCookie: string;
  let familyId: string;
  const adminEmail = `tradition-catalog-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Tradition Catalog Admin', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyEmail = `tradition-catalog-family-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const familyRegisterResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: familyEmail, password: 'somePassword123', fullName: 'Tradition Catalog Family', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    familyCookie = [familyRegisterResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', familyCookie)
      .send({ name: 'Tradition Catalog Family', countryCode: 'BR' })
      .expect(201);
    familyId = familyResponse.body.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('lists only PUBLISHED traditions, deduplicated to the latest version, with the lean family-facing shape', async () => {
    const suffix = Date.now();

    const draftTradition = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CATALOG.DRAFT.${suffix}`, name: 'Draft Tradition' })
      .expect(201);

    const publishedTraditionV1 = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-tradition-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.CATALOG.PUB.${suffix}`, name: 'Published Tradition v1', description: 'v1 desc' })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/theological-tradition-definitions/${publishedTraditionV1.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const catalogResponse = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/theological-traditions/catalog`)
      .set('Cookie', familyCookie)
      .expect(200);

    const codes = catalogResponse.body.map((entry: { code: string }) => entry.code);
    expect(codes).toContain(publishedTraditionV1.body.code);
    expect(codes).not.toContain(draftTradition.body.code);

    const entry = catalogResponse.body.find(
      (e: { code: string }) => e.code === publishedTraditionV1.body.code,
    );
    expect(entry).toEqual({
      code: publishedTraditionV1.body.code,
      name: 'Published Tradition v1',
      description: 'v1 desc',
    });
    // Lean shape -- no id/version/status/metadata/timestamps leaked.
    expect(Object.keys(entry).sort()).toEqual(['code', 'description', 'name']);
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/theological-traditions/catalog`)
      .expect(401);
  });

  it('rejects a request from a family the caller does not belong to', async () => {
    const otherEmail = `tradition-catalog-other-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const otherResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: otherEmail, password: 'somePassword123', fullName: 'Other Guardian', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    const otherCookie = [otherResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/theological-traditions/catalog`)
      .set('Cookie', otherCookie)
      .expect(403);
  });
});
