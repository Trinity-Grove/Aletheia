import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

describe('Family project selections (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let familyACookie: string;
  let familyAId: string;
  let familyBCookie: string;
  let projectId: string;
  let draftProjectId: string;
  let competencyId: string;

  async function registerFamily(prefix: string): Promise<{ cookie: string; familyId: string }> {
    const response = await registerAndConfirmGuardian(app, {
      email: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'somePassword123',
      fullName: 'Project Selection Test Guardian',
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

    const familyA = await registerFamily('project-selection-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyBCookie = (await registerFamily('project-selection-b')).cookie;

    const publishedProject = await prisma.projectDefinition.create({
      data: {
        code: `TEST.PROJECT.SELECTION.PUBLISHED.${Date.now()}`,
        name: 'Published Project Selection Test',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    projectId = publishedProject.id;
    const domain = await prisma.learningDomain.create({
      data: {
        code: `TEST.PROJECT.SELECTION.DOMAIN.${Date.now()}`,
        name: 'Project Selection Test Domain',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    const competency = await prisma.competencyDefinition.create({
      data: {
        code: `TEST.PROJECT.SELECTION.COMPETENCY.${Date.now()}`,
        title: 'Plan the garden bed',
        domainId: domain.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    competencyId = competency.id;
    await prisma.projectDefinitionCompetency.create({
      data: { projectId, competencyId, required: true, order: 0 },
    });
    const draftProject = await prisma.projectDefinition.create({
      data: {
        code: `TEST.PROJECT.SELECTION.DRAFT.${Date.now()}`,
        name: 'Draft Project Selection Test',
      },
    });
    draftProjectId = draftProject.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('enables, disables, and lists one idempotent family project selection', async () => {
    const enabled = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/projects/${projectId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: true })
      .expect(200);

    expect(enabled.body.familyId).toBe(familyAId);
    expect(enabled.body.projectId).toBe(projectId);
    expect(enabled.body.enabled).toBe(true);
    expect(enabled.body.project.status).toBe('PUBLISHED');
    expect(enabled.body.project.competencies).toEqual([
      expect.objectContaining({ competencyId, title: 'Plan the garden bed', required: true, order: 0 }),
    ]);

    const disabled = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/projects/${projectId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: false })
      .expect(200);

    expect(disabled.body.id).toBe(enabled.body.id);
    expect(disabled.body.enabled).toBe(false);

    const list = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/projects/selections`)
      .set('Cookie', familyACookie)
      .expect(200);

    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toEqual(expect.objectContaining({ id: enabled.body.id, enabled: false }));
  });

  it('lists published projects with mapped competencies and family-specific selection state', async () => {
    await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/projects/${projectId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: true })
      .expect(200);

    const familyACatalog = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/projects/catalog`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(familyACatalog.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: projectId,
        enabled: true,
        competencies: [expect.objectContaining({ competencyId, code: expect.any(String), title: 'Plan the garden bed' })],
      }),
    ]));

    const familyBCatalog = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/projects/catalog`)
      .set('Cookie', familyBCookie)
      .expect(403);
    expect(familyBCatalog.body).toBeDefined();
  });

  it('rejects unpublished projects and cross-family access', async () => {
    await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyAId}/curriculum/projects/${draftProjectId}/selection`)
      .set('Cookie', familyACookie)
      .send({ enabled: true })
      .expect(404);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/projects/selections`)
      .set('Cookie', familyBCookie)
      .expect(403);
  });
});
