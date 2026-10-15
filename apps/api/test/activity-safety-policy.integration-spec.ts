import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

jest.setTimeout(30_000);

describe('Activity safety policy admin API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `activity-safety-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await registerAndConfirmGuardian(app, {
      email: adminEmail,
      password: 'somePassword123',
      fullName: 'Activity Safety Policy Test Admin',
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

  it('persists and lists a structured policy while preserving legacy fields', async () => {
    const base = '/api/v1/admin/curriculum-definitions/activity-definitions';
    const stamp = Date.now();
    const safetyPolicy = {
      riskLevel: 'HIGH',
      supervision: 'ADULT_ONLY',
      minimumAge: 12,
      requiresAdultConsent: true,
      requiredTrainingCodes: ['SAFETY.FIRE.INTRO'],
      instructions: 'Mantenha água disponível e apague o fogo completamente ao terminar.',
    };
    const activity = await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.ACTIVITY.${stamp}`,
        name: 'Construir uma fogueira com segurança',
        supervisionRequired: true,
        riskLevel: 'medium',
        metadata: { materials: ['fósforos', 'lenha'], safetyPolicy },
      })
      .expect(201);

    expect(activity.body.supervisionRequired).toBe(true);
    expect(activity.body.riskLevel).toBe('medium');
    expect(activity.body.metadata.safetyPolicy).toEqual(safetyPolicy);

    const listed = await supertest(app.getHttpServer())
      .get(base)
      .set('Cookie', adminCookie)
      .expect(200);
    const listedActivity = listed.body.find((row: { id: string }) => row.id === activity.body.id);
    expect(listedActivity.metadata.safetyPolicy).toEqual(safetyPolicy);
    expect(listedActivity.metadata.materials).toEqual(['fósforos', 'lenha']);

    await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.INVALID.HIGH.${stamp}`,
        name: 'High risk without supervision',
        metadata: { safetyPolicy: { riskLevel: 'HIGH', supervision: 'NONE' } },
      })
      .expect(400);

    await supertest(app.getHttpServer())
      .post(base)
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.SAFETY.INVALID.CONSENT.${stamp}`,
        name: 'Adult only without consent',
        metadata: { safetyPolicy: { riskLevel: 'MODERATE', supervision: 'ADULT_ONLY' } },
      })
      .expect(400);
  });
});
