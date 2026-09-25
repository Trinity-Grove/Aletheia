import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Admin CRUD surface for the data-driven curriculum foundation (issue #96
// Fase 0, section 40's literal test: adding a new domain/competency/track
// should be a data write through an API, not a code change + deploy).
// Exercises the full HTTP path (auth, PlatformAdminGuard, Zod validation,
// Prisma persistence, status transitions) against real Postgres. Also
// exercises the PLATFORM_ADMIN_EMAILS bootstrap path end-to-end (issue
// #101) rather than poking the database directly to create an admin.
describe('Curriculum definitions admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let outsiderCookie: string;
  const adminEmail = `definitions-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(emailPrefix: string): Promise<string> {
    const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Definitions Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    return [response.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;
  }

  beforeAll(async () => {
    // Set before createApplication() so the bootstrap list is picked up by
    // the running process's parsed Environment.
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Registering with an email on PLATFORM_ADMIN_EMAILS auto-promotes —
    // this is the real bootstrap path, not a test-only shortcut.
    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Definitions Admin Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    // An authenticated user NOT on the bootstrap list -- should be
    // rejected by PlatformAdminGuard even though they're logged in, and
    // even if they're a guardian of a family (family membership is no
    // longer a proxy for platform-admin access, per issue #101).
    outsiderCookie = await registerAndGetCookie('definitions-outsider');
    await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', outsiderCookie)
      .send({ name: 'Outsider Family', countryCode: 'BR' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    // jest-integration.json runs every *.integration-spec.ts in one
    // process (--runInBand) -- don't leak this into files that run after.
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/learning-domains')
      .expect(401);
  });

  it('rejects an authenticated non-admin user, even one who is a guardian of a family', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });

  it('creates, lists, and transitions a learning domain end-to-end', async () => {
    const code = `TEST.DOMAIN.${Date.now()}`;

    const createResponse = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Test Domain' })
      .expect(201);

    expect(createResponse.body.status).toBe('DRAFT');
    const domainId = createResponse.body.id;

    const listResponse = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listResponse.body.some((d: { id: string }) => d.id === domainId)).toBe(true);

    const publishResponse = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/learning-domains/${domainId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(publishResponse.body.status).toBe('PUBLISHED');
    expect(publishResponse.body.publishedAt).not.toBeNull();

    // Explicit transitions only -- can't skip PUBLISHED -> DRAFT.
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/learning-domains/${domainId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'DRAFT' })
      .expect(400);

    return domainId;
  });

  it('creates a competency under a domain, optionally under a path, and a skill under the competency', async () => {
    const domainCode = `TEST.SKILL_TREE.DOMAIN.${Date.now()}`;
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: domainCode, name: 'Skill Tree Domain' })
      .expect(201);

    const pathCode = `TEST.SKILL_TREE.PATH.${Date.now()}`;
    const path = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-paths')
      .set('Cookie', adminCookie)
      .send({ code: pathCode, domainId: domain.body.id, name: 'Skill Tree Path' })
      .expect(201);

    const competencyCode = `TEST.SKILL_TREE.COMPETENCY.${Date.now()}`;
    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: competencyCode,
        domainId: domain.body.id,
        pathId: path.body.id,
        title: 'Skill Tree Competency',
      })
      .expect(201);
    expect(competency.body.pathId).toBe(path.body.id);

    const skillCode = `TEST.SKILL_TREE.SKILL.${Date.now()}`;
    const skill = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/skill-definitions')
      .set('Cookie', adminCookie)
      .send({ code: skillCode, competencyId: competency.body.id, title: 'Skill Tree Skill' })
      .expect(201);
    expect(skill.body.competencyId).toBe(competency.body.id);

    const listResponse = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/skill-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listResponse.body.some((s: { id: string }) => s.id === skill.body.id)).toBe(true);
  });

  it('rejects a malformed create payload with 400', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: 'lowercase-not-allowed', name: 'x' })
      .expect(400);
  });
});
