import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { MAIL_SENDER, type MailMessage, type MailSender } from '../src/platform/mail/mail-sender.js';

describe('Account security: change password & change email (real Postgres)', () => {
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

  it('changes the password, revokes existing sessions, and rejects the old password', async () => {
    const email = `change-pw-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'oldPassword123', fullName: 'Change Password Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
    const refreshCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_refresh='))!;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Cookie', accessCookie)
      .send({ currentPassword: 'oldPassword123', newPassword: 'brandNewPassword456' })
      .expect(200);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'oldPassword123' })
      .expect(401);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'brandNewPassword456' })
      .expect(200);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });

  it('rejects a password change with the wrong current password', async () => {
    const email = `change-pw-wrong-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'oldPassword123', fullName: 'Change Password Wrong Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Cookie', accessCookie)
      .send({ currentPassword: 'notMyPassword', newPassword: 'brandNewPassword456' })
      .expect(401);
  });

  it('changes the email, resets verification, sends a new verification email, and revokes existing sessions', async () => {
    const email = `change-email-integration-${Date.now()}@example.com`;
    const newEmail = `changed-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Change Email Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
    const refreshCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_refresh='))!;

    sentEmails.length = 0;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/change-email')
      .set('Cookie', accessCookie)
      .send({ currentPassword: 'password12345', newEmail })
      .expect(200);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(newEmail);

    const loginWithOldEmail = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(401);
    expect(loginWithOldEmail.status).toBe(401);

    const loginResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: newEmail, password: 'password12345' })
      .expect(200);
    expect(loginResponse.body.user.emailVerified).toBe(false);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });

  it('rejects changing to an email already used by another account', async () => {
    const emailA = `change-email-taken-a-${Date.now()}@example.com`;
    const emailB = `change-email-taken-b-${Date.now()}@example.com`;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: emailB, password: 'password12345', fullName: 'Existing User' })
      .expect(201);

    const registerA = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: emailA, password: 'password12345', fullName: 'Requesting User' })
      .expect(201);

    const accessCookieA = [registerA.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/change-email')
      .set('Cookie', accessCookieA)
      .send({ currentPassword: 'password12345', newEmail: emailB })
      .expect(409);
  });
});
