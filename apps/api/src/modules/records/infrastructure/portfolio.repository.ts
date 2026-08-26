import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { PortfolioItemEntity } from '../domain/portfolio-item.entity.js';
import type {
  CreatePortfolioItemDto,
  PortfolioItemFilterDto,
  UpdatePortfolioItemDto,
} from '@aletheia/contracts';

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreatePortfolioItemDto): Promise<PortfolioItemEntity> {
    const data: Parameters<typeof this.prisma.portfolioItem.create>[0]['data'] = {
      familyId,
      learnerId: dto.learnerId,
      learningRecordId: dto.learningRecordId ?? null,
      academicYearId: dto.academicYearId ?? null,
      subjectId: dto.subjectId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      type: dto.type,
      fileUrl: dto.fileUrl ?? null,
      textContent: dto.textContent ?? null,
      mimeType: dto.mimeType ?? null,
      fileSizeBytes: dto.fileSizeBytes ?? null,
      capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
      isHighlight: dto.isHighlight ?? false,
      tags: dto.tags ?? [],
    };

    const created = await this.prisma.portfolioItem.create({
      data,
      include: {
        learner: true,
        subject: true,
      },
    });

    return this.mapPortfolioItem(created);
  }

  async findById(familyId: string, id: string): Promise<PortfolioItemEntity | null> {
    const row = await this.prisma.portfolioItem.findFirst({
      where: { id, familyId },
      include: {
        learner: true,
        subject: true,
      },
    });

    return row ? this.mapPortfolioItem(row) : null;
  }

  async list(familyId: string, filter: PortfolioItemFilterDto = {}): Promise<PortfolioItemEntity[]> {
    const where: Record<string, unknown> = { familyId };

    if (filter.learnerId) {
      where.learnerId = filter.learnerId;
    }
    if (filter.learningRecordId) {
      where.learningRecordId = filter.learningRecordId;
    }
    if (filter.subjectId) {
      where.subjectId = filter.subjectId;
    }
    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.isHighlight !== undefined) {
      where.isHighlight = filter.isHighlight;
    }
    if (filter.tag) {
      where.tags = {
        has: filter.tag,
      };
    }

    const rows = await this.prisma.portfolioItem.findMany({
      where,
      include: {
        learner: true,
        subject: true,
      },
      orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => this.mapPortfolioItem(r));
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {};

    if (dto.learnerId !== undefined) data.learnerId = dto.learnerId;
    if (dto.learningRecordId !== undefined) data.learningRecordId = dto.learningRecordId ?? null;
    if (dto.academicYearId !== undefined) data.academicYearId = dto.academicYearId ?? null;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId ?? null;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl ?? null;
    if (dto.textContent !== undefined) data.textContent = dto.textContent ?? null;
    if (dto.mimeType !== undefined) data.mimeType = dto.mimeType ?? null;
    if (dto.fileSizeBytes !== undefined) data.fileSizeBytes = dto.fileSizeBytes ?? null;
    if (dto.capturedAt !== undefined)
      data.capturedAt = dto.capturedAt ? new Date(dto.capturedAt) : null;
    if (dto.isHighlight !== undefined) data.isHighlight = dto.isHighlight;
    if (dto.tags !== undefined) data.tags = dto.tags;

    const updated = await this.prisma.portfolioItem.update({
      where: { id },
      data,
      include: {
        learner: true,
        subject: true,
      },
    });

    return this.mapPortfolioItem(updated);
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.portfolioItem.delete({ where: { id } });
    return true;
  }

  private mapPortfolioItem(row: any): PortfolioItemEntity {
    const learnerName = row.learner
      ? row.learner.preferredName || `${row.learner.firstName}${row.learner.lastName ? ' ' + row.learner.lastName : ''}`
      : undefined;

    return new PortfolioItemEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.learningRecordId ?? null,
      row.academicYearId ?? null,
      row.subjectId ?? null,
      row.title,
      row.description ?? null,
      row.type,
      row.fileUrl ?? null,
      row.textContent ?? null,
      row.mimeType ?? null,
      row.fileSizeBytes ?? null,
      row.capturedAt ?? null,
      row.isHighlight ?? false,
      row.tags ?? [],
      row.createdAt,
      row.updatedAt,
      learnerName,
      row.subject?.name ?? null,
    );
  }
}
