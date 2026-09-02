import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

describe('Account audit log (real Postgres)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('records login, password change, and logout, and lists them most-recent-first', async () => {
    const email = `audit-integration-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'oldPassword123', fullName: 'Audit Log Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Cookie', accessCookie)
      .send({ currentPassword: 'oldPassword123', newPassword: 'newPassword456' })
      .expect(200);

    const loginResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'newPassword456' })
      .expect(200);

    const loginCookies = [loginResponse.headers['set-cookie']].flat();
    const newAccessCookie = loginCookies.find((cookie) => cookie?.startsWith('aletheia_session='))!;
    const newRefreshCookie = loginCookies.find((cookie) => cookie?.startsWith('aletheia_refresh='))!;

    // Logout reads the refresh cookie (to revoke it server-side and record
    // the audit event) — the session cookie alone isn't enough.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', [newAccessCookie, newRefreshCookie])
      .expect(200);

    const auditLogResponse = await supertest(app.getHttpServer())
      .get('/api/v1/auth/audit-log')
      .set('Cookie', newAccessCookie)
      .expect(200);

    const eventTypes = auditLogResponse.body.map((entry: { eventType: string }) => entry.eventType);
    // Most recent first: LOGOUT, then LOGIN_SUCCEEDED, then PASSWORD_CHANGED.
    expect(eventTypes.slice(0, 3)).toEqual(['LOGOUT', 'LOGIN_SUCCEEDED', 'PASSWORD_CHANGED']);
  });

  it('records a failed login attempt', async () => {
    const email = `audit-failed-login-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'correctPassword123', fullName: 'Audit Failed Login Test' })
      .expect(201);

    const accessCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrongPassword' })
      .expect(401);

    const auditLogResponse = await supertest(app.getHttpServer())
      .get('/api/v1/auth/audit-log')
      .set('Cookie', accessCookie)
      .expect(200);

    const eventTypes = auditLogResponse.body.map((entry: { eventType: string }) => entry.eventType);
    expect(eventTypes[0]).toBe('LOGIN_FAILED');
  });
});
