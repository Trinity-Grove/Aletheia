import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

describe('Family learning-path selections (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let familyACookie: string;
  let familyAId: string;
  let familyBCookie: string;
  let pathId: string;
  let draftPathId: string;

  async function registerFamily(prefix: string): Promise<{ cookie: string; familyId: string }> {
    const response = await registerAndConfirmGuardian(app, {
      email: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'somePassword123',
      fullName: 'Learning Path Selection Test Guardian',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    const cookie = [response.headers['set-cookie']]
      .flat()
      .find((value) => value?.startsWith('aletheia_session='))!;
    const family = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);
    return { cookie, familyId: family.body.id };
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    const familyA = await registerFamily('path-selection-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyBCookie = (await registerFamily('path-selection-b')).cookie;

    const domain = await prisma.learningDomain.create({
      data: { code: `TEST.PATH.SELECTION.${Date.now()}`, name: 'Path Selection Test Domain' },
    });
    const publishedPath = await prisma.learningPath.create({
      data: {
        code: `TEST.PATH.SELECTION.PUBLISHED.${Date.now()}`,
        name: 'Published Path Selection Test',
        domainId: domain.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    pathId = publishedPath.id;
    const draftPath = await prisma.learningPath.create({
      data: {
        code: `TEST.PATH.SELECTION.DRAFT.${Date.now()}`,
        name: 'Draft Path Selection Test',
        domainId: domain.id,
      },
    });
    draftPathId = draftPath.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('enables, disables, and lists one idempotent family selection', async () => {
    const enabled = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/paths/${pathId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: true })
      .expect(200);

    expect(enabled.body.familyId).toBe(familyAId);
    expect(enabled.body.pathId).toBe(pathId);
    expect(enabled.body.enabled).toBe(true);
    expect(enabled.body.path.status).toBe('PUBLISHED');

    const disabled = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/paths/${pathId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: false })
      .expect(200);

    expect(disabled.body.id).toBe(enabled.body.id);
    expect(disabled.body.enabled).toBe(false);

    const list = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/paths/selections`)
      .set('Cookie', familyACookie)
      .expect(200);

    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toEqual(expect.objectContaining({ id: enabled.body.id, enabled: false }));
  });

  it('rejects unpublished paths and cross-family access', async () => {
    await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/paths/${draftPathId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: true })
      .expect(404);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/paths/selections`)
      .set('Cookie', familyBCookie)
      .expect(403);
  });
});
