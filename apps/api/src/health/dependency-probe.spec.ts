import type { PrismaService } from '../platform/database/prisma.service.js';
import type { ObjectStorageService } from '../platform/storage/object-storage.service.js';
import {
  NotConfiguredDependencyProbe,
  ObjectStorageDependencyProbe,
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

  it('reports object storage not_configured when objectStorage config is null', async () => {
    const environment = { objectStorage: null } as any;
    const objectStorageService = { checkHealth: jest.fn() } as unknown as ObjectStorageService;
    const probe = new ObjectStorageDependencyProbe(environment, objectStorageService);

    await expect(probe.check()).resolves.toBe('not_configured');
    expect(objectStorageService.checkHealth).not.toHaveBeenCalled();
  });

  it('reports object storage up when checkHealth succeeds', async () => {
    const environment = {
      objectStorage: {
        endpoint: 'http://127.0.0.1:9000',
        accessKey: 'key',
        secretKey: 'secret',
        bucket: 'test-bucket',
      },
    } as any;
    const objectStorageService = {
      checkHealth: jest.fn().mockResolvedValue(undefined),
    } as unknown as ObjectStorageService;
    const probe = new ObjectStorageDependencyProbe(environment, objectStorageService);

    await expect(probe.check()).resolves.toBe('up');
    expect(objectStorageService.checkHealth).toHaveBeenCalled();
  });

  it('reports object storage down when checkHealth fails', async () => {
    const environment = {
      objectStorage: {
        endpoint: 'http://127.0.0.1:9000',
        accessKey: 'key',
        secretKey: 'secret',
        bucket: 'test-bucket',
      },
    } as any;
    const objectStorageService = {
      checkHealth: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as ObjectStorageService;
    const probe = new ObjectStorageDependencyProbe(environment, objectStorageService);

    await expect(probe.check()).resolves.toBe('down');
    expect(objectStorageService.checkHealth).toHaveBeenCalled();
  });
});
