import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const lines = [setCookieHeader].flat().filter((value): value is string => Boolean(value));
  const line = lines.find((cookie) => cookie.startsWith(`${name}=`));
  if (!line) {
    throw new Error(`Expected a ${name} cookie in the response`);
  }
  return line.split(';')[0]!.slice(name.length + 1);
}

describe('Refresh token rotation and revocation (real Postgres)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rotates the refresh token on use and revokes the whole family on reuse', async () => {
    const email = `refresh-rotation-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Refresh Test' })
      .expect(201);

    const originalRefreshCookie = extractCookie(
      registerResponse.headers['set-cookie'],
      'aletheia_refresh',
    );

    const firstRefresh = await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `aletheia_refresh=${originalRefreshCookie}`)
      .expect(200);

    const rotatedRefreshCookie = extractCookie(
      firstRefresh.headers['set-cookie'],
      'aletheia_refresh',
    );
    expect(rotatedRefreshCookie).not.toBe(originalRefreshCookie);

    // The rotated-out original token must no longer work.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `aletheia_refresh=${originalRefreshCookie}`)
      .expect(401);

    // Reusing it is treated as theft: the legitimate successor is revoked too.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `aletheia_refresh=${rotatedRefreshCookie}`)
      .expect(401);
  });

  it('logout revokes the refresh token so it can no longer be exchanged', async () => {
    const email = `refresh-logout-${Date.now()}@example.com`;

    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'Logout Test' })
      .expect(201);

    const refreshCookie = extractCookie(registerResponse.headers['set-cookie'], 'aletheia_refresh');

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', `aletheia_refresh=${refreshCookie}`)
      .expect(200);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `aletheia_refresh=${refreshCookie}`)
      .expect(401);
  });
});
