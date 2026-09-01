import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';

describe('Identity Auth E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();

    // Override AuthService for in-memory E2E execution without external DB container
    const authService = app.get(AuthService);
    let tokenStore = '';
    jest.spyOn(authService, 'register').mockImplementation(async (dto) => {
      tokenStore = 'fake-jwt-token-12345';
      return {
        accessToken: tokenStore,
        refreshToken: 'fake-refresh-token-12345',
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: dto.email,
          fullName: dto.fullName,
          emailVerified: false,
          createdAt: new Date().toISOString(),
        },
      };
    });
    jest.spyOn(authService, 'login').mockImplementation(async (dto) => {
      if (dto.password === 'wrong') {
        throw new UnauthorizedException('Invalid email or password.');
      }
      return {
        accessToken: 'fake-jwt-token-12345',
        refreshToken: 'fake-refresh-token-12345',
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: dto.email,
          fullName: 'Test Guardian',
          emailVerified: false,
          createdAt: new Date().toISOString(),
        },
      };
    });
    jest.spyOn(authService, 'refresh').mockImplementation(async (token) => {
      if (token !== 'fake-refresh-token-12345') {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      return {
        accessToken: 'rotated-jwt-token-67890',
        refreshToken: 'rotated-refresh-token-67890',
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'guardian@test.com',
          fullName: 'Test Guardian',
          emailVerified: false,
          createdAt: new Date().toISOString(),
        },
      };
    });
    jest.spyOn(authService, 'revokeRefreshToken').mockResolvedValue(undefined);
    jest.spyOn(authService, 'verifyEmail').mockImplementation(async (token) => {
      if (token !== 'valid-verification-token') {
        throw new BadRequestException('Invalid verification token.');
      }
    });
    jest.spyOn(authService, 'resendVerificationEmail').mockResolvedValue(undefined);
    jest.spyOn(authService, 'forgotPassword').mockResolvedValue(undefined);
    jest.spyOn(authService, 'resetPassword').mockImplementation(async (token) => {
      if (token !== 'valid-reset-token') {
        throw new BadRequestException('Invalid reset token.');
      }
    });
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === 'fake-jwt-token-12345') {
        return {
          userId: '11111111-1111-1111-1111-111111111111',
          email: 'guardian@test.com',
        };
      }
      return null;
    });
    jest.spyOn(authService, 'getProfile').mockImplementation(async (userId) => {
      return {
        id: userId,
        email: 'guardian@test.com',
        fullName: 'Test Guardian',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register creates guardian and returns token', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'guardian@test.com',
        password: 'password123',
        fullName: 'Test Guardian',
      })
      .expect(201);

    expect(response.body.accessToken).toBe('fake-jwt-token-12345');
    expect(response.body.user.email).toBe('guardian@test.com');
    // The refresh token is cookie-only — it must never be exposed in the body.
    expect(response.body.refreshToken).toBeUndefined();
    const cookies = [response.headers['set-cookie']].flat().join(';');
    expect(cookies).toContain('aletheia_session=');
    expect(cookies).toContain('aletheia_refresh=');
  });

  it('POST /api/v1/auth/login logs in guardian', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'guardian@test.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.accessToken).toBe('fake-jwt-token-12345');
  });

  it('GET /api/v1/auth/me returns profile when authenticated', async () => {
    const response = await supertest(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer fake-jwt-token-12345')
      .expect(200);

    expect(response.body.email).toBe('guardian@test.com');
    expect(response.body.fullName).toBe('Test Guardian');
  });

  it('GET /api/v1/auth/me returns 401 when unauthenticated', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('POST /api/v1/auth/refresh exchanges a valid refresh cookie for a new pair', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'aletheia_refresh=fake-refresh-token-12345')
      .expect(200);

    expect(response.body.accessToken).toBe('rotated-jwt-token-67890');
    expect(response.body.refreshToken).toBeUndefined();
    const cookies = [response.headers['set-cookie']].flat().join(';');
    expect(cookies).toContain('aletheia_session=rotated-jwt-token-67890');
    expect(cookies).toContain('aletheia_refresh=rotated-refresh-token-67890');
  });

  it('POST /api/v1/auth/refresh returns 401 without a refresh cookie', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .expect(401);
  });

  it('POST /api/v1/auth/refresh returns 401 for an invalid refresh cookie', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'aletheia_refresh=not-a-real-token')
      .expect(401);
  });

  it('POST /api/v1/auth/logout revokes the refresh token and clears both cookies', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', 'aletheia_refresh=fake-refresh-token-12345')
      .expect(200);

    expect(response.body).toEqual({ success: true });
    const cookies = [response.headers['set-cookie']].flat().join(';');
    expect(cookies).toContain('aletheia_session=;');
    expect(cookies).toContain('aletheia_refresh=;');
  });

  it('POST /api/v1/auth/verify-email confirms the account with a valid token', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: 'valid-verification-token' })
      .expect(200);

    expect(response.body).toEqual({ success: true });
  });

  it('POST /api/v1/auth/verify-email returns 400 for an invalid token', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: 'not-a-real-token' })
      .expect(400);
  });

  it('POST /api/v1/auth/verify-email returns 400 when the token is missing', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({})
      .expect(400);
  });

  it('POST /api/v1/auth/resend-verification requires authentication', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .expect(401);
  });

  it('POST /api/v1/auth/resend-verification succeeds when authenticated', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .set('Authorization', 'Bearer fake-jwt-token-12345')
      .expect(200);

    expect(response.body).toEqual({ success: true });
  });

  it('POST /api/v1/auth/forgot-password always returns success', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'someone@example.com' })
      .expect(200);

    expect(response.body).toEqual({ success: true });
  });

  it('POST /api/v1/auth/forgot-password returns 400 for an invalid email', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /api/v1/auth/reset-password resets the password with a valid token', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: 'brandNewPassword123' })
      .expect(200);

    expect(response.body).toEqual({ success: true });
  });

  it('POST /api/v1/auth/reset-password returns 400 for an invalid token', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'not-a-real-token', newPassword: 'brandNewPassword123' })
      .expect(400);
  });

  it('POST /api/v1/auth/reset-password returns 400 for a weak new password', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: 'short' })
      .expect(400);
  });
});
