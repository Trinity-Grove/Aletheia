import { Injectable, NotFoundException } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackReport, AuthorTrustProfile } from '@prisma/client';
import type {
  AdminModeratePackDto,
  AdminResolveReportDto,
  AuthorTrustProfileResponseDto,
  CurriculumPackModerationStatus,
  CurriculumPackResponseDto,
  DefinitionStatus,
  PackReportReason,
  PackReportResponseDto,
  PackReportStatus,
} from '@aletheia/contracts';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { CurriculumPackReportRepository } from '../infrastructure/curriculum-pack-report.repository.js';
import { AuthorTrustService } from './author-trust.service.js';

function toPackDto(row: CurriculumPack): CurriculumPackResponseDto {
  return {
    id: row.id,
    code: row.code,
    version: row.version,
    status: row.status as DefinitionStatus,
    schemaVersion: row.schemaVersion,
    name: row.name,
    description: row.description,
    metadata: row.metadata as Record<string, unknown>,
    authorUserId: row.authorUserId ?? null,
    moderationStatus: row.moderationStatus as CurriculumPackModerationStatus,
    moderationNotes: row.moderationNotes ?? null,
    moderatedAt: row.moderatedAt ? row.moderatedAt.toISOString() : null,
    moderatedByUserId: row.moderatedByUserId ?? null,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
  };
}

function toAuthorTrustProfileDto(profile: AuthorTrustProfile): AuthorTrustProfileResponseDto {
  return {
    userId: profile.userId,
    trustScore: profile.trustScore,
    tier: profile.tier,
    approvedPacksCount: profile.approvedPacksCount,
    rejectedPacksCount: profile.rejectedPacksCount,
    upheldReportsCount: profile.upheldReportsCount,
    lastEvaluatedAt: profile.lastEvaluatedAt.toISOString(),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toPackReportDto(report: CurriculumPackReport): PackReportResponseDto {
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

export interface ModerationQueueItem {
  pack: CurriculumPackResponseDto;
  authorTrustProfile: AuthorTrustProfileResponseDto | null;
  openReportsCount: number;
}

@Injectable()
export class CurriculumPackModerationService {
  constructor(
    private readonly packRepository: CurriculumPackRepository,
    private readonly reportRepository: CurriculumPackReportRepository,
    private readonly authorTrustService: AuthorTrustService,
  ) {}

  async getModerationQueue(): Promise<ModerationQueueItem[]> {
    const packs = await this.packRepository.listModerationQueue();

    return Promise.all(
      packs.map(async (pack) => {
        let authorTrustProfile: AuthorTrustProfileResponseDto | null = null;
        if (pack.authorUserId) {
          const profile = await this.authorTrustService.getOrCreateProfile(pack.authorUserId);
          authorTrustProfile = toAuthorTrustProfileDto(profile);
        }

        const openReportsCount = await this.reportRepository.countOpenDistinctReports(pack.id);

        return {
          pack: toPackDto(pack),
          authorTrustProfile,
          openReportsCount,
        };
      }),
    );
  }

  async moderatePack(
    packId: string,
    adminUserId: string,
    dto: AdminModeratePackDto,
  ): Promise<CurriculumPackResponseDto> {
    const existing = await this.packRepository.findPackById(packId);
    if (!existing) {
      throw new NotFoundException('Curriculum pack not found.');
    }

    const now = new Date();

    switch (dto.action) {
      case 'APPROVE': {
        const updated = await this.packRepository.updateModeration(packId, {
          moderationStatus: 'APPROVED',
          status: 'PUBLISHED',
          publishedAt: existing.publishedAt ?? now,
          moderatedAt: now,
          moderatedByUserId: adminUserId,
          moderationNotes: dto.notes ?? null,
        });

        if (existing.authorUserId) {
          await this.authorTrustService.onPackApproved(existing.authorUserId);
        }

        return toPackDto(updated);
      }

      case 'REJECT': {
        const updated = await this.packRepository.updateModeration(packId, {
          moderationStatus: 'REJECTED',
          moderatedAt: now,
          moderatedByUserId: adminUserId,
          moderationNotes: dto.notes ?? null,
        });

        if (existing.authorUserId) {
          await this.authorTrustService.onPackRejected(existing.authorUserId);
        }

        return toPackDto(updated);
      }

      case 'SUSPEND': {
        const updated = await this.packRepository.updateModeration(packId, {
          moderationStatus: 'SUSPENDED',
          moderatedAt: now,
          moderatedByUserId: adminUserId,
          moderationNotes: dto.notes ?? null,
        });

        return toPackDto(updated);
      }

      case 'RESTORE': {
        const updated = await this.packRepository.updateModeration(packId, {
          moderationStatus: 'APPROVED',
          status: 'PUBLISHED',
          publishedAt: existing.publishedAt ?? now,
          moderatedAt: now,
          moderatedByUserId: adminUserId,
          moderationNotes: dto.notes ?? null,
        });

        return toPackDto(updated);
      }
    }
  }

  async listReports(filter?: {
    status?: PackReportStatus;
    packId?: string;
  }): Promise<PackReportResponseDto[]> {
    const reports = await this.reportRepository.listReports(
      filter
        ? {
            ...(filter.status !== undefined && { status: filter.status }),
            ...(filter.packId !== undefined && { packId: filter.packId }),
          }
        : undefined,
    );
    return reports.map(toPackReportDto);
  }

  async resolveReport(
    reportId: string,
    adminUserId: string,
    dto: AdminResolveReportDto,
  ): Promise<PackReportResponseDto> {
    const report = await this.reportRepository.findReportById(reportId);
    if (!report) {
      throw new NotFoundException('Curriculum pack report not found.');
    }

    const now = new Date();

    if (dto.status === 'UPHELD') {
      const pack = await this.packRepository.findPackById(report.packId);
      if (pack?.authorUserId) {
        await this.authorTrustService.onReportUpheld(pack.authorUserId);
      }
    }

    const updated = await this.reportRepository.updateReportStatus(
      reportId,
      dto.status,
      adminUserId,
      now,
    );

    return toPackReportDto(updated);
  }
}
