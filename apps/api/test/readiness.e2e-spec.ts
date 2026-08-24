import { VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { DependencyState } from '@aletheia/contracts';
import { AppModule } from '../src/app.module.js';
import {
  OBJECT_STORAGE_PROBE,
  POSTGRES_PROBE,
  REDIS_PROBE,
  type DependencyProbe,
} from '../src/health/dependency-probe.js';

class MutableProbe implements DependencyProbe {
  state: DependencyState;

  constructor(state: DependencyState) {
    this.state = state;
  }

  async check(): Promise<DependencyState> {
    return this.state;
  }
}

describe('Health readiness endpoint', () => {
  let app: NestFastifyApplication;
  const postgres = new MutableProbe('up');
  const redis = new MutableProbe('up');
  const objectStorage = new MutableProbe('up');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(POSTGRES_PROBE)
      .useValue(postgres)
      .overrideProvider(REDIS_PROBE)
      .useValue(redis)
      .overrideProvider(OBJECT_STORAGE_PROBE)
      .useValue(objectStorage)
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 when all dependencies are up', async () => {
    postgres.state = 'up';
    redis.state = 'up';
    objectStorage.state = 'up';

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ready',
      dependencies: {
        postgres: 'up',
        redis: 'up',
        objectStorage: 'up',
      },
    });
  });

  it('returns 200 when optional dependencies are unavailable', async () => {
    postgres.state = 'up';
    redis.state = 'degraded';
    objectStorage.state = 'degraded';

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'degraded' });
  });

  it('returns 503 only when PostgreSQL is unavailable', async () => {
    postgres.state = 'down';
    redis.state = 'up';
    objectStorage.state = 'up';

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'not-ready' });
  });
});
