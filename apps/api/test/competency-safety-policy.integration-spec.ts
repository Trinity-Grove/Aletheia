import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

jest.setTimeout(30_000);

describe('Competency safety policy admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `competency-safety-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await registerAndConfirmGuardian(app, {
      email: adminEmail,
      password: 'somePassword123',
      fullName: 'Competency Safety Policy Test Admin',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('persists and lists a structured policy while rejecting unsafe combinations', async () => {
    const base = '/api/v1/admin/curriculum-definitions';
    const stamp = Date.now();
    const domain = await supertest(app.getHttpServer())
      .post(`${base}/learning-domains`)
      .set('Cookie', adminCookie)
      .send({ code: `TEST.SAFETY.DOMAIN.${stamp}`, name: 'Safety Test Domain' })
      .expect(201);

    const safetyPolicy = {
      riskLevel: 'HIGH',
      supervision: 'ADULT_ONLY',
      minimumAge: 12,
      requiresAdultConsent: true,
      requiredTrainingCodes: ['SAFETY.TOOL.INTRO'],
      instructions: 'Use equipamento de proteção e realize a atividade com um adulto responsável.',
    };
    const competency = await supertest(app.getHttpServer())
      .post(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.COMPETENCY.${stamp}`,
        domainId: domain.body.id,
        title: 'Usar ferramentas com segurança',
        metadata: { safetyPolicy },
      })
      .expect(201);

    expect(competency.body.metadata.safetyPolicy).toEqual(safetyPolicy);

    const listed = await supertest(app.getHttpServer())
      .get(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.find((row: { id: string }) => row.id === competency.body.id).metadata.safetyPolicy)
      .toEqual(safetyPolicy);

    await supertest(app.getHttpServer())
      .post(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.INVALID.HIGH.${stamp}`,
        domainId: domain.body.id,
        title: 'High risk without supervision',
        metadata: { safetyPolicy: { riskLevel: 'HIGH', supervision: 'NONE' } },
      })
      .expect(400);

    await supertest(app.getHttpServer())
      .post(`${base}/competency-definitions`)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.INVALID.CONSENT.${stamp}`,
        domainId: domain.body.id,
        title: 'Adult only without consent',
        metadata: { safetyPolicy: { riskLevel: 'MODERATE', supervision: 'ADULT_ONLY' } },
      })
      .expect(400);
  });
});
