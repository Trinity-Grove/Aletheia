import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

const pathSelectionInclude = {
  path: { select: { code: true, name: true, version: true, status: true } },
} satisfies Prisma.FamilyLearningPathSelectionInclude;

export type FamilyLearningPathSelectionWithPath = Prisma.FamilyLearningPathSelectionGetPayload<{
  include: typeof pathSelectionInclude;
}>;

@Injectable()
export class FamilyLearningPathSelectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    familyId: string,
    pathId: string,
    enabled: boolean,
  ): Promise<FamilyLearningPathSelectionWithPath | null> {
    const publishedPath = await this.prisma.learningPath.findFirst({
      where: { id: pathId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!publishedPath) return null;

    return this.prisma.familyLearningPathSelection.upsert({
      where: { familyId_pathId: { familyId, pathId } },
      create: { familyId, pathId, enabled },
      update: { enabled },
      include: pathSelectionInclude,
    });
  }

  listByFamily(familyId: string): Promise<FamilyLearningPathSelectionWithPath[]> {
    return this.prisma.familyLearningPathSelection.findMany({
      where: { familyId },
      orderBy: [{ enabled: 'desc' }, { createdAt: 'asc' }],
      include: pathSelectionInclude,
    });
  }
}
