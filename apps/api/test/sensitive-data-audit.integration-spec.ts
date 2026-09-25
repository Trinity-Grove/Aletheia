import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('Sensitive data access log: immutable audit trail for family/learner data operations (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  function uniqueEmail(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  async function registerGuardianAndFamily(prefix: string): Promise<{
    cookie: string;
    userId: string;
    familyId: string;
  }> {
    const registerRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail(prefix),
        password: 'somePassword123',
        fullName: `Guardian ${prefix}`,
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
      .expect(201);

    const cookie = [registerRes.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
    const userId = registerRes.body.user.id;

    const familyRes = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `Family ${prefix}`, countryCode: 'BRA' })
      .expect(201);

    return { cookie, userId, familyId: familyRes.body.id };
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('records CREATE and UPDATE entries for learner profile writes', async () => {
    const { cookie, userId, familyId } = await registerGuardianAndFamily('audit-learner');

    const createRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Aluno Auditado', birthDate: '2016-05-15', acceptedDataConsent: true })
      .expect(201);
    const learnerId = createRes.body.id;

    await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}/learners/${learnerId}`)
      .set('Cookie', cookie)
      .send({ firstName: 'Aluno Renomeado' })
      .expect(200);

    const logs = await prisma.sensitiveDataAccessLog.findMany({
      where: { familyId, learnerId, resourceType: 'LEARNER' },
      orderBy: { createdAt: 'asc' },
    });

    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ actorUserId: userId, action: 'CREATE', resourceId: learnerId });
    expect(logs[1]).toMatchObject({ actorUserId: userId, action: 'UPDATE', resourceId: learnerId });
  });

  it('records a CREATE entry when an export job is requested and an EXPORT entry when the full package is downloaded', async () => {
    const { cookie, userId, familyId } = await registerGuardianAndFamily('audit-export');

    const jobRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/export`)
      .set('Cookie', cookie)
      .expect(201);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/export/package`)
      .set('Cookie', cookie)
      .expect(200);

    const logs = await prisma.sensitiveDataAccessLog.findMany({
      where: { familyId, resourceType: 'DATA_EXPORT_PACKAGE' },
      orderBy: { createdAt: 'asc' },
    });

    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      actorUserId: userId,
      action: 'CREATE',
      resourceId: jobRes.body.id,
    });
    expect(logs[1]).toMatchObject({ actorUserId: userId, action: 'EXPORT', resourceId: null });
  });

  it('records a DELETE entry when a portfolio item is removed', async () => {
    const { cookie, userId, familyId } = await registerGuardianAndFamily('audit-portfolio');

    const learnerRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Aluno Portfolio', birthDate: '2016-05-15', acceptedDataConsent: true })
      .expect(201);
    const learnerId = learnerRes.body.id;

    const itemRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio`)
      .set('Cookie', cookie)
      .send({
        learnerId,
        title: 'Redação sobre o outono',
        type: 'TEXT',
        textContent: 'Era uma vez...',
        isHighlight: false,
        tags: [],
      })
      .expect(201);
    const itemId = itemRes.body.id;

    await supertest(app.getHttpServer())
      .delete(`/api/v1/families/${familyId}/portfolio/${itemId}`)
      .set('Cookie', cookie)
      .expect(200);

    const logs = await prisma.sensitiveDataAccessLog.findMany({
      where: { familyId, learnerId, resourceType: 'PORTFOLIO_ITEM', resourceId: itemId },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ actorUserId: userId, action: 'DELETE' });
  });
});
