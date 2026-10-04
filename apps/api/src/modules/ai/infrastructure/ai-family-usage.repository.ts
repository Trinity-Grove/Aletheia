import { Injectable } from '@nestjs/common';
import type { AiFamilyUsage } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class AiFamilyUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(familyId: string, period: string): Promise<AiFamilyUsage> {
    return this.prisma.aiFamilyUsage.upsert({
      where: {
        familyId_period: {
          familyId,
          period,
        },
      },
      update: {},
      create: {
        familyId,
        period,
      },
    });
  }

  async incrementUsage(
    familyId: string,
    period: string,
    tokens: number,
    requests = 1,
  ): Promise<AiFamilyUsage> {
    return this.prisma.aiFamilyUsage.upsert({
      where: {
        familyId_period: {
          familyId,
          period,
        },
      },
      update: {
        tokensUsed: { increment: tokens },
        requestsUsed: { increment: requests },
      },
      create: {
        familyId,
        period,
        tokensUsed: tokens,
        requestsUsed: requests,
      },
    });
  }
}
