import { FamilySettingsService } from './family-settings.service.js';
import { FamilySettingsRepository } from '../infrastructure/family-settings.repository.js';
import { FamilySettingsEntity } from '../domain/family-settings.entity.js';
import type { UpdateFamilySettingsDto } from '@aletheia/contracts';
import type { MailSender } from '../../../platform/mail/mail-sender.js';
import type { IdentityPublicApi } from '../../identity/application/public-api.js';

describe('FamilySettingsService', () => {
  let service: FamilySettingsService;
  let mockSettings: Map<string, FamilySettingsEntity>;
  let mockNotificationService: { createNotification: jest.Mock; wasNotifiedSince: jest.Mock };
  let mockMailSender: jest.Mocked<MailSender>;
  let mockIdentityApi: jest.Mocked<IdentityPublicApi>;

  let settingsRepository: jest.Mocked<FamilySettingsRepository>;

  beforeEach(() => {
    mockSettings = new Map();

    const mockRepo = {
      findByFamilyId: jest.fn(async (familyId: string) => {
        return mockSettings.get(familyId) ?? null;
      }),
      getOrCreateDefault: jest.fn(async (familyId: string) => {
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
      }),
      upsert: jest.fn(async (familyId: string, dto: UpdateFamilySettingsDto) => {
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
      }),
    } as unknown as jest.Mocked<FamilySettingsRepository>;

    mockNotificationService = {
      createNotification: jest.fn().mockResolvedValue({} as never),
      wasNotifiedSince: jest.fn().mockResolvedValue(false),
    };

    mockMailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockIdentityApi = {
      verifyToken: jest.fn(),
      findUserById: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'guardian@example.com',
        fullName: 'Guardian',
        emailVerified: true,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      }),
      isPlatformAdmin: jest.fn().mockResolvedValue(false),
    };

    settingsRepository = mockRepo as any;

    service = new FamilySettingsService(
      settingsRepository as unknown as FamilySettingsRepository,
      mockNotificationService as unknown as import('./notification.service.js').NotificationService,
      mockMailSender,
      mockIdentityApi,
    );
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

    it('persists the widget cadence timestamps and reads them back, including the "sempre" sentinel', async () => {
      const now = new Date();
      const forever = new Date('9999-12-31T23:59:59.999Z');

      const existingSettings = await service.getSettings('fam-1');
      (settingsRepository.upsert as any).mockImplementation(async (_familyId: string, dto: any) => {
        const base = await service.getSettings('fam-1');
        const entity = new FamilySettingsEntity({
          id: existingSettings.id,
          familyId: _familyId,
          homeschoolName: base.homeschoolName,
          defaultGradingScale: base.defaultGradingScale,
          timezone: base.timezone,
          language: base.language,
          devotionalReminderTime: base.devotionalReminderTime,
          dailyScheduleReminderTime: base.dailyScheduleReminderTime,
          attendanceReminderEnabled: base.attendanceReminderEnabled,
          emailNotificationsEnabled: base.emailNotificationsEnabled,
          inAppNotificationsEnabled: base.inAppNotificationsEnabled,
          supportWidgetLastSeenAt:
            dto.supportWidgetLastSeenAt === undefined
              ? null
              : dto.supportWidgetLastSeenAt
                ? new Date(dto.supportWidgetLastSeenAt)
                : null,
          supportWidgetSnoozedUntil:
            dto.supportWidgetSnoozedUntil === undefined
              ? null
              : dto.supportWidgetSnoozedUntil
                ? new Date(dto.supportWidgetSnoozedUntil)
                : null,
          createdAt: new Date(existingSettings.createdAt),
          updatedAt: new Date(),
        });
        return entity;
      });

      await service.updateSettings('fam-1', {
        supportWidgetLastSeenAt: now.toISOString(),
        supportWidgetSnoozedUntil: forever.toISOString(),
      });
      expect(settingsRepository.upsert).toHaveBeenCalledWith('fam-1', {
        supportWidgetLastSeenAt: now.toISOString(),
        supportWidgetSnoozedUntil: '9999-12-31T23:59:59.999Z',
      });

      // Clearing the snooze is the same single PATCH with null -- no special
      // case in the middle. lastSeenAt is untouched by that PATCH, so the
      // 7-day clock keeps running.
      await service.updateSettings('fam-1', { supportWidgetSnoozedUntil: null });
      expect(settingsRepository.upsert).toHaveBeenLastCalledWith('fam-1', { supportWidgetSnoozedUntil: null });
    });
  });

  describe('createNotification', () => {
    const dto = {
      userId: 'user-1',
      type: 'SYSTEM_NOTICE' as const,
      title: 'Test title',
      message: 'Test message',
    };

    it('creates the in-app notification when inAppNotificationsEnabled is true (the default)', async () => {
      mockNotificationService.createNotification.mockResolvedValue({ id: 'notif-1' } as never);

      const result = await service.createNotification('fam-1', dto);

      expect(result).toEqual({ id: 'notif-1' });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith('fam-1', dto);
    });

    it('skips the in-app notification and returns null when inAppNotificationsEnabled is false', async () => {
      await service.updateSettings('fam-1', { inAppNotificationsEnabled: false });

      const result = await service.createNotification('fam-1', dto);

      expect(result).toBeNull();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('sends an email when emailNotificationsEnabled is true (the default)', async () => {
      await service.createNotification('fam-1', dto);

      expect(mockIdentityApi.findUserById).toHaveBeenCalledWith('user-1');
      expect(mockMailSender.send).toHaveBeenCalledWith({
        to: 'guardian@example.com',
        subject: 'Test title',
        text: 'Test message',
        html: '<p>Test message</p>',
      });
    });

    it('does not send an email when emailNotificationsEnabled is false', async () => {
      await service.updateSettings('fam-1', { emailNotificationsEnabled: false });

      await service.createNotification('fam-1', dto);

      expect(mockMailSender.send).not.toHaveBeenCalled();
    });

    it('still returns the created notification even if sending the email fails', async () => {
      mockMailSender.send.mockRejectedValueOnce(new Error('provider down'));
      mockNotificationService.createNotification.mockResolvedValue({ id: 'notif-2' } as never);

      const result = await service.createNotification('fam-1', dto);

      expect(result).toEqual({ id: 'notif-2' });
    });
  });
});
