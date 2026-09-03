import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

function extractSessionCookie(setCookieHeader: unknown): string {
  const cookie = [setCookieHeader]
    .flat()
    .find((c): c is string => typeof c === 'string' && c.startsWith('aletheia_session='));
  if (!cookie) {
    throw new Error('No session cookie found in response headers.');
  }
  return cookie;
}

describe('Family invitations (real Postgres, token hashing)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndCreateFamily() {
    const email = `invite-hash-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'ownerPassword123', fullName: 'Owner Guardian' })
      .expect(201);

    const sessionCookie = extractSessionCookie(registerResponse.headers['set-cookie']);

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', sessionCookie)
      .send({ name: 'Hash Test Family', countryCode: 'BRA' })
      .expect(201);

    return { sessionCookie, familyId: familyResponse.body.id as string };
  }

  it('never returns the invitation token from list, and the token only works once for accept', async () => {
    const { sessionCookie, familyId } = await registerAndCreateFamily();

    const createResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/invitations`)
      .set('Cookie', sessionCookie)
      .send({ email: 'invitee@example.com', role: 'CO_GUARDIAN' })
      .expect(201);

    const token = createResponse.body.token as string;
    expect(token).toBeTruthy();

    const listResponse = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/invitations`)
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].token).toBeUndefined();

    // The plaintext token issued at creation must still work for accept —
    // proving the hash-at-rest round-trips correctly against real Postgres.
    const inviteeEmail = `invitee-${Date.now()}@example.com`;
    const inviteeRegisterResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: inviteeEmail, password: 'inviteePassword123', fullName: 'Invitee' })
      .expect(201);
    const inviteeSessionCookie = extractSessionCookie(inviteeRegisterResponse.headers['set-cookie']);

    const acceptResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/invitations/${token}/accept`)
      .set('Cookie', inviteeSessionCookie)
      .expect(200);

    expect(acceptResponse.body.success).toBe(true);
    expect(acceptResponse.body.familyId).toBe(familyId);

    // Single-use: the same token must not work a second time.
    await supertest(app.getHttpServer())
      .post(`/api/v1/invitations/${token}/accept`)
      .set('Cookie', inviteeSessionCookie)
      .expect(400);
  });

  it('rejects an unrecognized invitation token', async () => {
    const { sessionCookie } = await registerAndCreateFamily();

    await supertest(app.getHttpServer())
      .post('/api/v1/invitations/not-a-real-token/accept')
      .set('Cookie', sessionCookie)
      .expect(404);
  });
});
