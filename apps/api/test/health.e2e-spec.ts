import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';

describe('Health liveness endpoint', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health/live matches the shared contract', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/live',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'aletheia-api',
    });
    expect(response.json().timestamp).toMatch(/Z$/);
  });

  it('GET /api/docs-json serves the OpenAPI document', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/docs-json',
    });
    const document = response.json();

    expect(response.statusCode).toBe(200);
    expect(document).toMatchObject({
      info: {
        title: 'Aletheia API',
      },
      paths: {
        '/api/v1/health/live': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/HealthResponse',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(document.components.schemas.HealthResponse).toEqual({
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['aletheia-api'] },
        version: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['status', 'service', 'version', 'timestamp'],
    });
  });

  it('documents readiness payloads for both 200 and 503 responses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/docs-json',
    });
    const document = response.json();
    const readinessResponses =
      document.paths['/api/v1/health/ready'].get.responses;

    expect(readinessResponses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ReadinessResponse',
          },
        },
      },
    });
    expect(readinessResponses['503']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ReadinessResponse',
          },
        },
      },
    });
    expect(document.components.schemas.ReadinessResponse).toEqual({
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ready', 'degraded', 'not-ready'],
        },
        dependencies: {
          $ref: '#/components/schemas/ReadinessDependencies',
        },
      },
      required: ['status', 'dependencies'],
    });
    expect(document.components.schemas.ReadinessDependencies).toEqual({
      type: 'object',
      properties: {
        postgres: {
          type: 'string',
          enum: ['up', 'down', 'degraded', 'not_configured'],
        },
        redis: {
          type: 'string',
          enum: ['up', 'down', 'degraded', 'not_configured'],
        },
        objectStorage: {
          type: 'string',
          enum: ['up', 'down', 'degraded', 'not_configured'],
        },
      },
      required: ['postgres', 'redis', 'objectStorage'],
    });
  });

  it('GET /api/v1/health/ready reports not_configured (not degraded) for unwired optional dependencies', async () => {
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

  it('GET /api/docs serves the Swagger UI', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/docs',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
