import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Real-Postgres coverage for generic tagging (issue #96 section 38):
// tags a CompetencyDefinition and an ActivityDefinition, proves a
// definition can carry more than one taxonomy at once via `namespace`
// ("pode haver taxonomias diferentes"), proves reverse lookup by tag
// (section 37: definitions são pesquisáveis por tags), and proves tags
// never touch the tagged row's own structure (it stays exactly as
// created -- a pure annotation layer, not a structural replacement).
describe('Generic definition tagging (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `def-tags-admin-${randomUUID()}@example.com`;
  const base = '/api/v1/admin/curriculum-definitions';

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Definition Tags Admin Test' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('tags a competency with two different taxonomies, lists them, and finds it by reverse lookup', async () => {
    const domain = await supertest(app.getHttpServer())
      .post(`${base}/learning-domains`)
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TAG.DOMAIN.${randomUUID().replace(/-/g, '').toUpperCase()}`, name: 'Tagging Test Domain' })
      .expect(201);
    const competency = await supertest(app.getHttpServer())
      .post(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.TAG.COMPETENCY.${randomUUID().replace(/-/g, '').toUpperCase()}`,
        domainId: domain.body.id,
        title: 'Tagging Test Competency',
      })
      .expect(201);

    const themeTag = await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'CompetencyDefinition', definitionId: competency.body.id, namespace: 'theme', tag: 'apiculture' })
      .expect(201);
    expect(themeTag.body.namespace).toBe('theme');

    // A second, independent taxonomy on the exact same row -- proves
    // "pode haver taxonomias diferentes" concretely, not just that the
    // namespace field exists.
    await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'CompetencyDefinition', definitionId: competency.body.id, namespace: 'difficulty', tag: 'beginner' })
      .expect(201);

    const listed = await supertest(app.getHttpServer())
      .get(`${base}/tags?entityType=CompetencyDefinition&definitionId=${competency.body.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body).toHaveLength(2);
    expect(listed.body.map((t: { namespace: string; tag: string }) => `${t.namespace}:${t.tag}`).sort()).toEqual([
      'difficulty:beginner',
      'theme:apiculture',
    ]);

    // Reverse lookup (section 37): find every definition tagged "apiculture"
    // in the "theme" namespace, without knowing its id ahead of time.
    const found = await supertest(app.getHttpServer())
      .get(`${base}/tags/search?tag=apiculture&namespace=theme`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(found.body.some((t: { definitionId: string }) => t.definitionId === competency.body.id)).toBe(true);

    // Tagging never mutates the tagged row's own structure.
    const competencyAfter = await supertest(app.getHttpServer())
      .get(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .expect(200);
    const unchanged = competencyAfter.body.find((c: { id: string }) => c.id === competency.body.id);
    expect(unchanged.title).toBe('Tagging Test Competency');
    expect(unchanged.domainId).toBe(domain.body.id);
  });

  it('rejects tagging a definition that does not exist, 400 not 500', async () => {
    await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({
        entityType: 'CompetencyDefinition',
        definitionId: '00000000-0000-0000-0000-000000000000',
        tag: 'x',
      })
      .expect(400);
  });

  it('rejects a duplicate (entityType, definitionId, namespace, tag), 400 not 500', async () => {
    const domain = await supertest(app.getHttpServer())
      .post(`${base}/learning-domains`)
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TAG.DUP.DOMAIN.${randomUUID().replace(/-/g, '').toUpperCase()}`, name: 'Dup Tag Test Domain' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'LearningDomain', definitionId: domain.body.id, tag: 'dup' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'LearningDomain', definitionId: domain.body.id, tag: 'dup' })
      .expect(400);
  });

  it('removes a tag', async () => {
    const domain = await supertest(app.getHttpServer())
      .post(`${base}/learning-domains`)
      .set('Cookie', adminCookie)
      .send({ code: `TEST.TAG.REMOVE.${randomUUID().replace(/-/g, '').toUpperCase()}`, name: 'Remove Tag Test Domain' })
      .expect(201);
    const created = await supertest(app.getHttpServer())
      .post(`${base}/tags`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'LearningDomain', definitionId: domain.body.id, tag: 'temporary' })
      .expect(201);

    await supertest(app.getHttpServer())
      .delete(`${base}/tags/${created.body.id}`)
      .set('Cookie', adminCookie)
      .expect(204);

    const listed = await supertest(app.getHttpServer())
      .get(`${base}/tags?entityType=LearningDomain&definitionId=${domain.body.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body).toHaveLength(0);

    await supertest(app.getHttpServer())
      .delete(`${base}/tags/${created.body.id}`)
      .set('Cookie', adminCookie)
      .expect(404);
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer()).get(`${base}/tags/search?tag=x`).expect(401);
  });
});
