import { FamilySettingsService } from './family-settings.service.js';
import { FamilySettingsRepository } from '../infrastructure/family-settings.repository.js';
import { FamilySettingsEntity } from '../domain/family-settings.entity.js';
import type { UpdateFamilySettingsDto } from '@aletheia/contracts';

describe('FamilySettingsService', () => {
  let service: FamilySettingsService;
  let mockSettings: Map<string, FamilySettingsEntity>;

  beforeEach(() => {
    mockSettings = new Map();

    const mockRepo = {
      findByFamilyId: async (familyId: string) => {
        return mockSettings.get(familyId) ?? null;
      },
      getOrCreateDefault: async (familyId: string) => {
        const existing = mockSettings.get(familyId);
        if (existing) return existing;

        const defaultEntity = new FamilySettingsEntity({
          id: `settings-${mockSettings.size + 1}`,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockSettings.set(familyId, defaultEntity);
        return defaultEntity;
      },
      upsert: async (familyId: string, dto: UpdateFamilySettingsDto) => {
        const existing = mockSettings.get(familyId);
        const entity = new FamilySettingsEntity({
          id: existing ? existing.id : `settings-${mockSettings.size + 1}`,
          familyId,
          homeschoolName:
            dto.homeschoolName !== undefined ? dto.homeschoolName : existing?.homeschoolName ?? null,
          defaultGradingScale:
            dto.defaultGradingScale !== undefined
              ? dto.defaultGradingScale
              : existing?.defaultGradingScale ?? 'MASTERY_QUALITATIVE',
          timezone: dto.timezone !== undefined ? dto.timezone : existing?.timezone ?? 'America/Sao_Paulo',
          language: dto.language !== undefined ? dto.language : existing?.language ?? 'pt-BR',
          devotionalReminderTime:
            dto.devotionalReminderTime !== undefined
              ? dto.devotionalReminderTime
              : existing?.devotionalReminderTime ?? null,
          dailyScheduleReminderTime:
            dto.dailyScheduleReminderTime !== undefined
              ? dto.dailyScheduleReminderTime
              : existing?.dailyScheduleReminderTime ?? null,
          attendanceReminderEnabled:
            dto.attendanceReminderEnabled !== undefined
              ? dto.attendanceReminderEnabled
              : existing?.attendanceReminderEnabled ?? true,
          emailNotificationsEnabled:
            dto.emailNotificationsEnabled !== undefined
              ? dto.emailNotificationsEnabled
              : existing?.emailNotificationsEnabled ?? true,
          inAppNotificationsEnabled:
            dto.inAppNotificationsEnabled !== undefined
              ? dto.inAppNotificationsEnabled
              : existing?.inAppNotificationsEnabled ?? true,
          createdAt: existing ? existing.createdAt : new Date(),
          updatedAt: new Date(),
        });
        mockSettings.set(familyId, entity);
        return entity;
      },
    } as unknown as FamilySettingsRepository;

    service = new FamilySettingsService(mockRepo);
  });

  describe('getSettings', () => {
    it('returns default settings when none exist for the family', async () => {
      const result = await service.getSettings('fam-1');

      expect(result.familyId).toBe('fam-1');
      expect(result.defaultGradingScale).toBe('MASTERY_QUALITATIVE');
      expect(result.timezone).toBe('America/Sao_Paulo');
      expect(result.language).toBe('pt-BR');
      expect(result.attendanceReminderEnabled).toBe(true);
      expect(result.emailNotificationsEnabled).toBe(true);
      expect(result.inAppNotificationsEnabled).toBe(true);
    });

    it('returns existing settings when present', async () => {
      await service.updateSettings('fam-1', {
        homeschoolName: 'Providence Academy',
        timezone: 'America/New_York',
      });

      const result = await service.getSettings('fam-1');
      expect(result.homeschoolName).toBe('Providence Academy');
      expect(result.timezone).toBe('America/New_York');
    });
  });

  describe('updateSettings', () => {
    it('updates family settings', async () => {
      const updated = await service.updateSettings('fam-1', {
        homeschoolName: 'Grace Classical School',
        defaultGradingScale: 'LETTER_A_F',
        devotionalReminderTime: '08:00',
        dailyScheduleReminderTime: '09:00',
        attendanceReminderEnabled: false,
        emailNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      });

      expect(updated.familyId).toBe('fam-1');
      expect(updated.homeschoolName).toBe('Grace Classical School');
      expect(updated.defaultGradingScale).toBe('LETTER_A_F');
      expect(updated.devotionalReminderTime).toBe('08:00');
      expect(updated.dailyScheduleReminderTime).toBe('09:00');
      expect(updated.attendanceReminderEnabled).toBe(false);
      expect(updated.emailNotificationsEnabled).toBe(false);
      expect(updated.inAppNotificationsEnabled).toBe(true);
    });
  });
});
