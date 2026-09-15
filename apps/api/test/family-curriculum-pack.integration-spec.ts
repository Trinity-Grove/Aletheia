import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

describe('Family curriculum pack instances (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyCookie: string;
  let familyId: string;
  const adminEmail = `family-pack-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(prefix: string, exactEmail?: string): Promise<string> {
    const email = exactEmail ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Family Pack Test' })
      .expect(201);
    return [response.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    adminCookie = await registerAndGetCookie('family-pack-admin', adminEmail);
    familyCookie = await registerAndGetCookie('family-pack-guardian');

    const family = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', familyCookie)
      .send({ name: 'Family Pack Family', countryCode: 'BRA' })
      .expect(201);
    familyId = family.body.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('installs a published pack as an editable, version-pinned family instance', async () => {
    const source = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `FAMILY.PACK.${Date.now()}`, name: 'Platform Template' })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-packs/${source.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const installed = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum-packs`)
      .set('Cookie', familyCookie)
      .send({ sourcePackId: source.body.id })
      .expect(201);

    expect(installed.body.familyId).toBe(familyId);
    expect(installed.body.sourcePackId).toBe(source.body.id);
    expect(installed.body.sourcePackCode).toBe(source.body.code);
    expect(installed.body.sourcePackVersion).toBe(1);
    expect(installed.body.revision).toBe(1);
    expect(installed.body.document.pack.name).toBe('Platform Template');

    const editedDocument = {
      ...installed.body.document,
      pack: {
        ...installed.body.document.pack,
        name: 'Minha versão da família',
        metadata: { audience: 'family' },
      },
    };

    const edited = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyId}/curriculum-packs/${installed.body.id}`)
      .set('Cookie', familyCookie)
      .send({ document: editedDocument })
      .expect(200);

    expect(edited.body.revision).toBe(2);
    expect(edited.body.document.pack.name).toBe('Minha versão da família');
    expect(edited.body.sourcePackVersion).toBe(1);

    const revisions = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum-packs/${installed.body.id}/revisions`)
      .set('Cookie', familyCookie)
      .expect(200);
    expect(revisions.body).toHaveLength(2);
    expect(revisions.body[0].document.pack.name).toBe('Platform Template');

    const sourceAfterEdit = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${source.body.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(sourceAfterEdit.body.name).toBe('Platform Template');
  });

  it('rejects installing a draft pack as a family template', async () => {
    const draft = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .send({ code: `FAMILY.PACK.DRAFT.${Date.now()}`, name: 'Draft Template' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum-packs`)
      .set('Cookie', familyCookie)
      .send({ sourcePackId: draft.body.id })
      .expect(400);
  });
});
