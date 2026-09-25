import { z } from 'zod';

export const DependencyProbeStatusSchema = z.object({
  status: z.enum(['UP', 'DOWN', 'DEGRADED', 'NOT_CONFIGURED']),
  responseTimeMs: z.number().nonnegative(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type DependencyProbeStatusDto = z.infer<typeof DependencyProbeStatusSchema>;

export const OperationalStatusResponseSchema = z.object({
  service: z.literal('aletheia-api'),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  overallHealth: z.enum(['HEALTHY', 'DEGRADED', 'CRITICAL']),
  dependencies: z.object({
    postgres: DependencyProbeStatusSchema.extend({
      activeConnections: z.number().int().nonnegative().optional(),
    }),
    objectStorage: DependencyProbeStatusSchema,
    redis: DependencyProbeStatusSchema,
  }),
  resources: z.object({
    memoryHeapUsedMb: z.number().nonnegative(),
    memoryHeapTotalMb: z.number().nonnegative(),
    memoryRssMb: z.number().nonnegative(),
    nodeVersion: z.string(),
  }),
  railwayDashboardLinks: z.object({
    projectUrl: z.string().url().optional(),
    metricsUrl: z.string().url().optional(),
    logsUrl: z.string().url().optional(),
  }),
});

export type OperationalStatusResponseDto = z.infer<typeof OperationalStatusResponseSchema>;

export const OperationalAlertEventSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  eventType: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  serviceName: z.string().nullable(),
  message: z.string(),
  payload: z.record(z.string(), z.unknown()),
  receivedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedBy: z.string().uuid().nullable(),
});

export type OperationalAlertEventDto = z.infer<typeof OperationalAlertEventSchema>;

export const AcknowledgeAlertSchema = z.object({
  notes: z.string().optional(),
});

export type AcknowledgeAlertDto = z.infer<typeof AcknowledgeAlertSchema>;

export const RailwayWebhookPayloadSchema = z.object({
  type: z.string(),
  environment: z.string().optional(),
  project: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  service: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  deployment: z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  message: z.string().optional(),
  text: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
}).passthrough();

export type RailwayWebhookPayloadDto = z.infer<typeof RailwayWebhookPayloadSchema>;
