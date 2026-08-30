import { describe, expect, it } from 'vitest';
import {
  dashboardActivitySchema,
  dashboardQuerySchema,
  dashboardResponseSchema,
  type DashboardResponseDto,
} from './dashboard.js';

const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ACTIVITY_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const emptyDashboard: DashboardResponseDto = {
  date: '2026-08-28',
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
};

describe('dashboard contracts', () => {
  it('parses a query with its required date and optional learner', () => {
    expect(dashboardQuerySchema.parse({ date: '2026-08-28' })).toEqual({
      date: '2026-08-28',
    });
    expect(dashboardQuerySchema.parse({ date: '2026-08-28', learnerId: LEARNER_ID })).toEqual({
      date: '2026-08-28',
      learnerId: LEARNER_ID,
    });
  });

  it('parses an empty dashboard projection', () => {
    expect(dashboardResponseSchema.parse(emptyDashboard).activities).toEqual([]);
  });

  it('parses populated learners, journey values, and activities', () => {
    const populated: DashboardResponseDto = {
      ...emptyDashboard,
      learners: [{ id: LEARNER_ID, displayName: 'Ada' }],
      activeLearnerId: LEARNER_ID,
      journey: {
        completedMinutes: 30,
        targetMinutes: 60,
        completedLessons: 1,
        totalLessons: 2,
        daySequence: 4,
      },
      activities: [
        {
          id: ACTIVITY_ID,
          title: 'Math lesson',
          subjectName: 'Mathematics',
          scheduledTime: '09:30',
          durationMinutes: 30,
          completed: false,
          type: 'lesson',
        },
      ],
    };

    expect(dashboardResponseSchema.parse(populated)).toEqual(populated);
  });

  it('rejects malformed dates and learner ids in queries', () => {
    expect(dashboardQuerySchema.safeParse({ date: '28/08/2026' }).success).toBe(false);
    expect(dashboardQuerySchema.safeParse({ date: '2026-08-28', learnerId: 'foreign' }).success).toBe(false);
  });

  it('rejects negative journey values and invalid activity ids', () => {
    expect(
      dashboardResponseSchema.safeParse({
        ...emptyDashboard,
        journey: { ...emptyDashboard.journey, daySequence: -1 },
      }).success,
    ).toBe(false);
    expect(
      dashboardActivitySchema.safeParse({
        id: 'not-a-uuid',
        title: 'Routine',
        completed: false,
        type: 'routine',
      }).success,
    ).toBe(false);
  });
});
