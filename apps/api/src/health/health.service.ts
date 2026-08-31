import type {
  DependencyState,
  HealthResponse,
  ReadinessResponse,
} from '@aletheia/contracts';
import { Inject, Injectable, Optional } from '@nestjs/common';
import * as process from 'node:process';
import {
  OBJECT_STORAGE_PROBE,
  POSTGRES_PROBE,
  REDIS_PROBE,
  type DependencyProbe,
} from './dependency-probe';

const notConfiguredProbe: DependencyProbe = {
  check: async () => 'not_configured',
};

@Injectable()
export class HealthService {
  private readonly now: () => Date;
  private readonly version: string;
  private readonly postgres: DependencyProbe;
  private readonly redis: DependencyProbe;
  private readonly objectStorage: DependencyProbe;

  constructor(
    @Optional()
    now: () => Date = () => new Date(),
    @Optional()
    version: string = process.env.npm_package_version ?? '0.0.0',
    @Inject(POSTGRES_PROBE)
    @Optional()
    postgres: DependencyProbe = notConfiguredProbe,
    @Inject(REDIS_PROBE)
    @Optional()
    redis: DependencyProbe = notConfiguredProbe,
    @Inject(OBJECT_STORAGE_PROBE)
    @Optional()
    objectStorage: DependencyProbe = notConfiguredProbe,
  ) {
    this.now = now;
    this.version = version;
    this.postgres = postgres;
    this.redis = redis;
    this.objectStorage = objectStorage;
  }

  live(): HealthResponse {
    return {
      status: 'ok',
      service: 'aletheia-api',
      version: this.version,
      timestamp: this.now().toISOString(),
    };
  }

  async ready(): Promise<ReadinessResponse> {
    const [postgres, redis, objectStorage] = await Promise.all([
      this.postgres.check(),
      this.redis.check(),
      this.objectStorage.check(),
    ]);

    return {
      status: this.readinessStatus(postgres, redis, objectStorage),
      dependencies: { postgres, redis, objectStorage },
    };
  }

  private readinessStatus(
    postgres: DependencyState,
    redis: DependencyState,
    objectStorage: DependencyState,
  ): ReadinessResponse['status'] {
    if (postgres !== 'up') {
      return 'not-ready';
    }

    const isDegraded = (state: DependencyState) =>
      state !== 'up' && state !== 'not_configured';

    if (isDegraded(redis) || isDegraded(objectStorage)) {
      return 'degraded';
    }

    return 'ready';
  }
}
