import { performance } from 'node:perf_hooks';
import * as process from 'node:process';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  OperationalStatusResponseSchema,
  type DependencyState,
  type OperationalAlertEventDto,
  type OperationalStatusResponseDto,
  type RailwayWebhookPayloadDto,
} from '@aletheia/contracts';
import { PrismaService } from '../../platform/database/prisma.service.js';
import {
  OBJECT_STORAGE_PROBE,
  POSTGRES_PROBE,
  REDIS_PROBE,
  type DependencyProbe,
} from '../../health/dependency-probe.js';

function mapState(state: DependencyState): 'UP' | 'DOWN' | 'DEGRADED' | 'NOT_CONFIGURED' {
  switch (state) {
    case 'up':
      return 'UP';
    case 'down':
      return 'DOWN';
    case 'degraded':
      return 'DEGRADED';
    case 'not_configured':
    default:
      return 'NOT_CONFIGURED';
  }
}

async function measureProbe(probe: DependencyProbe): Promise<{
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'NOT_CONFIGURED';
  responseTimeMs: number;
}> {
  const start = performance.now();
  let state: DependencyState = 'not_configured';
  try {
    state = await probe.check();
  } catch {
    state = 'down';
  }
  const responseTimeMs = Math.round((performance.now() - start) * 100) / 100;
  return {
    status: mapState(state),
    responseTimeMs,
  };
}

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(POSTGRES_PROBE)
    private readonly postgresProbe: DependencyProbe,
    @Inject(OBJECT_STORAGE_PROBE)
    private readonly objectStorageProbe: DependencyProbe,
    @Inject(REDIS_PROBE)
    private readonly redisProbe: DependencyProbe,
  ) {}

  async getStatus(): Promise<OperationalStatusResponseDto> {
    const [postgresCheck, objectStorageCheck, redisCheck] = await Promise.all([
      measureProbe(this.postgresProbe),
      measureProbe(this.objectStorageProbe),
      measureProbe(this.redisProbe),
    ]);

    let overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (postgresCheck.status === 'DOWN') {
      overallHealth = 'CRITICAL';
    } else if (
      postgresCheck.status === 'DEGRADED' ||
      objectStorageCheck.status === 'DOWN' ||
      objectStorageCheck.status === 'DEGRADED' ||
      redisCheck.status === 'DOWN' ||
      redisCheck.status === 'DEGRADED'
    ) {
      overallHealth = 'DEGRADED';
    }

    const mem = process.memoryUsage();
    const memoryHeapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
    const memoryHeapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100;
    const memoryRssMb = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
    const uptimeSeconds = Math.floor(process.uptime());
    const nodeVersion = process.version;

    const projectUrl =
      process.env.RAILWAY_PROJECT_URL ??
      'https://railway.com/project/03668a5d-38e9-42c7-9fe2-c88d7a70b8cf';
    const metricsUrl =
      process.env.RAILWAY_METRICS_URL ??
      'https://railway.com/project/03668a5d-38e9-42c7-9fe2-c88d7a70b8cf/service/703b71b6-9614-402e-8148-782ab6b7a224/metrics';
    const logsUrl =
      process.env.RAILWAY_LOGS_URL ??
      'https://railway.com/project/03668a5d-38e9-42c7-9fe2-c88d7a70b8cf/service/703b71b6-9614-402e-8148-782ab6b7a224';

    const statusData = {
      service: 'aletheia-api' as const,
      version: process.env.npm_package_version ?? '0.1.0',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      overallHealth,
      dependencies: {
        postgres: postgresCheck,
        objectStorage: objectStorageCheck,
        redis: redisCheck,
      },
      resources: {
        memoryHeapUsedMb,
        memoryHeapTotalMb,
        memoryRssMb,
        nodeVersion,
      },
      railwayDashboardLinks: {
        projectUrl,
        metricsUrl,
        logsUrl,
      },
    };

    return OperationalStatusResponseSchema.parse(statusData);
  }

  async listAlerts(options?: {
    limit?: number | undefined;
    acknowledged?: boolean | undefined;
  }): Promise<OperationalAlertEventDto[]> {
    const where: Prisma.OperationalAlertEventWhereInput = {};
    if (options?.acknowledged === true) {
      where.acknowledgedAt = { not: null };
    } else if (options?.acknowledged === false) {
      where.acknowledgedAt = null;
    }

    const alerts = await this.prisma.operationalAlertEvent.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: options?.limit ?? 50,
    });

    return alerts.map((alert) => this.mapAlert(alert));
  }

  async acknowledgeAlert(
    id: string,
    userId: string,
    notes?: string | undefined,
  ): Promise<OperationalAlertEventDto> {
    const existing = await this.prisma.operationalAlertEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Operational alert event with id "${id}" not found.`);
    }

    const existingPayload =
      typeof existing.payload === 'object' && existing.payload !== null && !Array.isArray(existing.payload)
        ? (existing.payload as Record<string, unknown>)
        : {};

    const updatedPayload: Record<string, unknown> = {
      ...existingPayload,
      ...(notes ? { acknowledgmentNotes: notes } : {}),
    };

    const updated = await this.prisma.operationalAlertEvent.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        payload: updatedPayload as Prisma.InputJsonValue,
      },
    });

    return this.mapAlert(updated);
  }

  async handleRailwayWebhook(
    payload: RailwayWebhookPayloadDto,
  ): Promise<{ received: boolean; alertId: string }> {
    const eventType = payload.type || 'UNKNOWN';
    const serviceName = payload.service?.name ?? null;

    let severity: 'INFO' | 'WARNING' | 'CRITICAL' = payload.severity ?? 'WARNING';
    if (!payload.severity) {
      const textToCheck = `${payload.type} ${payload.deployment?.status ?? ''}`.toLowerCase();
      if (
        textToCheck.includes('crash') ||
        textToCheck.includes('fail') ||
        textToCheck.includes('error')
      ) {
        severity = 'CRITICAL';
      } else if (
        textToCheck.includes('success') ||
        textToCheck.includes('ok') ||
        textToCheck.includes('healthy')
      ) {
        severity = 'INFO';
      } else {
        severity = 'WARNING';
      }
    }

    const message =
      payload.message ||
      payload.text ||
      (payload.deployment?.status
        ? `Deployment status: ${payload.deployment.status}`
        : `Railway event: ${eventType}${serviceName ? ` on ${serviceName}` : ''}`);

    const alert = await this.prisma.operationalAlertEvent.create({
      data: {
        source: 'RAILWAY',
        eventType,
        severity,
        serviceName,
        message,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return { received: true, alertId: alert.id };
  }

  private mapAlert(alert: {
    id: string;
    source: string;
    eventType: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    serviceName: string | null;
    message: string;
    payload: unknown;
    receivedAt: Date;
    acknowledgedAt: Date | null;
    acknowledgedBy: string | null;
  }): OperationalAlertEventDto {
    const payloadRecord =
      typeof alert.payload === 'object' && alert.payload !== null && !Array.isArray(alert.payload)
        ? (alert.payload as Record<string, unknown>)
        : {};

    return {
      id: alert.id,
      source: alert.source,
      eventType: alert.eventType,
      severity: alert.severity,
      serviceName: alert.serviceName,
      message: alert.message,
      payload: payloadRecord,
      receivedAt: alert.receivedAt.toISOString(),
      acknowledgedAt: alert.acknowledgedAt ? alert.acknowledgedAt.toISOString() : null,
      acknowledgedBy: alert.acknowledgedBy,
    };
  }
}
