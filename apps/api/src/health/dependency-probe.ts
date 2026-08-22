import type { DependencyState } from '@aletheia/contracts';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/database/prisma.service';

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
export class NoopDependencyProbe implements DependencyProbe {
  async check(): Promise<DependencyState> {
    return 'degraded';
  }
}
