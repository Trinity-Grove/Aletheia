import { Injectable } from '@nestjs/common';
import { Prisma, type FamilyLearningResource } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface CreateFamilyLearningResourceData {
  familyId: string;
  resourceType: 'MATERIAL' | 'LESSON_PLAN' | 'CHRONOGRAM';
  title: string;
  description: string | null;
  subject: string | null;
  ageMin: number | null;
  ageMax: number | null;
  content: Prisma.InputJsonValue;
  visibility: 'PRIVATE' | 'PUBLIC';
  originResourceId?: string | null;
}

export type UpdateFamilyLearningResourceData = Partial<Omit<CreateFamilyLearningResourceData, 'familyId'>>;

@Injectable()
export class FamilyLearningResourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFamilyLearningResourceData): Promise<FamilyLearningResource> {
    return this.prisma.familyLearningResource.create({ data });
  }

  listByFamily(familyId: string): Promise<FamilyLearningResource[]> {
    return this.prisma.familyLearningResource.findMany({
      where: { familyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  listPublic(): Promise<FamilyLearningResource[]> {
    return this.prisma.familyLearningResource.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  findByIdAndFamily(id: string, familyId: string): Promise<FamilyLearningResource | null> {
    return this.prisma.familyLearningResource.findFirst({ where: { id, familyId } });
  }

  async update(
    id: string,
    familyId: string,
    data: UpdateFamilyLearningResourceData,
  ): Promise<FamilyLearningResource | null> {
    const current = await this.findByIdAndFamily(id, familyId);
    if (!current) return null;

    return this.prisma.familyLearningResource.update({
      where: { id: current.id },
      data,
    });
  }

  async delete(id: string, familyId: string): Promise<boolean> {
    const current = await this.findByIdAndFamily(id, familyId);
    if (!current) return false;

    await this.prisma.familyLearningResource.delete({ where: { id: current.id } });
    return true;
  }

  async adoptPublic(sourceResourceId: string, familyId: string): Promise<FamilyLearningResource | null> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.familyLearningResource.findFirst({
        where: { id: sourceResourceId, visibility: 'PUBLIC' },
      });
      if (!source) return null;

      return tx.familyLearningResource.create({
        data: {
          familyId,
          resourceType: source.resourceType,
          title: source.title,
          description: source.description,
          subject: source.subject,
          ageMin: source.ageMin,
          ageMax: source.ageMax,
          content: source.content as Prisma.InputJsonValue,
          visibility: 'PRIVATE',
          originResourceId: source.id,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
