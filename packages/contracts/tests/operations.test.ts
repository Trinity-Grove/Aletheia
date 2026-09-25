import { describe, expect, it } from 'vitest';
import {
  OperationalStatusResponseSchema,
  OperationalAlertEventSchema,
  AcknowledgeAlertSchema,
  RailwayWebhookPayloadSchema,
} from '../src/operations.js';

describe('Operational Contracts & Schemas', () => {
  it('validates a valid OperationalStatusResponse payload', () => {
    const valid = {
      service: 'aletheia-api',
      version: '0.1.0',
      uptimeSeconds: 3600,
      timestamp: new Date().toISOString(),
      overallHealth: 'HEALTHY',
      dependencies: {
        postgres: { status: 'UP', responseTimeMs: 4, activeConnections: 5 },
        objectStorage: { status: 'UP', responseTimeMs: 12 },
        redis: { status: 'NOT_CONFIGURED', responseTimeMs: 0 },
      },
      resources: {
        memoryHeapUsedMb: 64,
        memoryHeapTotalMb: 128,
        memoryRssMb: 180,
        nodeVersion: 'v24.13.3',
      },
      railwayDashboardLinks: {
        projectUrl: 'https://railway.com/project/123',
        metricsUrl: 'https://railway.com/project/123/metrics',
        logsUrl: 'https://railway.com/project/123/logs',
      },
    };

    const parsed = OperationalStatusResponseSchema.parse(valid);
    expect(parsed.service).toBe('aletheia-api');
    expect(parsed.overallHealth).toBe('HEALTHY');
  });

  it('validates RailwayWebhookPayloadSchema with passthrough', () => {
    const webhook = {
      type: 'CRASH',
      environment: 'production',
      service: { id: 'srv-1', name: 'api' },
      message: 'Container exited with code 1',
      severity: 'CRITICAL',
      customField: 123,
    };

    const parsed = RailwayWebhookPayloadSchema.parse(webhook);
    expect(parsed.type).toBe('CRASH');
    expect((parsed as any).customField).toBe(123);
  });

  it('validates OperationalAlertEventSchema with nullable fields', () => {
    const event = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      source: 'RAILWAY',
      eventType: 'DEPLOY_FAILED',
      severity: 'CRITICAL',
      serviceName: 'aletheia-api',
      message: 'Deployment failed during healthcheck',
      payload: { code: 500, details: 'timeout' },
      receivedAt: new Date().toISOString(),
      acknowledgedAt: null,
      acknowledgedBy: null,
    };

    const parsed = OperationalAlertEventSchema.parse(event);
    expect(parsed.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(parsed.acknowledgedAt).toBeNull();
    expect(parsed.acknowledgedBy).toBeNull();
  });

  it('validates OperationalAlertEventSchema with acknowledged fields', () => {
    const event = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      source: 'RAILWAY',
      eventType: 'DEPLOY_FAILED',
      severity: 'WARNING',
      serviceName: null,
      message: 'Warning alert',
      payload: {},
      receivedAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    };

    const parsed = OperationalAlertEventSchema.parse(event);
    expect(parsed.serviceName).toBeNull();
    expect(parsed.acknowledgedBy).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
  });

  it('validates AcknowledgeAlertSchema', () => {
    const ack1 = { notes: 'Investigated and resolved' };
    const ack2 = {};

    expect(AcknowledgeAlertSchema.parse(ack1).notes).toBe('Investigated and resolved');
    expect(AcknowledgeAlertSchema.parse(ack2).notes).toBeUndefined();
  });
});
