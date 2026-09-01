import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { MAIL_SENDER, type MailMessage, type MailSender } from '../src/platform/mail/mail-sender.js';

function extractResetToken(message: MailMessage): string {
  const match = message.text.match(/token=([a-f0-9]+)/);
  if (!match) {
    throw new Error(`No reset token found in email text: ${message.text}`);
  }
  return match[1]!;
}

describe('Password reset (real Postgres, captured mail sender)', () => {
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

  it('sends a real reset email, resets the password, and revokes existing sessions', async () => {
    const email = `reset-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'oldPassword123', fullName: 'Reset Test' })
      .expect(201);

    const refreshCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_refresh='))!;

    sentEmails.length = 0;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(email);
    const token = extractResetToken(sentEmails[0]!);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'brandNewPassword456' })
      .expect(200);

    // Old password no longer works...
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'oldPassword123' })
      .expect(401);

    // ...the new one does.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'brandNewPassword456' })
      .expect(200);

    // The refresh token issued before the reset must be revoked.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    // The reset token is single-use.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'anotherPassword789' })
      .expect(400);
  });

  it('forgot-password responds identically for an unknown email, without sending mail', async () => {
    sentEmails.length = 0;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: `nobody-${Date.now()}@example.com` })
      .expect(200);

    expect(sentEmails).toHaveLength(0);
  });
});
