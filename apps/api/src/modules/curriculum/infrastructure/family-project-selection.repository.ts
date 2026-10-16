import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

const projectCompetencySelect = {
  where: { competency: { status: 'PUBLISHED' } },
  orderBy: [{ order: 'asc' }, { competencyId: 'asc' }],
  select: {
    competencyId: true,
    required: true,
    order: true,
    competency: { select: { code: true, title: true } },
  },
} satisfies Prisma.ProjectDefinitionCompetencyFindManyArgs;

const projectSelectionInclude = {
  project: {
    select: {
      code: true,
      name: true,
      version: true,
      status: true,
      description: true,
      competencies: projectCompetencySelect,
    },
  },
} satisfies Prisma.FamilyProjectSelectionInclude;

export type FamilyProjectSelectionWithProject = Prisma.FamilyProjectSelectionGetPayload<{
  include: typeof projectSelectionInclude;
}>;

const projectCatalogInclude = {
  competencies: projectCompetencySelect,
  familySelections: { select: { enabled: true } },
} satisfies Prisma.ProjectDefinitionInclude;

export type PublishedFamilyProjectCatalogRow = Prisma.ProjectDefinitionGetPayload<{
  include: typeof projectCatalogInclude;
}>;

@Injectable()
export class FamilyProjectSelectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    familyId: string,
    projectId: string,
    enabled: boolean,
  ): Promise<FamilyProjectSelectionWithProject | null> {
    const publishedProject = await this.prisma.projectDefinition.findFirst({
      where: { id: projectId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!publishedProject) return null;

    return this.prisma.familyProjectSelection.upsert({
      where: { familyId_projectId: { familyId, projectId } },
      create: { familyId, projectId, enabled },
      update: { enabled },
      include: projectSelectionInclude,
    });
  }

  listByFamily(familyId: string): Promise<FamilyProjectSelectionWithProject[]> {
    return this.prisma.familyProjectSelection.findMany({
      where: { familyId },
      orderBy: [{ enabled: 'desc' }, { createdAt: 'asc' }],
      include: projectSelectionInclude,
    });
  }

  listPublishedCatalog(familyId: string): Promise<PublishedFamilyProjectCatalogRow[]> {
    return this.prisma.projectDefinition.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
      include: {
        ...projectCatalogInclude,
        familySelections: { where: { familyId }, select: { enabled: true } },
      },
    });
  }
}
