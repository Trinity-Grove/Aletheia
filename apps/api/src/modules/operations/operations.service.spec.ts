import { NotFoundException } from '@nestjs/common';
import {
  OperationalAlertEventSchema,
  OperationalStatusResponseSchema,
  type RailwayWebhookPayloadDto,
} from '@aletheia/contracts';
import type { PrismaService } from '../../platform/database/prisma.service.js';
import type { DependencyProbe } from '../../health/dependency-probe.js';
import { OperationsService } from './operations.service.js';

describe('OperationsService', () => {
  let service: OperationsService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockPostgresProbe: jest.Mocked<DependencyProbe>;
  let mockObjectStorageProbe: jest.Mocked<DependencyProbe>;
  let mockRedisProbe: jest.Mocked<DependencyProbe>;

  beforeEach(() => {
    mockPrisma = {
      operationalAlertEvent: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    mockPostgresProbe = {
      check: jest.fn().mockResolvedValue('up'),
    };
    mockObjectStorageProbe = {
      check: jest.fn().mockResolvedValue('up'),
    };
    mockRedisProbe = {
      check: jest.fn().mockResolvedValue('not_configured'),
    };

    service = new OperationsService(
      mockPrisma,
      mockPostgresProbe,
      mockObjectStorageProbe,
      mockRedisProbe,
    );
  });

  describe('getStatus', () => {
    it('returns overallHealth HEALTHY when postgres and objectStorage are UP and redis is NOT_CONFIGURED', async () => {
      const status = await service.getStatus();

      expect(status.service).toBe('aletheia-api');
      expect(status.overallHealth).toBe('HEALTHY');
      expect(status.dependencies.postgres.status).toBe('UP');
      expect(status.dependencies.objectStorage.status).toBe('UP');
      expect(status.dependencies.redis.status).toBe('NOT_CONFIGURED');
      expect(typeof status.dependencies.postgres.responseTimeMs).toBe('number');
      expect(status.resources.memoryHeapUsedMb).toBeGreaterThan(0);
      expect(status.resources.nodeVersion).toBe(process.version);
      expect(status.railwayDashboardLinks.projectUrl).toBeDefined();

      const validation = OperationalStatusResponseSchema.safeParse(status);
      expect(validation.success).toBe(true);
    });

    it('returns overallHealth DEGRADED when objectStorage is DOWN but postgres is UP', async () => {
      mockObjectStorageProbe.check.mockResolvedValue('down');

      const status = await service.getStatus();

      expect(status.overallHealth).toBe('DEGRADED');
      expect(status.dependencies.objectStorage.status).toBe('DOWN');
      expect(OperationalStatusResponseSchema.safeParse(status).success).toBe(true);
    });

    it('returns overallHealth CRITICAL when postgres is DOWN', async () => {
      mockPostgresProbe.check.mockResolvedValue('down');

      const status = await service.getStatus();

      expect(status.overallHealth).toBe('CRITICAL');
      expect(status.dependencies.postgres.status).toBe('DOWN');
      expect(OperationalStatusResponseSchema.safeParse(status).success).toBe(true);
    });

    it('uses custom Railway URLs from environment if set', async () => {
      const origProject = process.env.RAILWAY_PROJECT_URL;
      const origMetrics = process.env.RAILWAY_METRICS_URL;
      const origLogs = process.env.RAILWAY_LOGS_URL;

      process.env.RAILWAY_PROJECT_URL = 'https://railway.com/project/custom-project';
      process.env.RAILWAY_METRICS_URL = 'https://railway.com/project/custom-project/metrics';
      process.env.RAILWAY_LOGS_URL = 'https://railway.com/project/custom-project/logs';

      try {
        const status = await service.getStatus();
        expect(status.railwayDashboardLinks.projectUrl).toBe('https://railway.com/project/custom-project');
        expect(status.railwayDashboardLinks.metricsUrl).toBe('https://railway.com/project/custom-project/metrics');
        expect(status.railwayDashboardLinks.logsUrl).toBe('https://railway.com/project/custom-project/logs');
      } finally {
        process.env.RAILWAY_PROJECT_URL = origProject;
        process.env.RAILWAY_METRICS_URL = origMetrics;
        process.env.RAILWAY_LOGS_URL = origLogs;
      }
    });
  });

  describe('listAlerts', () => {
    const alertDbRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'RAILWAY',
      eventType: 'DEPLOY',
      severity: 'WARNING' as const,
      serviceName: 'api',
      message: 'Deployment warning',
      payload: { reason: 'high_mem' },
      receivedAt: new Date('2026-09-25T12:00:00.000Z'),
      acknowledgedAt: null,
      acknowledgedBy: null,
    };

    it('lists alerts with default limit of 50 ordered by receivedAt desc', async () => {
      (mockPrisma.operationalAlertEvent.findMany as jest.Mock).mockResolvedValue([alertDbRecord]);

      const alerts = await service.listAlerts();

      expect(mockPrisma.operationalAlertEvent.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { receivedAt: 'desc' },
        take: 50,
      });
      expect(alerts).toHaveLength(1);
      const alert = alerts[0]!;
      expect(alert.id).toBe(alertDbRecord.id);
      expect(alert.receivedAt).toBe('2026-09-25T12:00:00.000Z');
      expect(alert.acknowledgedAt).toBeNull();
      expect(OperationalAlertEventSchema.safeParse(alert).success).toBe(true);
    });

    it('filters alerts by acknowledged = true', async () => {
      (mockPrisma.operationalAlertEvent.findMany as jest.Mock).mockResolvedValue([]);

      await service.listAlerts({ acknowledged: true, limit: 10 });

      expect(mockPrisma.operationalAlertEvent.findMany).toHaveBeenCalledWith({
        where: { acknowledgedAt: { not: null } },
        orderBy: { receivedAt: 'desc' },
        take: 10,
      });
    });

    it('filters alerts by acknowledged = false', async () => {
      (mockPrisma.operationalAlertEvent.findMany as jest.Mock).mockResolvedValue([]);

      await service.listAlerts({ acknowledged: false });

      expect(mockPrisma.operationalAlertEvent.findMany).toHaveBeenCalledWith({
        where: { acknowledgedAt: null },
        orderBy: { receivedAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('acknowledgeAlert', () => {
    const alertId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    it('throws NotFoundException if alert does not exist', async () => {
      (mockPrisma.operationalAlertEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.acknowledgeAlert(alertId, userId)).rejects.toThrow(NotFoundException);
    });

    it('acknowledges an alert and appends notes to payload', async () => {
      const existing = {
        id: alertId,
        source: 'RAILWAY',
        eventType: 'DEPLOY',
        severity: 'WARNING' as const,
        serviceName: 'api',
        message: 'Deployment failed',
        payload: { existingKey: 'value' },
        receivedAt: new Date('2026-09-25T12:00:00.000Z'),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };

      const now = new Date('2026-09-25T12:05:00.000Z');
      const updated = {
        ...existing,
        acknowledgedAt: now,
        acknowledgedBy: userId,
        payload: { existingKey: 'value', acknowledgmentNotes: 'Investigating incident' },
      };

      (mockPrisma.operationalAlertEvent.findUnique as jest.Mock).mockResolvedValue(existing);
      (mockPrisma.operationalAlertEvent.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.acknowledgeAlert(alertId, userId, 'Investigating incident');

      expect(mockPrisma.operationalAlertEvent.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: expect.objectContaining({
          acknowledgedBy: userId,
          payload: { existingKey: 'value', acknowledgmentNotes: 'Investigating incident' },
        }),
      });
      expect(result.acknowledgedAt).toBe('2026-09-25T12:05:00.000Z');
      expect(result.acknowledgedBy).toBe(userId);
      expect(OperationalAlertEventSchema.safeParse(result).success).toBe(true);
    });
  });

  describe('handleRailwayWebhook', () => {
    it('persists a webhook payload and infers CRITICAL severity for crashed deployment', async () => {
      const createdAlert = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        source: 'RAILWAY',
        eventType: 'DEPLOY',
        severity: 'CRITICAL',
        serviceName: 'aletheia-api',
        message: 'Deployment crashed in production',
        payload: {},
        receivedAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
      };

      (mockPrisma.operationalAlertEvent.create as jest.Mock).mockResolvedValue(createdAlert);

      const payload: RailwayWebhookPayloadDto = {
        type: 'DEPLOY',
        environment: 'production',
        service: { id: 'svc-1', name: 'aletheia-api' },
        deployment: { id: 'dep-1', status: 'CRASHED' },
        message: 'Deployment crashed in production',
      };

      const result = await service.handleRailwayWebhook(payload);

      expect(mockPrisma.operationalAlertEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source: 'RAILWAY',
          eventType: 'DEPLOY',
          severity: 'CRITICAL',
          serviceName: 'aletheia-api',
          message: 'Deployment crashed in production',
        }),
      });
      expect(result).toEqual({ received: true, alertId: createdAlert.id });
    });

    it('infers INFO severity for successful deployment', async () => {
      const createdAlert = {
        id: '123e4567-e89b-12d3-a456-426614174001',
      };
      (mockPrisma.operationalAlertEvent.create as jest.Mock).mockResolvedValue(createdAlert);

      const payload: RailwayWebhookPayloadDto = {
        type: 'DEPLOY',
        service: { name: 'aletheia-api' },
        deployment: { status: 'SUCCESS' },
      };

      await service.handleRailwayWebhook(payload);

      expect(mockPrisma.operationalAlertEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'INFO',
        }),
      });
    });

    it('respects explicit severity when provided in payload', async () => {
      const createdAlert = {
        id: '123e4567-e89b-12d3-a456-426614174002',
      };
      (mockPrisma.operationalAlertEvent.create as jest.Mock).mockResolvedValue(createdAlert);

      const payload: RailwayWebhookPayloadDto = {
        type: 'CUSTOM_ALERT',
        severity: 'CRITICAL',
        message: 'Memory threshold exceeded 90%',
      };

      await service.handleRailwayWebhook(payload);

      expect(mockPrisma.operationalAlertEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'CRITICAL',
          message: 'Memory threshold exceeded 90%',
        }),
      });
    });
  });
});
