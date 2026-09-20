import type { DependencyState } from '@aletheia/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ENVIRONMENT, type Environment } from '../platform/config/environment.js';
import { PrismaService } from '../platform/database/prisma.service.js';
import { ObjectStorageService } from '../platform/storage/object-storage.service.js';

export const POSTGRES_PROBE = Symbol('POSTGRES_PROBE');
export const REDIS_PROBE = Symbol('REDIS_PROBE');
export const OBJECT_STORAGE_PROBE = Symbol('OBJECT_STORAGE_PROBE');

export interface DependencyProbe {
  check(): Promise<DependencyState>;
}

@Injectable()
export class PostgresDependencyProbe implements DependencyProbe {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async check(): Promise<DependencyState> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}

@Injectable()
export class ObjectStorageDependencyProbe implements DependencyProbe {
  private readonly environment: Environment;
  private readonly objectStorage: ObjectStorageService;

  constructor(
    @Inject(ENVIRONMENT) environment: Environment,
    objectStorage: ObjectStorageService,
  ) {
    this.environment = environment;
    this.objectStorage = objectStorage;
  }

  async check(): Promise<DependencyState> {
    if (!this.environment.objectStorage) {
      return 'not_configured';
    }

    try {
      await this.objectStorage.checkHealth();
      return 'up';
    } catch {
      return 'down';
    }
  }
}

@Injectable()
export class NotConfiguredDependencyProbe implements DependencyProbe {
  async check(): Promise<DependencyState> {
    return 'not_configured';
  }
}
