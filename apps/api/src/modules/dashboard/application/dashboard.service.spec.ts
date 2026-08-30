import { NotFoundException } from '@nestjs/common';
import type {
  DailyAgendaDto,
  FamilyResponseDto,
  LearnerSummaryDto,
} from '@aletheia/contracts';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { LearnersPublicApi } from '../../learners/application/public-api.js';
import type { SchedulePublicApi } from '../../lessons/application/public-api.js';
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

const learners: LearnerSummaryDto[] = [
  {
    id: PREFERRED_LEARNER_ID,
    firstName: 'Ada',
    lastName: 'Lovelace',
    preferredName: 'Addie',
    stage: 'MIDDLE_LOGIC',
  },
  {
    id: FULL_NAME_LEARNER_ID,
    firstName: 'Grace',
    lastName: 'Hopper',
    preferredName: null,
    stage: 'HIGH_RHETORIC',
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
  let service: DashboardService;

  beforeEach(() => {
    familyApi = {
      isGuardianInFamily: jest.fn().mockResolvedValue(true),
      getFamilyForUser: jest.fn().mockResolvedValue(family),
    };
    learnersApi = {
      findLearnerById: jest.fn().mockResolvedValue(learners[0] ?? null),
      listActiveLearners: jest.fn().mockResolvedValue(learners),
    };
    scheduleApi = {
      getDailyAgenda: jest.fn().mockResolvedValue(populatedAgenda),
    };
    service = new DashboardService(familyApi, learnersApi, scheduleApi);
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
        targetMinutes: 0,
        completedLessons: 2,
        totalLessons: 3,
        daySequence: 0,
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
        daySequence: 0,
      },
      activities: [],
    });
  });
});
