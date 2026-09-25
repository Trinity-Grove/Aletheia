import { Injectable } from '@nestjs/common';
import type { FamilyActivity, Prisma } from '@prisma/client';
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
