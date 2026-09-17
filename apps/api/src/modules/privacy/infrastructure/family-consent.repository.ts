import { Injectable } from '@nestjs/common';
import type { ConsentAction, ConsentRecord } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface CreateConsentRecordData {
  familyId: string;
  userId: string;
  consentDefinitionId: string;
  learnerId?: string | null;
  action: ConsentAction;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class FamilyConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRecord(data: CreateConsentRecordData): Promise<ConsentRecord> {
    return this.prisma.consentRecord.create({
      data: {
        familyId: data.familyId,
        consentedByUserId: data.userId,
        consentDefinitionId: data.consentDefinitionId,
        learnerId: data.learnerId ?? null,
        action: data.action,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  findLatestRecord(
    familyId: string,
    consentDefinitionId: string,
    learnerId?: string | null,
  ): Promise<ConsentRecord | null> {
    return this.prisma.consentRecord.findFirst({
      where: {
        familyId,
        consentDefinitionId,
        learnerId: learnerId ?? null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllRecordsForFamily(familyId: string): Promise<ConsentRecord[]> {
    return this.prisma.consentRecord.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findFamilyLearners(familyId: string): Promise<{ id: string; firstName: string; lastName: string | null }[]> {
    return this.prisma.learner.findMany({
      where: { familyId, archivedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    });
  }

  findLearnerById(
    learnerId: string,
  ): Promise<{ id: string; familyId: string; firstName: string; lastName: string | null } | null> {
    return this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { id: true, familyId: true, firstName: true, lastName: true },
    });
  }
}
