export type DependencyState = 'up' | 'down' | 'degraded';

export interface HealthResponse {
  status: 'ok';
  service: 'aletheia-api';
  version: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'degraded' | 'not-ready';
  dependencies: {
    postgres: DependencyState;
    redis: DependencyState;
    objectStorage: DependencyState;
  };
}
