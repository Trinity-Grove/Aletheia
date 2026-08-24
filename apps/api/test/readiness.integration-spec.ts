import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main';

describe('Health readiness with PostgreSQL', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the real PostgreSQL probe as up', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'degraded',
      dependencies: {
        postgres: 'up',
        redis: 'degraded',
        objectStorage: 'degraded',
      },
    });
  });
});
