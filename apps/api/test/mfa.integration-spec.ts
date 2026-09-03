import { createHmac } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

function sessionCookie(res: supertest.Response): string {
  const cookie = [res.headers['set-cookie']]
    .flat()
    .find((c) => (c as string)?.startsWith('aletheia_session='));
  if (!cookie) {
    throw new Error('Expected an aletheia_session cookie.');
  }
  return cookie as string;
}

function refreshCookie(res: supertest.Response): string {
  const cookie = [res.headers['set-cookie']]
    .flat()
    .find((c) => (c as string)?.startsWith('aletheia_refresh='));
  if (!cookie) {
    throw new Error('Expected an aletheia_refresh cookie.');
  }
  return cookie as string;
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(secret: string): Buffer {
  let bits = '';
  for (const char of secret.toUpperCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// Self-contained RFC 6238 TOTP (SHA-1, 30s period, 6 digits) so the test can
// mint a real code without pulling otplib's ESM source into Jest. The API
// itself verifies with real otplib, so this still proves real end-to-end flow.
function otpCode(otpauthUri: string): string {
  const secret = new URL(otpauthUri).searchParams.get('secret');
  if (!secret) {
    throw new Error('otpauth URI did not contain a secret.');
  }
  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

describe('MFA (TOTP) — real Postgres + real otplib', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function register(email: string) {
    const res = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password12345', fullName: 'MFA Test User' })
      .expect(201);
    return { session: sessionCookie(res), refresh: refreshCookie(res) };
  }

  async function enableMfa(session: string, email: string, password: string) {
    const setup = await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/setup')
      .set('Cookie', session)
      .send({ password })
      .expect(200);

    expect(setup.body.recoveryCodes).toHaveLength(10);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/confirm')
      .set('Cookie', session)
      .send({ code: otpCode(setup.body.otpauthUri) })
      .expect(200);

    return { otpauthUri: setup.body.otpauthUri as string, recoveryCodes: setup.body.recoveryCodes as string[] };
  }

  it('full round trip: setup → confirm → two-step login with a real TOTP code', async () => {
    const email = `mfa-roundtrip-${Date.now()}@example.com`;
    const { session, refresh } = await register(email);
    const { otpauthUri } = await enableMfa(session, email, 'password12345');

    // Log out; the next login must now be two-step.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', refresh)
      .expect(200);

    // Login returns a challenge, not a session — and sets no cookies.
    const loginRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);

    expect(loginRes.body.mfaRequired).toBe(true);
    expect(loginRes.body.challengeToken).toBeDefined();
    expect(loginRes.headers['set-cookie']).toBeUndefined();

    // Verify with a freshly minted code for the SAME secret we enrolled.
    const verify = await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeToken: loginRes.body.challengeToken, code: otpCode(otpauthUri) })
      .expect(200);

    expect(verify.body.accessToken).toBeDefined();
    const cookies = [verify.headers['set-cookie']].flat().join(';');
    expect(cookies).toContain('aletheia_session=');
    expect(cookies).toContain('aletheia_refresh=');
  });

  it('recovery-code login works once, then the same code is rejected', async () => {
    const email = `mfa-recovery-${Date.now()}@example.com`;
    const { session } = await register(email);
    const { recoveryCodes } = await enableMfa(session, email, 'password12345');

    const recoveryCode = recoveryCodes[0]!;

    const firstChallenge = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);
    expect(firstChallenge.body.mfaRequired).toBe(true);

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeToken: firstChallenge.body.challengeToken, code: recoveryCode })
      .expect(200);

    const secondChallenge = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);

    // Same (now single-used) recovery code must fail.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeToken: secondChallenge.body.challengeToken, code: recoveryCode })
      .expect(400);
  });

  it('burning 5 wrong codes exhausts the challenge, forcing a fresh login', async () => {
    const email = `mfa-exhaust-${Date.now()}@example.com`;
    const { session } = await register(email);
    await enableMfa(session, email, 'password12345');

    const challenge = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);

    for (let i = 0; i < 5; i += 1) {
      await supertest(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({ challengeToken: challenge.body.challengeToken, code: '000000' })
        .expect(400);
    }

    // The challenge is now gone — the same token is no longer usable.
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify')
      .send({ challengeToken: challenge.body.challengeToken, code: '000000' })
      .expect(404);

    // A fresh login yields a fresh (still usable) challenge.
    const fresh = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);
    expect(fresh.body.mfaRequired).toBe(true);
  });

  it('disabling MFA clears state, so a later login is single-step again', async () => {
    const email = `mfa-disable-${Date.now()}@example.com`;
    const { session } = await register(email);
    await enableMfa(session, email, 'password12345');

    await supertest(app.getHttpServer())
      .post('/api/v1/auth/mfa/disable')
      .set('Cookie', session)
      .send({ password: 'password12345' })
      .expect(200);

    const loginRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password12345' })
      .expect(200);

    expect(loginRes.body.mfaRequired).toBeUndefined();
    expect(loginRes.body.accessToken).toBeDefined();
  });
});
