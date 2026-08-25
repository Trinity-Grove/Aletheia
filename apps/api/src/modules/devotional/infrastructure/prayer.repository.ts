import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { PrayerRequestEntity } from '../domain/prayer-request.entity.js';
import type { CreatePrayerDto, PrayerType, UpdatePrayerDto } from '@aletheia/contracts';

interface PrayerDbRecord {
  id: string;
  familyId: string;
  learnerId: string | null;
  type: PrayerType;
  title: string;
  description: string | null;
  isAnswered: boolean;
  answeredAt: Date | null;
  answeredNote: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrayerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreatePrayerDto): Promise<PrayerRequestEntity> {
    const created = await this.prisma.prayerRequest.create({
      data: {
        familyId,
        learnerId: dto.learnerId || null,
        type: dto.type ?? 'PETITION',
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
      },
    });

    return this.mapToEntity(created as PrayerDbRecord);
  }

  async findByFamilyId(
    familyId: string,
    filter?: { isAnswered?: boolean; includeArchived?: boolean },
  ): Promise<PrayerRequestEntity[]> {
    const records = await this.prisma.prayerRequest.findMany({
      where: {
        familyId,
        ...(filter?.isAnswered !== undefined ? { isAnswered: filter.isAnswered } : {}),
        ...(filter?.includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.mapToEntity(record as PrayerDbRecord));
  }

  async findByIdAndFamilyId(familyId: string, id: string): Promise<PrayerRequestEntity | null> {
    const record = await this.prisma.prayerRequest.findFirst({
      where: {
        id,
        familyId,
      },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as PrayerDbRecord);
  }

  async update(
    familyId: string,
    id: string,
    data: Partial<UpdatePrayerDto> & {
      isAnswered?: boolean;
      answeredAt?: Date | null;
      answeredNote?: string | null;
      archivedAt?: Date | null;
    },
  ): Promise<PrayerRequestEntity | null> {
    const existing = await this.findByIdAndFamilyId(familyId, id);
    if (!existing) {
      return null;
    }

    const updated = await this.prisma.prayerRequest.update({
      where: {
        id,
      },
      data: {
        ...(data.learnerId !== undefined ? { learnerId: data.learnerId || null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.isAnswered !== undefined ? { isAnswered: data.isAnswered } : {}),
        ...(data.answeredAt !== undefined ? { answeredAt: data.answeredAt } : {}),
        ...(data.answeredNote !== undefined ? { answeredNote: data.answeredNote?.trim() || null } : {}),
        ...(data.archivedAt !== undefined ? { archivedAt: data.archivedAt } : {}),
      },
    });

    return this.mapToEntity(updated as PrayerDbRecord);
  }

  private mapToEntity(record: PrayerDbRecord): PrayerRequestEntity {
    return new PrayerRequestEntity({
      id: record.id,
      familyId: record.familyId,
      learnerId: record.learnerId,
      type: record.type,
      title: record.title,
      description: record.description,
      isAnswered: record.isAnswered,
      answeredAt: record.answeredAt,
      answeredNote: record.answeredNote,
      archivedAt: record.archivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
