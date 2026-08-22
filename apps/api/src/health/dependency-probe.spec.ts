import { describe, expect, it } from '@jest/globals';
import type { PrismaService } from '../platform/database/prisma.service';
import {
  NoopDependencyProbe,
  PostgresDependencyProbe,
} from './dependency-probe';

describe('dependency probes', () => {
  it('reports PostgreSQL up after executing SELECT 1', async () => {
    const prisma = {
      $queryRaw: async (query: TemplateStringsArray) => {
        expect(query.join('')).toBe('SELECT 1');
        return [{ '?column?': 1 }];
      },
    } as unknown as PrismaService;
    const probe = new PostgresDependencyProbe(prisma);

    await expect(probe.check()).resolves.toBe('up');
  });

  it('reports PostgreSQL down when the query fails', async () => {
    const prisma = {
      $queryRaw: async () => {
        throw new Error('database unavailable');
      },
    } as unknown as PrismaService;
    const probe = new PostgresDependencyProbe(prisma);

    await expect(probe.check()).resolves.toBe('down');
  });

  it('reports an unconfigured optional dependency as degraded', async () => {
    const probe = new NoopDependencyProbe();

    await expect(probe.check()).resolves.toBe('degraded');
  });
});
