import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Admin CRUD surface for ProgressionPolicy (issue #96 Fase 2, section 11):
// a Definition/Version catalog table -- unlike EvidenceSubmission/
// AssessmentResult (user data), a progression policy is platform/family
// configuration, so it follows the exact same admin CRUD pattern as every
// other resource on DefinitionsController.
describe('Progression policy admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let outsiderCookie: string;
  const adminEmail = `progression-policy-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(emailPrefix: string): Promise<string> {
    const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Progression Policy Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
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
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Progression Policy Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    outsiderCookie = await registerAndGetCookie('progression-policy-outsider');
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/progression-policies')
      .expect(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });

  it('creates, lists, and transitions a progression policy end-to-end, with a free-form policyType', async () => {
    const code = `TEST.POLICY.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({
        code,
        name: 'Test Mastery Policy',
        policyType: 'A_BRAND_NEW_POLICY_TYPE_NOT_IN_ANY_ENUM',
        rules: { minimumEvidenceCount: 3 },
      })
      .expect(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.policyType).toBe('A_BRAND_NEW_POLICY_TYPE_NOT_IN_ANY_ENUM');
    expect(created.body.rules).toEqual({ minimumEvidenceCount: 3 });

    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Duplicate', policyType: 'MASTERY' })
      .expect(400);

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === created.body.id)).toBe(true);

    const statusUrl = `/api/v1/admin/curriculum-definitions/progression-policies/${created.body.id}/status`;
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

    await supertest(app.getHttpServer())
      .patch('/api/v1/admin/curriculum-definitions/progression-policies/00000000-0000-0000-0000-000000000000/status')
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(404);
  });

  it('optionally scopes a policy to a competency definition', async () => {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.POLICY.DOMAIN.${Date.now()}`, name: 'Policy Test Domain' })
      .expect(201);

    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.POLICY.COMPETENCY.${Date.now()}`,
        domainId: domain.body.id,
        title: 'Policy Test Competency',
      })
      .expect(201);

    const policy = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.POLICY.SCOPED.${Date.now()}`,
        name: 'Scoped policy',
        policyType: 'MASTERY',
        competencyDefinitionId: competency.body.id,
      })
      .expect(201);
    expect(policy.body.competencyDefinitionId).toBe(competency.body.id);
  });

  it('rejects a policy referencing a competency that does not exist with 400, not 500', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/progression-policies')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.POLICY.BADFK.${Date.now()}`,
        name: 'Orphan policy',
        policyType: 'MASTERY',
        competencyDefinitionId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(400);
  });
});
