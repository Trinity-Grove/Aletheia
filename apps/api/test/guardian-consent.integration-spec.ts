import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('Guardian consent: Terms of Use / Privacy Policy at registration, learner data consent at creation (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  function uniqueEmail(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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

  it('rejects registration when Terms of Use or Privacy Policy are not accepted', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('consent-reject'),
        password: 'somePassword123',
        fullName: 'Rejected Guardian',
        countryCode: 'BRA',
        acceptedTermsOfUse: false,
        acceptedPrivacyPolicy: true,
      })
      .expect(400);
  });

  it('records the LGPD-regime Terms of Use / Privacy Policy definitions when registering with countryCode BRA', async () => {
    const email = uniqueEmail('consent-lgpd');
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'somePassword123',
        fullName: 'Guardian LGPD',
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
      .expect(201);

    const userId = response.body.user.id;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { termsOfUseDefinition: true, privacyPolicyDefinition: true },
    });

    expect(user.termsOfUseDefinition?.code).toBe('TERMS_OF_USE_LGPD');
    expect(user.privacyPolicyDefinition?.code).toBe('PRIVACY_POLICY_LGPD');
    expect(user.termsOfUseAcceptedAt).not.toBeNull();
    expect(user.privacyPolicyAcceptedAt).not.toBeNull();
  });

  it('records the GDPR-regime definitions when registering with an EU countryCode', async () => {
    const email = uniqueEmail('consent-gdpr');
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'somePassword123',
        fullName: 'Guardian GDPR',
        countryCode: 'DEU',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
      .expect(201);

    const userId = response.body.user.id;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { termsOfUseDefinition: true, privacyPolicyDefinition: true },
    });

    expect(user.termsOfUseDefinition?.code).toBe('TERMS_OF_USE_GDPR');
    expect(user.privacyPolicyDefinition?.code).toBe('PRIVACY_POLICY_GDPR');
  });

  it('rejects learner creation without guardian data-processing consent, and grants the family-country-appropriate consent record when accepted', async () => {
    const guardianEmail = uniqueEmail('consent-learner-guardian');
    const registerRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: guardianEmail,
        password: 'somePassword123',
        fullName: 'Learner Consent Guardian',
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
      .expect(201);

    const guardianCookie = [registerRes.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    const familyRes = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianCookie)
      .send({ name: 'Learner Consent Family', countryCode: 'BRA' })
      .expect(201);
    const familyId = familyRes.body.id;

    // Contract layer rejects a learner without the consent flag -- never
    // reaches the service, so no learner and no ConsentRecord are created.
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName: 'Sem Consentimento', birthDate: '2016-05-15' })
      .expect(400);

    const learnersAfterRejection = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .expect(200);
    expect(learnersAfterRejection.body).toHaveLength(0);

    const createRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName: 'Com Consentimento', birthDate: '2016-05-15', acceptedDataConsent: true })
      .expect(201);
    const learnerId = createRes.body.id;

    const consentRecord = await prisma.consentRecord.findFirst({
      where: { familyId, learnerId },
      include: { consentDefinition: true },
    });

    expect(consentRecord).not.toBeNull();
    expect(consentRecord!.action).toBe('GRANTED');
    expect(consentRecord!.consentDefinition.code).toBe('LEARNER_DATA_PROCESSING_LGPD');
  });
});
