import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { MAIL_SENDER, type MailMessage, type MailSender } from '../src/platform/mail/mail-sender.js';

function extractVerificationToken(message: MailMessage): string {
  const match = message.text.match(/token=([a-f0-9]+)/);
  if (!match) {
    throw new Error(`No verification token found in email text: ${message.text}`);
  }
  return match[1]!;
}

function extractRegistrationCode(message: MailMessage): string {
  const match = message.text.match(/código de confirmação é (\d{6})/);
  if (!match) {
    throw new Error(`No 6-digit code found in email text: ${message.text}`);
  }
  return match[1]!;
}

describe('Email verification (real Postgres, captured mail sender)', () => {
  let app: NestFastifyApplication;
  let sentEmails: MailMessage[];

  beforeAll(async () => {
    app = await createApplication();

    sentEmails = [];
    const mailSender = app.get<MailSender>(MAIL_SENDER);
    jest.spyOn(mailSender, 'send').mockImplementation(async (message) => {
      sentEmails.push(message);
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // register() no longer sends a link -- it's blocking, and confirmed
  // with the 6-digit code emailed here. This is the primary new flow.
  it('sends a real 6-digit code on registration and only issues a session once it is confirmed', async () => {
    const email = `verify-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Verification Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);

    expect(registerResponse.body).toEqual({ emailConfirmationRequired: true, challengeToken: expect.any(String) });
    expect(registerResponse.headers['set-cookie']).toBeUndefined();

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(email);
    const code = extractRegistrationCode(sentEmails[0]!);

    // Logging in before confirming reissues a fresh challenge instead of a session.
    const loginBeforeConfirm = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);
    expect(loginBeforeConfirm.body).toEqual({ emailConfirmationRequired: true, challengeToken: expect.any(String) });
    expect(loginBeforeConfirm.headers['set-cookie']).toBeUndefined();

    // The original code, from the ORIGINAL challenge, no longer applies --
    // login() above replaced it with a new one.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register/confirm')
      .send({ challengeToken: registerResponse.body.challengeToken, code })
      .expect(404);

    const { challengeToken } = loginBeforeConfirm.body as { challengeToken: string };
    const freshCode = await supertest(app.getHttpServer())
      .get('/api/v1/auth/register/debug-code')
      .query({ challengeToken })
      .expect(200)
      .then((res) => (res.body as { code: string }).code);

    const confirmResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register/confirm')
      .send({ challengeToken, code: freshCode })
      .expect(200);

    expect(confirmResponse.body.user.emailVerified).toBe(true);
    expect(confirmResponse.headers['set-cookie']).toBeDefined();

    // Using the same code again must fail — the challenge is single-use.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register/confirm')
      .send({ challengeToken, code: freshCode })
      .expect(404);
  });

  // The debug-code endpoint's production guard reads environment.nodeEnv,
  // which is resolved once at boot from process.env -- mutating
  // process.env.NODE_ENV against an already-running app has no effect, so
  // this is covered at the unit level (auth.service.spec.ts) instead,
  // where the fake Environment is directly mutable per test.

  // The link-based flow (EmailVerificationToken, /auth/verify-email,
  // /auth/resend-verification) is untouched -- it's used by changeEmail()
  // now, not by register(). Exercise it through that path instead.
  describe('link-based re-verification after changing email', () => {
    async function registerAndConfirm(email: string): Promise<{ accessCookie: string; userId: string }> {
      const registerResponse = await supertest(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12345', fullName: 'Change Email Test', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
        .expect(201);

      const { challengeToken } = registerResponse.body as { challengeToken: string };
      const code = await supertest(app.getHttpServer())
        .get('/api/v1/auth/register/debug-code')
        .query({ challengeToken })
        .expect(200)
        .then((res) => (res.body as { code: string }).code);

      const confirmResponse = await supertest(app.getHttpServer())
        .post('/api/v1/auth/register/confirm')
        .send({ challengeToken, code })
        .expect(200);

      const accessCookie = [confirmResponse.headers['set-cookie']]
        .flat()
        .find((cookie) => cookie?.startsWith('aletheia_session='))!;

      return { accessCookie, userId: confirmResponse.body.user.id };
    }

    it('verify-email confirms a changed address and resend-verification re-sends the link', async () => {
      const email = `changeemail-integration-${Date.now()}@example.com`;
      const newEmail = `changeemail-new-${Date.now()}@example.com`;
      const { accessCookie } = await registerAndConfirm(email);
      sentEmails.length = 0;

      await supertest(app.getHttpServer())
        .post('/api/v1/auth/change-email')
        .set('Cookie', accessCookie)
        .send({ currentPassword: 'password12345', newEmail })
        .expect(200);

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe(newEmail);
      const token = extractVerificationToken(sentEmails[0]!);

      await supertest(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(200);

      const loginResponse = await supertest(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: newEmail, password: 'password12345' })
        .expect(200);
      expect(loginResponse.body.user.emailVerified).toBe(true);

      // Using the same token again must fail — it's single-use.
      await supertest(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(400);
    });

    it('resend-verification sends a new email for an unverified (post-email-change) account and does nothing once verified', async () => {
      const email = `resend-integration-${Date.now()}@example.com`;
      const newEmail = `resend-new-${Date.now()}@example.com`;
      const { accessCookie } = await registerAndConfirm(email);

      await supertest(app.getHttpServer())
        .post('/api/v1/auth/change-email')
        .set('Cookie', accessCookie)
        .send({ currentPassword: 'password12345', newEmail })
        .expect(200);

      sentEmails.length = 0;
      await supertest(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', accessCookie)
        .expect(200);

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe(newEmail);

      const token = extractVerificationToken(sentEmails[0]!);
      await supertest(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(200);

      sentEmails.length = 0;
      await supertest(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', accessCookie)
        .expect(200);

      expect(sentEmails).toHaveLength(0);
    });
  });
});
