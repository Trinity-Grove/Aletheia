import { Injectable } from '@nestjs/common';
import type { LearnerCompetencyTracking, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export type LearnerCompetencyTrackingWithCompetency = LearnerCompetencyTracking & {
  competencyDefinition: {
    code: string;
    title: string;
    domainId: string;
    domain: { name: string };
  };
};

export interface CurriculumCompetencyToActivate {
  competencyDefinitionId: string;
  competencyVersion: number;
}

// Thin persistence for LearnerCompetencyTracking (issue #126 item 3) --
// same pattern as EvidenceSubmissionRepository/AssessmentResultRepository:
// simple, family-tenant-scoped Prisma reads/writes against the shared
// PrismaService, with the competency's title/domain name joined at read
// time for display (safe because CompetencyDefinition rows are immutable
// once created under the Definition/Version pattern).
@Injectable()
export class LearnerCompetencyTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLearnerFamilyId(learnerId: string): Promise<string | null> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { familyId: true },
    });
    return learner?.familyId ?? null;
  }

  async findCurriculumDefinitionCompetencies(
    curriculumDefinitionId: string,
  ): Promise<CurriculumCompetencyToActivate[] | null> {
    const curriculum = await this.prisma.curriculumDefinition.findUnique({
      where: { id: curriculumDefinitionId },
      select: {
        id: true,
        competencies: {
          select: { competency: { select: { id: true, version: true } } },
        },
      },
    });
    if (!curriculum) return null;
    return curriculum.competencies.map((link) => ({
      competencyDefinitionId: link.competency.id,
      competencyVersion: link.competency.version,
    }));
  }

  async findExistingTrackingKeys(
    learnerId: string,
    competencyDefinitionIds: string[],
  ): Promise<Set<string>> {
    const rows = await this.prisma.learnerCompetencyTracking.findMany({
      where: { learnerId, competencyDefinitionId: { in: competencyDefinitionIds } },
      select: { competencyDefinitionId: true, competencyVersion: true },
    });
    return new Set(rows.map((r) => `${r.competencyDefinitionId}:${r.competencyVersion}`));
  }

  async createMany(
    familyId: string,
    learnerId: string,
    curriculumDefinitionId: string | null,
    competencies: CurriculumCompetencyToActivate[],
  ): Promise<void> {
    if (competencies.length === 0) return;
    await this.prisma.learnerCompetencyTracking.createMany({
      data: competencies.map((c) => ({
        familyId,
        learnerId,
        competencyDefinitionId: c.competencyDefinitionId,
        competencyVersion: c.competencyVersion,
        curriculumDefinitionId,
      })),
      skipDuplicates: true,
    });
  }

  findByLearnerAndCompetencies(
    learnerId: string,
    competencyDefinitionIds: string[],
  ): Promise<LearnerCompetencyTrackingWithCompetency[]> {
    return this.prisma.learnerCompetencyTracking.findMany({
      where: { learnerId, competencyDefinitionId: { in: competencyDefinitionIds } },
      include: { competencyDefinition: { include: { domain: true } } },
    }) as unknown as Promise<LearnerCompetencyTrackingWithCompetency[]>;
  }

  list(
    familyId: string,
    learnerId?: string,
    status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingWithCompetency[]> {
    const where: Prisma.LearnerCompetencyTrackingWhereInput = { familyId };
    if (learnerId) where.learnerId = learnerId;
    if (status) where.status = status;
    return this.prisma.learnerCompetencyTracking.findMany({
      where,
      include: { competencyDefinition: { include: { domain: true } } },
      orderBy: { activatedAt: 'desc' },
    }) as unknown as Promise<LearnerCompetencyTrackingWithCompetency[]>;
  }

  findById(familyId: string, id: string): Promise<LearnerCompetencyTrackingWithCompetency | null> {
    return this.prisma.learnerCompetencyTracking.findFirst({
      where: { id, familyId },
      include: { competencyDefinition: { include: { domain: true } } },
    }) as unknown as Promise<LearnerCompetencyTrackingWithCompetency | null>;
  }

  retire(id: string): Promise<LearnerCompetencyTrackingWithCompetency> {
    return this.prisma.learnerCompetencyTracking.update({
      where: { id },
      data: { status: 'RETIRED', retiredAt: new Date() },
      include: { competencyDefinition: { include: { domain: true } } },
    }) as unknown as Promise<LearnerCompetencyTrackingWithCompetency>;
  }
}
