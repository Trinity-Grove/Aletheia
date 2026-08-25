import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { DailyDevotionalEntity } from '../domain/daily-devotional.entity.js';
import type { UpsertDailyDevotionalDto } from '@aletheia/contracts';

interface DailyDevotionalDbRecord {
  id: string;
  familyId: string;
  date: Date;
  bibleReference: string;
  bibleVersionId: string | null;
  passageText: string | null;
  reflection: string | null;
  memoryVerse: string | null;
  hymnOrSong: string | null;
  discussionQuestions: string | null;
  practicalApplication: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DevotionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(familyId: string, dto: UpsertDailyDevotionalDto): Promise<DailyDevotionalEntity> {
    const date = new Date(dto.date);
    const discussionQuestions = Array.isArray(dto.discussionQuestions)
      ? JSON.stringify(dto.discussionQuestions)
      : dto.discussionQuestions?.trim() || null;

    const record = await this.prisma.dailyDevotional.upsert({
      where: {
        familyId_date: {
          familyId,
          date,
        },
      },
      create: {
        familyId,
        date,
        bibleReference: dto.bibleReference.trim(),
        bibleVersionId: dto.bibleVersionId?.trim() || null,
        passageText: dto.passageText?.trim() || null,
        reflection: dto.reflection?.trim() || null,
        memoryVerse: dto.memoryVerse?.trim() || null,
        hymnOrSong: dto.hymnOrSong?.trim() || null,
        discussionQuestions,
        practicalApplication: dto.practicalApplication?.trim() || null,
      },
      update: {
        bibleReference: dto.bibleReference.trim(),
        ...(dto.bibleVersionId !== undefined ? { bibleVersionId: dto.bibleVersionId?.trim() || null } : {}),
        ...(dto.passageText !== undefined ? { passageText: dto.passageText?.trim() || null } : {}),
        ...(dto.reflection !== undefined ? { reflection: dto.reflection?.trim() || null } : {}),
        ...(dto.memoryVerse !== undefined ? { memoryVerse: dto.memoryVerse?.trim() || null } : {}),
        ...(dto.hymnOrSong !== undefined ? { hymnOrSong: dto.hymnOrSong?.trim() || null } : {}),
        ...(dto.discussionQuestions !== undefined ? { discussionQuestions } : {}),
        ...(dto.practicalApplication !== undefined
          ? { practicalApplication: dto.practicalApplication?.trim() || null }
          : {}),
      },
    });

    return this.mapToEntity(record as DailyDevotionalDbRecord);
  }

  async findByDate(familyId: string, date: Date): Promise<DailyDevotionalEntity | null> {
    const record = await this.prisma.dailyDevotional.findUnique({
      where: {
        familyId_date: {
          familyId,
          date,
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as DailyDevotionalDbRecord);
  }

  async findRecent(familyId: string, limit = 30): Promise<DailyDevotionalEntity[]> {
    const records = await this.prisma.dailyDevotional.findMany({
      where: {
        familyId,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return records.map((record) => this.mapToEntity(record as DailyDevotionalDbRecord));
  }

  private mapToEntity(record: DailyDevotionalDbRecord): DailyDevotionalEntity {
    return new DailyDevotionalEntity({
      id: record.id,
      familyId: record.familyId,
      date: record.date,
      bibleReference: record.bibleReference,
      bibleVersionId: record.bibleVersionId,
      passageText: record.passageText,
      reflection: record.reflection,
      memoryVerse: record.memoryVerse,
      hymnOrSong: record.hymnOrSong,
      discussionQuestions: record.discussionQuestions,
      practicalApplication: record.practicalApplication,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
