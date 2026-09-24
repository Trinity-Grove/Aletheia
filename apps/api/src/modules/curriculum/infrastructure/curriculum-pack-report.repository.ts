import { Injectable } from '@nestjs/common';
import type { CurriculumPackReport } from '@prisma/client';
import type { PackReportReason, PackReportStatus } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class CurriculumPackReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  createReport(data: {
    packId: string;
    reporterUserId: string;
    reporterFamilyId: string;
    reason: PackReportReason;
    details?: string | null;
  }): Promise<CurriculumPackReport> {
    return this.prisma.curriculumPackReport.create({
      data: {
        packId: data.packId,
        reporterUserId: data.reporterUserId,
        reporterFamilyId: data.reporterFamilyId,
        reason: data.reason,
        details: data.details ?? null,
        status: 'OPEN',
      },
    });
  }

  findReportByPackAndFamily(
    packId: string,
    reporterFamilyId: string,
  ): Promise<CurriculumPackReport | null> {
    return this.prisma.curriculumPackReport.findUnique({
      where: {
        curriculum_pack_reports_pack_family_unique: {
          packId,
          reporterFamilyId,
        },
      },
    });
  }

  countOpenDistinctReports(packId: string): Promise<number> {
    return this.prisma.curriculumPackReport.count({
      where: {
        packId,
        status: 'OPEN',
      },
    });
  }

  listReportsByPack(packId: string): Promise<CurriculumPackReport[]> {
    return this.prisma.curriculumPackReport.findMany({
      where: { packId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listReports(filter?: { status?: PackReportStatus; packId?: string }): Promise<CurriculumPackReport[]> {
    return this.prisma.curriculumPackReport.findMany({
      where: {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.packId && { packId: filter.packId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateReportStatus(
    id: string,
    status: PackReportStatus,
    resolvedByUserId?: string | null,
    resolvedAt?: Date | null,
  ): Promise<CurriculumPackReport> {
    return this.prisma.curriculumPackReport.update({
      where: { id },
      data: {
        status,
        ...(resolvedByUserId !== undefined && { resolvedByUserId }),
        ...(resolvedAt !== undefined && { resolvedAt }),
      },
    });
  }
}
