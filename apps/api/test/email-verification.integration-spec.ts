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

  it('sends a real verification email on registration and confirms the account when the link is used', async () => {
    const email = `verify-integration-${Date.now()}@example.com`;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Verification Test' })
      .expect(201);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(email);
    const token = extractVerificationToken(sentEmails[0]!);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token })
      .expect(200);

    const loginResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);

    expect(loginResponse.body.user.emailVerified).toBe(true);

    // Using the same token again must fail — it's single-use.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token })
      .expect(400);
  });

  it('resend-verification sends a new email for an unverified account and does nothing once verified', async () => {
    const email = `resend-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Resend Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    sentEmails.length = 0;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .set('Cookie', accessCookie)
      .expect(200);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(email);

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
