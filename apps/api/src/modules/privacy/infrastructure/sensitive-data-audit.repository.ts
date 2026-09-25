import { Injectable } from '@nestjs/common';
import { Prisma, type SensitiveDataAction, type SensitiveDataResourceType } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface SensitiveDataAccessLogEntry {
  actorUserId: string;
  familyId: string;
  learnerId?: string | null;
  action: SensitiveDataAction;
  resourceType: SensitiveDataResourceType;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SensitiveDataAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: SensitiveDataAccessLogEntry): Promise<void> {
    await this.prisma.sensitiveDataAccessLog.create({
      data: {
        actorUserId: entry.actorUserId,
        familyId: entry.familyId,
        learnerId: entry.learnerId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        ...(entry.metadata ? { metadata: entry.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  }
}
