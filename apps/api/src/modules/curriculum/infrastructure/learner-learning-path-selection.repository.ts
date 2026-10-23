import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

const pathSelectionInclude = {
  path: { select: { code: true, name: true, version: true, status: true } },
} satisfies Prisma.LearnerLearningPathSelectionInclude;

export type LearnerLearningPathSelectionWithPath = Prisma.LearnerLearningPathSelectionGetPayload<{
  include: typeof pathSelectionInclude;
}>;

const pathCatalogInclude = {
  competencies: {
    where: { status: 'PUBLISHED' },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
    select: { code: true, title: true, level: true, metadata: true },
  },
  learnerSelections: { select: { enabled: true } },
} satisfies Prisma.LearningPathInclude;

export type PublishedLearningPathCatalogRow = Prisma.LearningPathGetPayload<{
  include: typeof pathCatalogInclude;
}>;

@Injectable()
export class LearnerLearningPathSelectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(
    familyId: string,
    learnerId: string,
    academicYearId: string,
  ): Promise<PublishedLearningPathCatalogRow[] | null> {
    const contextIsOwned = await this.ownsContext(familyId, learnerId, academicYearId);
    if (!contextIsOwned) return null;

    const rows = await this.prisma.learningPath.findMany({
      where: {
        status: 'PUBLISHED',
        domain: { is: { code: 'CLASSICAL_EDUCATION', status: 'PUBLISHED', isActive: true } },
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
      include: {
        ...pathCatalogInclude,
        learnerSelections: {
          where: { familyId, learnerId, academicYearId },
          select: { enabled: true },
        },
      },
    });

    const latestByCode = new Map<string, PublishedLearningPathCatalogRow>();
    for (const row of rows) {
      if (!latestByCode.has(row.code)) latestByCode.set(row.code, row);
    }
    return [...latestByCode.values()];
  }

  async upsert(
    familyId: string,
    learnerId: string,
    academicYearId: string,
    pathId: string,
    enabled: boolean,
  ): Promise<LearnerLearningPathSelectionWithPath | null> {
    const contextIsOwned = await this.ownsContext(familyId, learnerId, academicYearId);
    if (!contextIsOwned) return null;

    const publishedPath = await this.prisma.learningPath.findFirst({
      where: { id: pathId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!publishedPath) return null;

    return this.prisma.learnerLearningPathSelection.upsert({
      where: { familyId_learnerId_academicYearId_pathId: { familyId, learnerId, academicYearId, pathId } },
      create: { familyId, learnerId, academicYearId, pathId, enabled },
      update: { enabled },
      include: pathSelectionInclude,
    });
  }

  private async ownsContext(familyId: string, learnerId: string, academicYearId: string): Promise<boolean> {
    const [learner, academicYear] = await Promise.all([
      this.prisma.learner.findFirst({ where: { id: learnerId, familyId }, select: { id: true } }),
      this.prisma.academicYear.findFirst({ where: { id: academicYearId, familyId }, select: { id: true } }),
    ]);
    return learner !== null && academicYear !== null;
  }
}
