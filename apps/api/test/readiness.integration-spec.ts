import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';

describe('Health readiness with PostgreSQL', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the real PostgreSQL probe as up and unwired optional dependencies as not_configured', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ready',
      dependencies: {
        postgres: 'up',
        redis: 'not_configured',
        objectStorage: 'not_configured',
      },
    });
  });
});
