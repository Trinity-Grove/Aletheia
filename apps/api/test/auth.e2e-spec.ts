import { UnauthorizedException } from '@nestjs/common';
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
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: dto.email,
          fullName: dto.fullName,
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
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: dto.email,
          fullName: 'Test Guardian',
          createdAt: new Date().toISOString(),
        },
      };
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
});
