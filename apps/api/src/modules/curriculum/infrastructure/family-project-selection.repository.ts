import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

const projectSelectionInclude = {
  project: { select: { code: true, name: true, version: true, status: true } },
} satisfies Prisma.FamilyProjectSelectionInclude;

export type FamilyProjectSelectionWithProject = Prisma.FamilyProjectSelectionGetPayload<{
  include: typeof projectSelectionInclude;
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
}
