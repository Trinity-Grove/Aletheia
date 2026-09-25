import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurriculumPackReport } from '@prisma/client';
import type {
  CreatePackReportDto,
  PackReportReason,
  PackReportResponseDto,
  PackReportStatus,
} from '@aletheia/contracts';
import { CurriculumPackReportRepository } from '../infrastructure/curriculum-pack-report.repository.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';

function toPackReportResponseDto(report: CurriculumPackReport): PackReportResponseDto {
  return {
    id: report.id,
    packId: report.packId,
    reporterUserId: report.reporterUserId,
    reporterFamilyId: report.reporterFamilyId,
    reason: report.reason as PackReportReason,
    details: report.details,
    status: report.status as PackReportStatus,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt ? report.resolvedAt.toISOString() : null,
    resolvedByUserId: report.resolvedByUserId,
  };
}

@Injectable()
export class CurriculumPackReportService {
  constructor(
    private readonly reportRepository: CurriculumPackReportRepository,
    private readonly packRepository: CurriculumPackRepository,
  ) {}

  async createReport(
    packId: string,
    userId: string,
    familyId: string,
    dto: CreatePackReportDto,
  ): Promise<PackReportResponseDto> {
    const pack = await this.packRepository.findPackById(packId);
    if (!pack) {
      throw new NotFoundException('Curriculum pack not found.');
    }

    const existingReport = await this.reportRepository.findReportByPackAndFamily(
      packId,
      familyId,
    );
    if (existingReport) {
      throw new ConflictException(
        'Your family has already submitted a report for this pack.',
      );
    }

    const report = await this.reportRepository.createReport({
      packId,
      reporterUserId: userId,
      reporterFamilyId: familyId,
      reason: dto.reason,
      details: dto.details ?? null,
    });

    const openDistinctReports = await this.reportRepository.countOpenDistinctReports(packId);
    if (openDistinctReports >= 3) {
      await this.packRepository.updateModeration(packId, {
        moderationStatus: 'SUSPENDED',
        moderationNotes:
          'Suspenso preventivamente por acúmulo de 3 ou mais denúncias de famílias distintas.',
        moderatedAt: new Date(),
      });
    }

    return toPackReportResponseDto(report);
  }

  async listReportsByPack(packId: string): Promise<PackReportResponseDto[]> {
    const pack = await this.packRepository.findPackById(packId);
    if (!pack) {
      throw new NotFoundException('Curriculum pack not found.');
    }

    const reports = await this.reportRepository.listReportsByPack(packId);
    return reports.map(toPackReportResponseDto);
  }
}
