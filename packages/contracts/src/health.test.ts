import { describe, expect, it } from 'vitest';
import type { HealthResponse, ReadinessResponse } from './health.js';

describe('health contracts', () => {
  it('accepts the stable liveness shape', () => {
    const response: HealthResponse = {
      status: 'ok',
      service: 'aletheia-api',
      version: '0.1.0',
      timestamp: '2026-08-21T00:00:00.000Z',
    };

    expect(response.service).toBe('aletheia-api');
  });

  it('represents degraded optional dependencies without hiding postgres', () => {
    const response: ReadinessResponse = {
      status: 'degraded',
      dependencies: {
        postgres: 'up',
        redis: 'down',
        objectStorage: 'down',
      },
    };

    expect(response.dependencies.postgres).toBe('up');
  });
});
