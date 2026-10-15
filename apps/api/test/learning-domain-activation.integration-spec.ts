import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

jest.setTimeout(30_000);

describe('Learning domain activation admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `domain-activation-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const response = await registerAndConfirmGuardian(app, {
      email: adminEmail,
      password: 'somePassword123',
      fullName: 'Domain Activation Admin',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    adminCookie = [response.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('activates and deactivates a domain independently from its editorial status', async () => {
    const base = '/api/v1/admin/curriculum-definitions/learning-domains';
    const code = `TEST.ACTIVATION.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({ code, name: 'Activation test domain' })
      .expect(201);

    expect(created.body.isActive).toBe(true);

    const published = await supertest(app.getHttpServer())
      .patch(`${base}/${created.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');

    const deactivated = await supertest(app.getHttpServer())
      .patch(`${base}/${created.body.id}/activation`)
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(200);
    expect(deactivated.body.isActive).toBe(false);
    expect(deactivated.body.status).toBe('PUBLISHED');

    const idempotent = await supertest(app.getHttpServer())
      .patch(`${base}/${created.body.id}/activation`)
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(200);
    expect(idempotent.body.isActive).toBe(false);

    const reactivated = await supertest(app.getHttpServer())
      .patch(`${base}/${created.body.id}/activation`)
      .set('Cookie', adminCookie)
      .send({ isActive: true })
      .expect(200);
    expect(reactivated.body.isActive).toBe(true);
    expect(reactivated.body.status).toBe('PUBLISHED');

    const listed = await supertest(app.getHttpServer())
      .get(base)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.find((domain: { id: string }) => domain.id === created.body.id).isActive).toBe(true);

    const logs = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-definitions/version-operations/logs?code=${code}`)
      .set('Cookie', adminCookie)
      .expect(200);
    const updateLogs = logs.body.filter((log: { operationType: string }) => log.operationType === 'UPDATE');
    expect(updateLogs).toHaveLength(3);
    expect(updateLogs.every((log: { metadata: { changedFields: string[] } }) =>
      log.metadata.changedFields.length === 1 && log.metadata.changedFields[0] === 'isActive')).toBe(true);

    await supertest(app.getHttpServer())
      .patch(`${base}/00000000-0000-0000-0000-000000000000/activation`)
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(404);
  });

  it('rejects activation payloads without an explicit boolean', async () => {
    const response = await supertest(app.getHttpServer())
      .patch('/api/v1/admin/curriculum-definitions/learning-domains/00000000-0000-0000-0000-000000000000/activation')
      .set('Cookie', adminCookie)
      .send({});

    expect(response.status).toBe(400);
  });
});
