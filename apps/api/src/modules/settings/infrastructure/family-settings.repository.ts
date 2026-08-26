import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { FamilySettingsEntity } from '../domain/family-settings.entity.js';
import type { UpdateFamilySettingsDto, GradingScale } from '@aletheia/contracts';

interface FamilySettingsDbRecord {
  id: string;
  familyId: string;
  homeschoolName: string | null;
  defaultGradingScale: GradingScale;
  timezone: string;
  language: string;
  devotionalReminderTime: string | null;
  dailyScheduleReminderTime: string | null;
  attendanceReminderEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FamilySettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByFamilyId(familyId: string): Promise<FamilySettingsEntity | null> {
    const record = await this.prisma.familySettings.findUnique({
      where: { familyId },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as FamilySettingsDbRecord);
  }

  async getOrCreateDefault(familyId: string): Promise<FamilySettingsEntity> {
    const existing = await this.findByFamilyId(familyId);
    if (existing) {
      return existing;
    }

    const created = await this.prisma.familySettings.create({
      data: {
        familyId,
        homeschoolName: null,
        defaultGradingScale: 'MASTERY_QUALITATIVE',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        devotionalReminderTime: null,
        dailyScheduleReminderTime: null,
        attendanceReminderEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
      },
    });

    return this.mapToEntity(created as FamilySettingsDbRecord);
  }

  async upsert(familyId: string, dto: UpdateFamilySettingsDto): Promise<FamilySettingsEntity> {
    const homeschoolName =
      dto.homeschoolName !== undefined ? (dto.homeschoolName?.trim() || null) : undefined;
    const devotionalReminderTime =
      dto.devotionalReminderTime !== undefined ? (dto.devotionalReminderTime?.trim() || null) : undefined;
    const dailyScheduleReminderTime =
      dto.dailyScheduleReminderTime !== undefined ? (dto.dailyScheduleReminderTime?.trim() || null) : undefined;

    const record = await this.prisma.familySettings.upsert({
      where: { familyId },
      create: {
        familyId,
        homeschoolName: homeschoolName ?? null,
        defaultGradingScale: dto.defaultGradingScale ?? 'MASTERY_QUALITATIVE',
        timezone: dto.timezone?.trim() ?? 'America/Sao_Paulo',
        language: dto.language?.trim() ?? 'pt-BR',
        devotionalReminderTime: devotionalReminderTime ?? null,
        dailyScheduleReminderTime: dailyScheduleReminderTime ?? null,
        attendanceReminderEnabled: dto.attendanceReminderEnabled ?? true,
        emailNotificationsEnabled: dto.emailNotificationsEnabled ?? true,
        inAppNotificationsEnabled: dto.inAppNotificationsEnabled ?? true,
      },
      update: {
        ...(homeschoolName !== undefined ? { homeschoolName } : {}),
        ...(dto.defaultGradingScale !== undefined ? { defaultGradingScale: dto.defaultGradingScale } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone.trim() } : {}),
        ...(dto.language !== undefined ? { language: dto.language.trim() } : {}),
        ...(devotionalReminderTime !== undefined ? { devotionalReminderTime } : {}),
        ...(dailyScheduleReminderTime !== undefined ? { dailyScheduleReminderTime } : {}),
        ...(dto.attendanceReminderEnabled !== undefined
          ? { attendanceReminderEnabled: dto.attendanceReminderEnabled }
          : {}),
        ...(dto.emailNotificationsEnabled !== undefined
          ? { emailNotificationsEnabled: dto.emailNotificationsEnabled }
          : {}),
        ...(dto.inAppNotificationsEnabled !== undefined
          ? { inAppNotificationsEnabled: dto.inAppNotificationsEnabled }
          : {}),
      },
    });

    return this.mapToEntity(record as FamilySettingsDbRecord);
  }

  private mapToEntity(record: FamilySettingsDbRecord): FamilySettingsEntity {
    return new FamilySettingsEntity({
      id: record.id,
      familyId: record.familyId,
      homeschoolName: record.homeschoolName,
      defaultGradingScale: record.defaultGradingScale,
      timezone: record.timezone,
      language: record.language,
      devotionalReminderTime: record.devotionalReminderTime,
      dailyScheduleReminderTime: record.dailyScheduleReminderTime,
      attendanceReminderEnabled: record.attendanceReminderEnabled,
      emailNotificationsEnabled: record.emailNotificationsEnabled,
      inAppNotificationsEnabled: record.inAppNotificationsEnabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
