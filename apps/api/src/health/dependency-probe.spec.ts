import type { PrismaService } from '../platform/database/prisma.service.js';
import {
  NotConfiguredDependencyProbe,
  PostgresDependencyProbe,
} from './dependency-probe.js';

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

  it('reports an unconfigured optional dependency as not_configured', async () => {
    const probe = new NotConfiguredDependencyProbe();

    await expect(probe.check()).resolves.toBe('not_configured');
  });
});
