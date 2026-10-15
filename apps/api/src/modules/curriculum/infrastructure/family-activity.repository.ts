import { Injectable } from '@nestjs/common';
import { Prisma, type FamilyActivity } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface CreateFamilyActivityData {
  familyId: string;
  name: string;
  description: string | null;
  ageMin: number | null;
  ageMax: number | null;
  estimatedDurationMinutes: number | null;
  supervisionRequired: boolean;
  riskLevel: string | null;
  evidenceRequirementMode: string;
  metadata: Prisma.InputJsonValue;
  visibility: 'PRIVATE' | 'PUBLIC';
}

export type UpdateFamilyActivityData = CreateFamilyActivityData;

@Injectable()
export class FamilyActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFamilyActivityData): Promise<FamilyActivity> {
    return this.prisma.familyActivity.create({ data });
  }

  listByFamily(familyId: string): Promise<FamilyActivity[]> {
    return this.prisma.familyActivity.findMany({
      where: { familyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  listPublic(): Promise<FamilyActivity[]> {
    return this.prisma.familyActivity.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async adoptPublic(sourceActivityId: string, familyId: string): Promise<FamilyActivity | null> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.familyActivity.findFirst({
        where: { id: sourceActivityId, visibility: 'PUBLIC' },
      });
      if (!source) return null;

      const metadata = source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata)
        ? source.metadata as Record<string, unknown>
        : {};

      return tx.familyActivity.create({
        data: {
          familyId,
          name: source.name,
          description: source.description,
          ageMin: source.ageMin,
          ageMax: source.ageMax,
          estimatedDurationMinutes: source.estimatedDurationMinutes,
          supervisionRequired: source.supervisionRequired,
          riskLevel: source.riskLevel,
          evidenceRequirementMode: source.evidenceRequirementMode,
          metadata: { ...metadata, origin: { kind: 'COMMUNITY_ACTIVITY', sourceActivityId } } as Prisma.InputJsonValue,
          visibility: 'PRIVATE',
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  findByIdAndFamily(id: string, familyId: string): Promise<FamilyActivity | null> {
    return this.prisma.familyActivity.findFirst({ where: { id, familyId } });
  }

  async update(
    id: string,
    familyId: string,
    data: UpdateFamilyActivityData,
  ): Promise<FamilyActivity | null> {
    const current = await this.prisma.familyActivity.findFirst({ where: { id, familyId } });
    if (!current) return null;

    return this.prisma.familyActivity.update({ where: { id: current.id }, data });
  }

  async delete(id: string, familyId: string): Promise<boolean> {
    const current = await this.prisma.familyActivity.findFirst({ where: { id, familyId } });
    if (!current) return false;

    await this.prisma.familyActivity.delete({ where: { id: current.id } });
    return true;
  }
}
