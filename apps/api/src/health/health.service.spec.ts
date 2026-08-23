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
});
