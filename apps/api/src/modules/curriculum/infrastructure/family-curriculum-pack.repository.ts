import { Injectable } from '@nestjs/common';
import type { FamilyCurriculumPack, FamilyCurriculumPackRevision, Prisma } from '@prisma/client';
import type { CurriculumPackExportDocument } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class FamilyCurriculumPackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInstance(
    familyId: string,
    sourcePackId: string,
    sourcePackCode: string,
    sourcePackVersion: number,
    document: CurriculumPackExportDocument,
  ): Promise<FamilyCurriculumPack> {
    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.familyCurriculumPack.create({
        data: {
          familyId,
          sourcePackId,
          sourcePackCode,
          sourcePackVersion,
          revision: 1,
          document: document as Prisma.InputJsonValue,
        },
      });

      await tx.familyCurriculumPackRevision.create({
        data: {
          familyCurriculumPackId: instance.id,
          revision: 1,
          document: document as Prisma.InputJsonValue,
        },
      });

      return instance;
    });
  }

  listByFamily(familyId: string): Promise<FamilyCurriculumPack[]> {
    return this.prisma.familyCurriculumPack.findMany({
      where: { familyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findByIdAndFamily(id: string, familyId: string): Promise<FamilyCurriculumPack | null> {
    return this.prisma.familyCurriculumPack.findFirst({ where: { id, familyId } });
  }

  async updateDocument(
    id: string,
    familyId: string,
    document: CurriculumPackExportDocument,
  ): Promise<FamilyCurriculumPack | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.familyCurriculumPack.findFirst({ where: { id, familyId } });
      if (!current) return null;

      const revision = current.revision + 1;
      const updated = await tx.familyCurriculumPack.update({
        where: { id: current.id },
        data: {
          revision,
          document: document as Prisma.InputJsonValue,
        },
      });

      await tx.familyCurriculumPackRevision.create({
        data: {
          familyCurriculumPackId: current.id,
          revision,
          document: document as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  listRevisions(familyCurriculumPackId: string): Promise<FamilyCurriculumPackRevision[]> {
    return this.prisma.familyCurriculumPackRevision.findMany({
      where: { familyCurriculumPackId },
      orderBy: { revision: 'asc' },
    });
  }
}
