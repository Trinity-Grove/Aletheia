import { ReminderSchedulerService } from './reminder-scheduler.service.js';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { SettingsPublicApi } from '../../settings/application/public-api.js';
import type { LearnersPublicApi } from '../../learners/application/public-api.js';
import type { ComplianceReportsPublicApi } from '../../reports/application/public-api.js';
import type { FamilySettingsResponseDto, LearnerSummaryDto, AttendanceResponseDto } from '@aletheia/contracts';

function makeSettings(overrides: Partial<FamilySettingsResponseDto> = {}): FamilySettingsResponseDto {
  return {
    id: 'settings-1',
    familyId: 'fam-1',
    homeschoolName: null,
    defaultGradingScale: 'MASTERY_QUALITATIVE',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    devotionalReminderTime: null,
    dailyScheduleReminderTime: null,
    attendanceReminderEnabled: false,
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    supportWidgetLastSeenAt: null,
    supportWidgetSnoozedUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ReminderSchedulerService', () => {
  let settingsApi: jest.Mocked<SettingsPublicApi>;
  let familyApi: jest.Mocked<FamilyPublicApi>;
  let learnersApi: jest.Mocked<LearnersPublicApi>;
  let complianceApi: jest.Mocked<ComplianceReportsPublicApi>;
  let service: ReminderSchedulerService;

  // 10:15 UTC on 2026-03-05 is 07:15 local in America/Sao_Paulo (UTC-3).
  const NOW = new Date('2026-03-05T10:15:00Z');
  // 22:00 UTC on 2026-03-05 is 19:00 local in America/Sao_Paulo.
  const ATTENDANCE_CHECK_TIME = new Date('2026-03-05T22:00:00Z');

  beforeEach(() => {
    settingsApi = {
      getSettings: jest.fn(),
      createNotification: jest.fn().mockResolvedValue(undefined),
      wasNotifiedSince: jest.fn().mockResolvedValue(false),
      listFamiliesWithRemindersEnabled: jest.fn().mockResolvedValue([]),
      exportFamilyData: jest.fn(),
    };
    familyApi = {
      getFamilyMemberRole: jest.fn(),
      isGuardianInFamily: jest.fn().mockResolvedValue(true),
      getFamilyForUser: jest.fn().mockResolvedValue(null),
      getFamilyMemberUserIds: jest.fn().mockResolvedValue(['user-1', 'user-2']),    };
    learnersApi = {
      findLearnerById: jest.fn(),
      listActiveLearners: jest.fn().mockResolvedValue([]),
    };
    complianceApi = {
      logAttendance: jest.fn(),
      listAttendance: jest.fn().mockResolvedValue([]),
      getComplianceSummary: jest.fn(),
      upsertComplianceRequirement: jest.fn(),
      listComplianceRequirements: jest.fn(),
      generateReport: jest.fn(),
      getReport: jest.fn(),
      listReports: jest.fn(),
    };

    service = new ReminderSchedulerService(settingsApi, familyApi, learnersApi, complianceApi);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends a devotional reminder to every guardian when the family local time matches', async () => {
    jest.useFakeTimers({ now: NOW });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ devotionalReminderTime: '07:15' }),
    ]);

    await service.handleTick();

    expect(settingsApi.createNotification).toHaveBeenCalledTimes(2);
    expect(settingsApi.createNotification).toHaveBeenCalledWith('fam-1', {
      userId: 'user-1',
      type: 'DEVOTIONAL_REMINDER',
      title: 'Hora do devocional',
      message: 'Não esqueça o devocional da família hoje.',
      linkUrl: '/devotional',
    });
  });

  it('does not send a reminder when the family local time does not match', async () => {
    jest.useFakeTimers({ now: NOW });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ devotionalReminderTime: '08:00' }),
    ]);

    await service.handleTick();

    expect(settingsApi.createNotification).not.toHaveBeenCalled();
  });

  it('does not resend a reminder already sent earlier today', async () => {
    jest.useFakeTimers({ now: NOW });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ devotionalReminderTime: '07:15' }),
    ]);
    settingsApi.wasNotifiedSince.mockResolvedValue(true);

    await service.handleTick();

    expect(settingsApi.createNotification).not.toHaveBeenCalled();
  });

  it('sends an attendance-missing reminder when active learners have no attendance logged today', async () => {
    jest.useFakeTimers({ now: ATTENDANCE_CHECK_TIME });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ attendanceReminderEnabled: true }),
    ]);
    learnersApi.listActiveLearners.mockResolvedValue([{ id: 'learner-1' } as unknown as LearnerSummaryDto]);
    complianceApi.listAttendance.mockResolvedValue([]);

    await service.handleTick();

    expect(complianceApi.listAttendance).toHaveBeenCalledWith('fam-1', {
      startDate: '2026-03-05',
      endDate: '2026-03-05',
    });
    expect(settingsApi.createNotification).toHaveBeenCalledWith('fam-1', {
      userId: 'user-1',
      type: 'ATTENDANCE_MISSING_REMINDER',
      title: 'Presença não registrada',
      message: 'Nenhuma presença foi registrada hoje.',
      linkUrl: '/attendance',
    });
  });

  it('does not send an attendance reminder when attendance was already logged today', async () => {
    jest.useFakeTimers({ now: ATTENDANCE_CHECK_TIME });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ attendanceReminderEnabled: true }),
    ]);
    learnersApi.listActiveLearners.mockResolvedValue([{ id: 'learner-1' } as unknown as LearnerSummaryDto]);
    complianceApi.listAttendance.mockResolvedValue([{ id: 'att-1' } as unknown as AttendanceResponseDto]);

    await service.handleTick();

    expect(settingsApi.createNotification).not.toHaveBeenCalled();
  });

  it('does not send an attendance reminder when there are no active learners', async () => {
    jest.useFakeTimers({ now: ATTENDANCE_CHECK_TIME });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ attendanceReminderEnabled: true }),
    ]);
    learnersApi.listActiveLearners.mockResolvedValue([]);

    await service.handleTick();

    expect(complianceApi.listAttendance).not.toHaveBeenCalled();
    expect(settingsApi.createNotification).not.toHaveBeenCalled();
  });

  it('keeps processing other families when one family throws', async () => {
    jest.useFakeTimers({ now: NOW });
    settingsApi.listFamiliesWithRemindersEnabled.mockResolvedValue([
      makeSettings({ familyId: 'fam-broken', devotionalReminderTime: '07:15' }),
      makeSettings({ familyId: 'fam-ok', devotionalReminderTime: '07:15' }),
    ]);
    familyApi.getFamilyMemberUserIds.mockImplementation(async (familyId: string) => {
      if (familyId === 'fam-broken') throw new Error('boom');
      return ['user-1'];
    });

    await expect(service.handleTick()).resolves.toBeUndefined();

    expect(settingsApi.createNotification).toHaveBeenCalledWith(
      'fam-ok',
      expect.objectContaining({ type: 'DEVOTIONAL_REMINDER' }),
    );
  });
});
