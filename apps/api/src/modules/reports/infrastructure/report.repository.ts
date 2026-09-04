import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { OfficialReportEntity } from '../domain/official-report.entity.js';
import type { GenerateReportDto, ReportType } from '@aletheia/contracts';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    familyId: string,
    dto: GenerateReportDto,
    content: Record<string, any>,
    generatedByUserId: string | null,
  ): Promise<OfficialReportEntity> {
    const created = await this.prisma.officialReport.create({
      data: {
        familyId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId ?? null,
        generatedByUserId,
        type: dto.type,
        title: dto.title,
        gradingScale: dto.gradingScale ?? 'MASTERY_QUALITATIVE',
        content,
        generatedAt: new Date(),
      },
      include: {
        learner: true,
        academicYear: true,
      },
    });

    return this.mapOfficialReport(created);
  }

  async findById(familyId: string, id: string): Promise<OfficialReportEntity | null> {
    const row = await this.prisma.officialReport.findFirst({
      where: { id, familyId },
      include: {
        learner: true,
        academicYear: true,
      },
    });

    return row ? this.mapOfficialReport(row) : null;
  }

  async list(
    familyId: string,
    filter: { learnerId?: string; academicYearId?: string; type?: ReportType } = {},
  ): Promise<OfficialReportEntity[]> {
    const where: Record<string, unknown> = { familyId };
    if (filter.learnerId) {
      where.learnerId = filter.learnerId;
    }
    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }
    if (filter.type) {
      where.type = filter.type;
    }

    const rows = await this.prisma.officialReport.findMany({
      where,
      include: {
        learner: true,
        academicYear: true,
      },
      orderBy: [{ generatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => this.mapOfficialReport(r));
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.officialReport.delete({ where: { id } });
    return true;
  }

  private mapOfficialReport(row: any): OfficialReportEntity {
    const learnerName = row.learner
      ? row.learner.preferredName ||
        `${row.learner.firstName}${row.learner.lastName ? ' ' + row.learner.lastName : ''}`
      : undefined;

    const academicYearTitle = row.academicYear ? row.academicYear.title : undefined;

    return new OfficialReportEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.academicYearId ?? null,
      row.type,
      row.title,
      row.gradingScale,
      row.content as Record<string, any>,
      row.generatedAt,
      row.createdAt,
      row.updatedAt,
      learnerName,
      academicYearTitle,
      row.generatedByUserId ?? null,
    );
  }
}
