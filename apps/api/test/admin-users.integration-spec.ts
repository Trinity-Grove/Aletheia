import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

// Backoffice user-management API (list/edit/promote/demote/disable any
// guardian account), exercised end to end against real Postgres. Same
// PLATFORM_ADMIN_EMAILS bootstrap pattern as
// definitions-admin.integration-spec.ts.
describe('Admin user management API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let adminId: string;
  const adminEmail = `admin-users-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookieAndId(prefix: string): Promise<{ cookie: string; id: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await registerAndConfirmGuardian(app, {
      email,
      password: 'somePassword123',
      fullName: 'Admin Users Test',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    const cookie = [response.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;
    return { cookie, id: response.body.user.id };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await registerAndConfirmGuardian(app, {
      email: adminEmail,
      password: 'somePassword123',
      fullName: 'Admin Users Admin',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    adminCookie = [adminResponse.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;
    adminId = adminResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer()).get('/api/v1/admin/users').expect(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    const { cookie } = await registerAndGetCookieAndId('admin-users-outsider');
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('lists users and filters by search', async () => {
    const { id: targetId } = await registerAndGetCookieAndId(`admin-users-search-${Date.now()}`);

    const listResponse = await supertest(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listResponse.body.totalCount).toBeGreaterThanOrEqual(2);
    expect(listResponse.body.users.some((u: { id: string }) => u.id === targetId)).toBe(true);

    const searchResponse = await supertest(app.getHttpServer())
      .get('/api/v1/admin/users')
      .query({ search: adminEmail })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(searchResponse.body.totalCount).toBe(1);
    expect(searchResponse.body.users[0].email).toBe(adminEmail);
  });

  it('edits a target user\'s full name', async () => {
    const { id: targetId } = await registerAndGetCookieAndId('admin-users-edit');

    const response = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/users/${targetId}`)
      .set('Cookie', adminCookie)
      .send({ fullName: 'Renamed By Admin' })
      .expect(200);

    expect(response.body.fullName).toBe('Renamed By Admin');
  });

  it('promotes and then demotes a target user', async () => {
    const { id: targetId } = await registerAndGetCookieAndId('admin-users-promote');

    const promoted = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${targetId}/promote`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(promoted.body.isPlatformAdmin).toBe(true);

    const demoted = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${targetId}/demote`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(demoted.body.isPlatformAdmin).toBe(false);
  });

  it('rejects an admin trying to demote themself', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${adminId}/demote`)
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('disables a target account, revokes its sessions, and blocks further login', async () => {
    const email = `admin-users-disable-${Date.now()}@example.com`;
    const registerResponse = await registerAndConfirmGuardian(app, {
      email,
      password: 'somePassword123',
      fullName: 'To Be Disabled',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    const targetId = registerResponse.body.user.id;
    const targetRefreshCookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_refresh='))!;

    const disabled = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${targetId}/disable`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(disabled.body.disabled).toBe(true);

    // The refresh token issued at registration must no longer work.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', targetRefreshCookie)
      .expect(401);

    // Nor can the account log in again while disabled.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'somePassword123' })
      .expect(401);

    const reactivated = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${targetId}/reactivate`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(reactivated.body.disabled).toBe(false);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'somePassword123' })
      .expect(200);
  });

  it('rejects an admin trying to disable themself', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${adminId}/disable`)
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('force-sends a password reset email for a target account', async () => {
    const { id: targetId } = await registerAndGetCookieAndId('admin-users-force-reset');

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/users/${targetId}/force-password-reset`)
      .set('Cookie', adminCookie)
      .expect(200);
  });
});
