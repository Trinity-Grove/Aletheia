import { Injectable } from '@nestjs/common';
import type { EvidenceSubmission, EvidenceSubmissionCompetency, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export type EvidenceSubmissionWithCompetencies = EvidenceSubmission & {
  competencies: EvidenceSubmissionCompetency[];
};

export interface CreateEvidenceSubmissionInput {
  familyId: string;
  learnerId: string;
  evidenceTypeId: string;
  projectDefinitionId?: string | null | undefined;
  authorId: string;
  textContent?: string | null | undefined;
  fileUrl?: string | null | undefined;
  storageKey?: string | null | undefined;
  mimeType?: string | null | undefined;
  fileSizeBytes?: number | null | undefined;
  checksumSha256?: string | null | undefined;
  competencies: { competencyDefinitionId: string; competencyVersion: number }[];
}

// Thin persistence for EvidenceSubmission (issue #96 Fase 2, section 9).
// The multi-competency join and the submission row are created in one
// transaction so a submission is never left without its competency
// links. `findLearnerById`/`findCompetencyDefinitionsByIds` exist here
// (rather than reaching into the learners/curriculum-definitions
// modules) because they're simple, family-tenant-scoped Prisma reads
// against the shared PrismaService, the same way PortfolioRepository
// (records module) directly reads/writes Learner-scoped rows.
@Injectable()
export class EvidenceSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLearnerFamilyId(learnerId: string): Promise<string | null> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { familyId: true },
    });
    return learner?.familyId ?? null;
  }

  async findCompetencyDefinitionVersionsByIds(
    ids: string[],
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.competencyDefinition.findMany({
      where: { id: { in: ids } },
      select: { id: true, version: true },
    });
    return new Map(rows.map((row) => [row.id, row.version]));
  }

  async projectDefinitionExists(id: string): Promise<boolean> {
    const row = await this.prisma.projectDefinition.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }

  async create(input: CreateEvidenceSubmissionInput): Promise<EvidenceSubmissionWithCompetencies> {
    return this.prisma.evidenceSubmission.create({
      data: {
        familyId: input.familyId,
        learnerId: input.learnerId,
        evidenceTypeId: input.evidenceTypeId,
        projectDefinitionId: input.projectDefinitionId ?? null,
        authorId: input.authorId,
        textContent: input.textContent ?? null,
        fileUrl: input.fileUrl ?? null,
        storageKey: input.storageKey ?? null,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        checksumSha256: input.checksumSha256 ?? null,
        competencies: {
          create: input.competencies.map((c) => ({
            competencyDefinitionId: c.competencyDefinitionId,
            competencyVersion: c.competencyVersion,
          })),
        },
      },
      include: { competencies: true },
    });
  }

  findById(familyId: string, id: string): Promise<EvidenceSubmissionWithCompetencies | null> {
    return this.prisma.evidenceSubmission.findFirst({
      where: { id, familyId },
      include: { competencies: true },
    });
  }

  list(familyId: string, learnerId?: string): Promise<EvidenceSubmissionWithCompetencies[]> {
    const where: Prisma.EvidenceSubmissionWhereInput = { familyId };
    if (learnerId) where.learnerId = learnerId;
    return this.prisma.evidenceSubmission.findMany({
      where,
      include: { competencies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateValidationStatus(
    id: string,
    status: 'VALIDATED' | 'REJECTED',
    validatedByUserId: string,
  ): Promise<EvidenceSubmissionWithCompetencies> {
    return this.prisma.evidenceSubmission.update({
      where: { id },
      data: { validationStatus: status, validatedByUserId, validatedAt: new Date() },
      include: { competencies: true },
    });
  }
}
