import { Injectable } from '@nestjs/common';
import type { AccountAuditEventType } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface AccountAuditLogRecord {
  id: string;
  eventType: AccountAuditEventType;
  createdAt: Date;
}

const AUDIT_LOG_LIST_LIMIT = 50;

@Injectable()
export class AccountAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, eventType: AccountAuditEventType): Promise<void> {
    await this.prisma.accountAuditLogEntry.create({
      data: { userId, eventType },
    });
  }

  async listForUser(userId: string): Promise<AccountAuditLogRecord[]> {
    const entries = await this.prisma.accountAuditLogEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: AUDIT_LOG_LIST_LIMIT,
    });

    return entries.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType as AccountAuditEventType,
      createdAt: entry.createdAt,
    }));
  }
}
