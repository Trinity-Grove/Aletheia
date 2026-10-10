import { NotFoundException } from '@nestjs/common';
import type {
  DailyAgendaDto,
  FamilyResponseDto,
  FamilySettingsResponseDto,
  LearnerSummaryDto,
} from '@aletheia/contracts';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { LearnersPublicApi } from '../../learners/application/public-api.js';
import type { SchedulePublicApi } from '../../lessons/application/public-api.js';
import type { CurriculumPublicApi } from '../../curriculum/application/public-api.js';
import type { SettingsPublicApi } from '../../settings/application/public-api.js';
import { DashboardService } from './dashboard.service.js';

const USER_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const PREFERRED_LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FULL_NAME_LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const LESSON_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const INCOMPLETE_LESSON_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const MISSING_DURATION_LESSON_ID = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34';
const ROUTINE_ID = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a45';
const DATE = '2026-08-28';

const family: FamilyResponseDto = {
  id: FAMILY_ID,
  name: 'The Grove Family',
  countryCode: 'BRA',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const defaultSettings: FamilySettingsResponseDto = {
  id: '00000000-0000-0000-0000-000000000001',
  familyId: FAMILY_ID,
  homeschoolName: 'The Grove Homeschool',
  defaultGradingScale: 'NUMERIC_0_100',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  devotionalReminderTime: null,
  dailyScheduleReminderTime: null,
  attendanceReminderEnabled: true,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  supportWidgetLastSeenAt: null,
  supportWidgetSnoozedUntil: null,
  onboardingDismissed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const learners: LearnerSummaryDto[] = [
  {
    id: PREFERRED_LEARNER_ID,
    firstName: 'Ada',
    lastName: 'Lovelace',
    preferredName: 'Addie',
    stage: 'LOWER_SECONDARY',
  },
  {
    id: FULL_NAME_LEARNER_ID,
    firstName: 'Grace',
    lastName: 'Hopper',
    preferredName: null,
    stage: 'UPPER_SECONDARY',
  },
];

const populatedAgenda: DailyAgendaDto = {
  date: DATE,
  dayOfWeek: 5,
  items: [
    {
      type: 'LESSON',
      id: LESSON_ID,
      title: 'Mathematics',
      startTime: '09:15',
      endTime: '10:00',
      subjectId: 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a56',
      subjectName: 'Math',
      subjectColor: '#123456',
      status: 'COMPLETED',
      learnerIds: [PREFERRED_LEARNER_ID],
      isCompleted: true,
    },
    {
      type: 'ROUTINE_SLOT',
      id: ROUTINE_ID,
      title: 'Morning reading',
      startTime: '08:00',
      endTime: '08:20',
      learnerIds: [],
      isCompleted: false,
    },
    {
      type: 'LESSON',
      id: INCOMPLETE_LESSON_ID,
      title: 'History',
      startTime: '10:15',
      endTime: '11:15',
      learnerIds: [FULL_NAME_LEARNER_ID],
      isCompleted: false,
    },
    {
      type: 'LESSON',
      id: MISSING_DURATION_LESSON_ID,
      title: 'Writing',
      startTime: '12:00',
      endTime: null,
      learnerIds: [PREFERRED_LEARNER_ID],
      isCompleted: true,
    },
  ],
};

describe('DashboardService', () => {
  let familyApi: jest.Mocked<FamilyPublicApi>;
  let learnersApi: jest.Mocked<LearnersPublicApi>;
  let scheduleApi: jest.Mocked<SchedulePublicApi>;
  let curriculumApi: jest.Mocked<CurriculumPublicApi>;
  let settingsApi: jest.Mocked<SettingsPublicApi>;
  let service: DashboardService;

  beforeEach(() => {
    familyApi = {
      getFamilyMemberRole: jest.fn(),
      isGuardianInFamily: jest.fn().mockResolvedValue(true),
      getFamilyForUser: jest.fn().mockResolvedValue(family),
      getFamilyMemberUserIds: jest.fn().mockResolvedValue([]),
    };
    learnersApi = {
      findLearnerById: jest.fn().mockResolvedValue(learners[0] ?? null),
      listActiveLearners: jest.fn().mockResolvedValue(learners),
    };
    scheduleApi = {
      getDailyAgenda: jest.fn().mockResolvedValue(populatedAgenda),
      hasSchedule: jest.fn().mockResolvedValue(true),
      hasCompletedLessons: jest.fn().mockResolvedValue(true),
    };
    curriculumApi = {
      getLearnerCurriculumSummary: jest.fn().mockResolvedValue({ totalObjectives: 0, achievedObjectives: 0 }),
      getCurrentAcademicYearWindow: jest
        .fn()
        .mockResolvedValue({ startDate: new Date('2026-08-24T00:00:00.000Z'), endDate: null }),
      hasCurriculum: jest.fn().mockResolvedValue(true),
    };
    settingsApi = {
      getSettings: jest.fn().mockResolvedValue(defaultSettings),
      createNotification: jest.fn(),
      wasNotifiedSince: jest.fn(),
      listFamiliesWithRemindersEnabled: jest.fn(),
      exportFamilyData: jest.fn(),
    };
    service = new DashboardService(familyApi, learnersApi, scheduleApi, curriculumApi, settingsApi);
  });

  it('builds a family-wide dashboard with display-name precedence and mapped agenda items', async () => {
    const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

    expect(result).toEqual({
      date: DATE,
      family: { id: FAMILY_ID, name: 'The Grove Family' },
      learners: [
        { id: PREFERRED_LEARNER_ID, displayName: 'Addie' },
        { id: FULL_NAME_LEARNER_ID, displayName: 'Grace Hopper' },
      ],
      activeLearnerId: null,
      journey: {
        completedMinutes: 45,
        targetMinutes: 125,
        completedLessons: 2,
        totalLessons: 3,
        daySequence: 5,
      },
      activities: [
        {
          id: LESSON_ID,
          title: 'Mathematics',
          subjectName: 'Math',
          scheduledTime: '09:15',
          durationMinutes: 45,
          completed: true,
          type: 'lesson',
        },
        {
          id: ROUTINE_ID,
          title: 'Morning reading',
          scheduledTime: '08:00',
          durationMinutes: 20,
          completed: false,
          type: 'routine',
        },
        {
          id: INCOMPLETE_LESSON_ID,
          title: 'History',
          scheduledTime: '10:15',
          durationMinutes: 60,
          completed: false,
          type: 'lesson',
        },
        {
          id: MISSING_DURATION_LESSON_ID,
          title: 'Writing',
          scheduledTime: '12:00',
          durationMinutes: 0,
          completed: true,
          type: 'lesson',
        },
      ],
      onboarding: {
        dismissed: false,
        completedCount: 4,
        totalCount: 4,
        steps: [
          { id: 'create_learner', completed: true, actionUrl: '/learners' },
          { id: 'choose_curriculum', completed: true, actionUrl: '/curriculum' },
          { id: 'schedule_lesson', completed: true, actionUrl: '/schedule' },
          { id: 'complete_first_activity', completed: true, actionUrl: '/aluno/agenda' },
        ],
      },
    });
    expect(familyApi.getFamilyForUser).toHaveBeenCalledWith(USER_ID, FAMILY_ID);
    expect(learnersApi.findLearnerById).not.toHaveBeenCalled();
    expect(scheduleApi.getDailyAgenda).toHaveBeenCalledWith(FAMILY_ID, DATE, undefined);
  });

  it('validates and forwards a learner filter while retaining the family learner list', async () => {
    learnersApi.findLearnerById.mockResolvedValue(learners[1] ?? null);

    const result = await service.getDashboard(USER_ID, FAMILY_ID, {
      date: DATE,
      learnerId: FULL_NAME_LEARNER_ID,
    });

    expect(result.activeLearnerId).toBe(FULL_NAME_LEARNER_ID);
    expect(result.learners).toHaveLength(2);
    expect(learnersApi.findLearnerById).toHaveBeenCalledWith(FAMILY_ID, FULL_NAME_LEARNER_ID);
    expect(scheduleApi.getDailyAgenda).toHaveBeenCalledWith(
      FAMILY_ID,
      DATE,
      FULL_NAME_LEARNER_ID,
    );
  });

  it('rejects a missing or external learner before looking up the agenda', async () => {
    learnersApi.findLearnerById.mockResolvedValue(null);

    const dashboard = service.getDashboard(USER_ID, FAMILY_ID, {
      date: DATE,
      learnerId: FULL_NAME_LEARNER_ID,
    });

    await expect(dashboard).rejects.toEqual(new NotFoundException('Learner not found'));
    expect(scheduleApi.getDailyAgenda).not.toHaveBeenCalled();
  });

  it('fails closed when the family projection is absent', async () => {
    familyApi.getFamilyForUser.mockResolvedValue(null);

    await expect(service.getDashboard(USER_ID, FAMILY_ID, { date: DATE })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(learnersApi.listActiveLearners).not.toHaveBeenCalled();
    expect(scheduleApi.getDailyAgenda).not.toHaveBeenCalled();
  });

  it('returns a truthful empty projection without invented progress data', async () => {
    learnersApi.listActiveLearners.mockResolvedValue([]);
    scheduleApi.getDailyAgenda.mockResolvedValue({ date: DATE, dayOfWeek: 5, items: [] });
    scheduleApi.hasSchedule.mockResolvedValue(false);
    scheduleApi.hasCompletedLessons.mockResolvedValue(false);
    curriculumApi.hasCurriculum.mockResolvedValue(false);

    const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

    expect(result).toEqual({
      date: DATE,
      family: { id: FAMILY_ID, name: 'The Grove Family' },
      learners: [],
      activeLearnerId: null,
      journey: {
        completedMinutes: 0,
        targetMinutes: 0,
        completedLessons: 0,
        totalLessons: 0,
        daySequence: 5,
      },
      activities: [],
      onboarding: {
        dismissed: false,
        completedCount: 0,
        totalCount: 4,
        steps: [
          { id: 'create_learner', completed: false, actionUrl: '/learners' },
          { id: 'choose_curriculum', completed: false, actionUrl: '/curriculum' },
          { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
          { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
        ],
      },
    });
  });

  it('reports daySequence 0 when the family has no current academic year', async () => {
    curriculumApi.getCurrentAcademicYearWindow.mockResolvedValue(null);

    const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

    expect(result.journey.daySequence).toBe(0);
  });

  it('reports daySequence 0 for a date outside the academic year window', async () => {
    curriculumApi.getCurrentAcademicYearWindow.mockResolvedValue({
      startDate: new Date('2026-08-24T00:00:00.000Z'),
      endDate: new Date('2026-08-26T00:00:00.000Z'),
    });

    const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

    expect(result.journey.daySequence).toBe(0);
  });

  describe('onboarding checklist', () => {
    it('returns completedCount: 0 with all steps incomplete for an empty family', async () => {
      learnersApi.listActiveLearners.mockResolvedValue([]);
      curriculumApi.hasCurriculum.mockResolvedValue(false);
      scheduleApi.getDailyAgenda.mockResolvedValue({ date: DATE, dayOfWeek: 5, items: [] });
      scheduleApi.hasSchedule.mockResolvedValue(false);
      scheduleApi.hasCompletedLessons.mockResolvedValue(false);

      const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

      expect(result.onboarding).toEqual({
        dismissed: false,
        completedCount: 0,
        totalCount: 4,
        steps: [
          { id: 'create_learner', completed: false, actionUrl: '/learners' },
          { id: 'choose_curriculum', completed: false, actionUrl: '/curriculum' },
          { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
          { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
        ],
      });
    });

    it('returns completedCount: 4 with all steps completed for an active family', async () => {
      const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

      expect(result.onboarding).toEqual({
        dismissed: false,
        completedCount: 4,
        totalCount: 4,
        steps: [
          { id: 'create_learner', completed: true, actionUrl: '/learners' },
          { id: 'choose_curriculum', completed: true, actionUrl: '/curriculum' },
          { id: 'schedule_lesson', completed: true, actionUrl: '/schedule' },
          { id: 'complete_first_activity', completed: true, actionUrl: '/aluno/agenda' },
        ],
      });
    });

    it('reflects onboardingDismissed: true when dismissed in family settings', async () => {
      settingsApi.getSettings.mockResolvedValue({
        ...defaultSettings,
        onboardingDismissed: true,
      });

      const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

      expect(result.onboarding?.dismissed).toBe(true);
    });

    it('marks schedule_lesson completed if scheduleApi.hasSchedule returns true even when today agenda is empty', async () => {
      scheduleApi.getDailyAgenda.mockResolvedValue({ date: DATE, dayOfWeek: 5, items: [] });
      scheduleApi.hasSchedule.mockResolvedValue(true);

      const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

      const scheduleStep = result.onboarding?.steps.find((s) => s.id === 'schedule_lesson');
      expect(scheduleStep?.completed).toBe(true);
    });

    it('marks complete_first_activity completed if scheduleApi.hasCompletedLessons returns true even when today has no completed lessons', async () => {
      scheduleApi.getDailyAgenda.mockResolvedValue({
        date: DATE,
        dayOfWeek: 5,
        items: [
          {
            type: 'LESSON',
            id: INCOMPLETE_LESSON_ID,
            title: 'History',
            startTime: '10:15',
            endTime: '11:15',
            learnerIds: [FULL_NAME_LEARNER_ID],
            isCompleted: false,
          },
        ],
      });
      scheduleApi.hasCompletedLessons.mockResolvedValue(true);

      const result = await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE });

      const activityStep = result.onboarding?.steps.find((s) => s.id === 'complete_first_activity');
      expect(activityStep?.completed).toBe(true);
    });

    it('evaluates checklist scoped to learnerId when provided in query', async () => {
      await service.getDashboard(USER_ID, FAMILY_ID, { date: DATE, learnerId: PREFERRED_LEARNER_ID });

      expect(curriculumApi.hasCurriculum).toHaveBeenCalledWith(FAMILY_ID, PREFERRED_LEARNER_ID);
      expect(scheduleApi.hasSchedule).toHaveBeenCalledWith(FAMILY_ID, PREFERRED_LEARNER_ID);
      expect(scheduleApi.hasCompletedLessons).toHaveBeenCalledWith(FAMILY_ID, PREFERRED_LEARNER_ID);
    });
  });
});
