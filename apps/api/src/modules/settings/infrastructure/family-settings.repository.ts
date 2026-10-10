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
  supportWidgetLastSeenAt: Date | null;
  supportWidgetSnoozedUntil: Date | null;
  onboardingDismissed: boolean;
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
        onboardingDismissed: false,
      },
    });

    return this.mapToEntity(created as FamilySettingsDbRecord);
  }

  // Scoped to families that opted into at least one reminder so the
  // per-minute scheduler tick doesn't load every family's settings row.
  async findAllWithRemindersEnabled(): Promise<FamilySettingsEntity[]> {
    const records = await this.prisma.familySettings.findMany({
      where: {
        OR: [
          { devotionalReminderTime: { not: null } },
          { dailyScheduleReminderTime: { not: null } },
          { attendanceReminderEnabled: true },
        ],
      },
    });

    return records.map((record) => this.mapToEntity(record as FamilySettingsDbRecord));
  }

  async upsert(familyId: string, dto: UpdateFamilySettingsDto): Promise<FamilySettingsEntity> {
    const homeschoolName =
      dto.homeschoolName !== undefined ? (dto.homeschoolName?.trim() || null) : undefined;
    const devotionalReminderTime =
      dto.devotionalReminderTime !== undefined ? (dto.devotionalReminderTime?.trim() || null) : undefined;
    const dailyScheduleReminderTime =
      dto.dailyScheduleReminderTime !== undefined ? (dto.dailyScheduleReminderTime?.trim() || null) : undefined;

    const supportWidgetLastSeenAt =
      dto.supportWidgetLastSeenAt !== undefined
        ? dto.supportWidgetLastSeenAt
          ? new Date(dto.supportWidgetLastSeenAt)
          : null
        : undefined;
    const supportWidgetSnoozedUntil =
      dto.supportWidgetSnoozedUntil !== undefined
        ? dto.supportWidgetSnoozedUntil
          ? new Date(dto.supportWidgetSnoozedUntil)
          : null
        : undefined;

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
        onboardingDismissed: dto.onboardingDismissed ?? false,
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
        ...(supportWidgetLastSeenAt !== undefined ? { supportWidgetLastSeenAt } : {}),
        ...(supportWidgetSnoozedUntil !== undefined ? { supportWidgetSnoozedUntil } : {}),
        ...(dto.onboardingDismissed !== undefined ? { onboardingDismissed: dto.onboardingDismissed } : {}),
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
      supportWidgetLastSeenAt: record.supportWidgetLastSeenAt,
      supportWidgetSnoozedUntil: record.supportWidgetSnoozedUntil,
      onboardingDismissed: record.onboardingDismissed,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
