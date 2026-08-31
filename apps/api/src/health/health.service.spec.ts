import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('returns a stable UTC liveness response', () => {
    const now = new Date('2026-08-21T12:00:00.000Z');
    const service = new HealthService(() => now, '0.1.0');

    expect(service.live()).toEqual({
      status: 'ok',
      service: 'aletheia-api',
      version: '0.1.0',
      timestamp: '2026-08-21T12:00:00.000Z',
    });
  });

  it('is ready when required and optional dependencies are up', async () => {
    const service = new HealthService(
      () => new Date(),
      '0.1.0',
      { check: async () => 'up' },
      { check: async () => 'up' },
      { check: async () => 'up' },
    );

    await expect(service.ready()).resolves.toEqual({
      status: 'ready',
      dependencies: {
        postgres: 'up',
        redis: 'up',
        objectStorage: 'up',
      },
    });
  });

  it('is ready when postgres is up and optional dependencies are not configured', async () => {
    const service = new HealthService(
      () => new Date(),
      '0.1.0',
      { check: async () => 'up' },
      { check: async () => 'not_configured' },
      { check: async () => 'not_configured' },
    );

    await expect(service.ready()).resolves.toEqual({
      status: 'ready',
      dependencies: {
        postgres: 'up',
        redis: 'not_configured',
        objectStorage: 'not_configured',
      },
    });
  });

  it('is degraded when postgres is up and optional dependencies are down', async () => {
    const service = new HealthService(
      () => new Date(),
      '0.1.0',
      { check: async () => 'up' },
      { check: async () => 'down' },
      { check: async () => 'down' },
    );

    await expect(service.ready()).resolves.toMatchObject({
      status: 'degraded',
    });
  });

  it('is not-ready when postgres is down', async () => {
    const service = new HealthService(
      () => new Date(),
      '0.1.0',
      { check: async () => 'down' },
      { check: async () => 'up' },
      { check: async () => 'up' },
    );

    await expect(service.ready()).resolves.toMatchObject({
      status: 'not-ready',
    });
  });
});
