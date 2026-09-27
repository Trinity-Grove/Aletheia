import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';

export interface RegisterGuardianOverrides {
  email: string;
  password?: string;
  fullName?: string;
  countryCode?: string;
  acceptedTermsOfUse?: boolean;
  acceptedPrivacyPolicy?: boolean;
}

// Registers a guardian and immediately confirms the emailed 6-digit code
// via the non-production-only debug-code endpoint, returning the CONFIRM
// response -- not the register response, which no longer carries a
// session at all. Its body is the same AuthResponseDto shape
// (accessToken + user) and its Set-Cookie headers are the same session/
// refresh cookies that register() used to set directly, so every
// existing per-file sessionCookie(res)/refreshCookie(res) helper keeps
// working unchanged: just point it at this response instead.
export async function registerAndConfirmGuardian(
  app: NestFastifyApplication,
  overrides: RegisterGuardianOverrides,
): Promise<supertest.Response> {
  const payload = {
    password: 'password12345',
    fullName: 'Test Guardian',
    countryCode: 'BRA',
    acceptedTermsOfUse: true,
    acceptedPrivacyPolicy: true,
    ...overrides,
  };

  const registerRes = await supertest(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(payload)
    .expect(201);

  const { challengeToken } = registerRes.body as { challengeToken: string };

  const debugRes = await supertest(app.getHttpServer())
    .get('/api/v1/auth/register/debug-code')
    .query({ challengeToken })
    .expect(200);
  const { code } = debugRes.body as { code: string };

  return supertest(app.getHttpServer())
    .post('/api/v1/auth/register/confirm')
    .send({ challengeToken, code })
    .expect(200);
}
