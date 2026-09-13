import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { ProgressionReader } from '../application/progression.service.js';

@Injectable()
export class ProgressionRepository {
  constructor(private readonly prisma: PrismaService) {}

  snapshot<T>(evaluate: (reader: ProgressionReader) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => evaluate({
      learnerExists: async (familyId, id) => !!await tx.learner.findFirst({ where: { id, familyId }, select: { id: true } }),
      tracking: (familyId, id) => tx.learnerCompetencyTracking.findFirst({ where: { id, familyId, learner: { familyId } } }),
      trackingForCompetency: (familyId, learnerId, competencyDefinitionId) => tx.learnerCompetencyTracking.findFirst({
        where: { familyId, learnerId, competencyDefinitionId, learner: { familyId } }, orderBy: { competencyVersion: 'desc' },
      }),
      competency: (id) => tx.competencyDefinition.findUnique({ where: { id } }),
      policy: (id) => tx.progressionPolicy.findUnique({ where: { id } }),
      curriculumContains: async (curriculumDefinitionId, competencyId) => !!await tx.curriculumDefinitionCompetency.findFirst({
        where: { curriculumDefinitionId, competencyId, curriculumDefinition: { status: { in: ['PUBLISHED', 'DEPRECATED', 'ARCHIVED'] }, schemaVersion: '1.0.0' } }, select: { id: true },
      }),
      evidenceCount: (familyId, learnerId, competencyDefinitionId, competencyVersion) => tx.evidenceSubmission.count({
        where: { familyId, learnerId, validationStatus: 'VALIDATED', competencies: { some: { competencyDefinitionId, competencyVersion } } },
      }),
    }), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 15_000 });
  }
}
