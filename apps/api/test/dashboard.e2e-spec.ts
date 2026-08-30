import type {
  DailyAgendaDto,
  FamilyResponseDto,
  LearnerSummaryDto,
} from '@aletheia/contracts';
import { dashboardResponseSchema } from '@aletheia/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import {
  FAMILY_PUBLIC_API,
  type FamilyPublicApi,
} from '../src/modules/families/application/public-api.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import {
  LEARNERS_PUBLIC_API,
  type LearnersPublicApi,
} from '../src/modules/learners/application/public-api.js';
import {
  SCHEDULE_PUBLIC_API,
  type SchedulePublicApi,
} from '../src/modules/lessons/application/public-api.js';

const FAMILY_A_ID = '00000000-0000-4000-8000-000000000001';
const FAMILY_B_ID = '00000000-0000-4000-8000-000000000002';
const LEARNER_A_ID = '10000000-0000-4000-8000-000000000001';
const EXTERNAL_LEARNER_ID = '10000000-0000-4000-8000-000000000002';
const LESSON_ID = '20000000-0000-4000-8000-000000000001';
const ROUTINE_ID = '30000000-0000-4000-8000-000000000001';
const SUBJECT_ID = '40000000-0000-4000-8000-000000000001';
const GUARDIAN_A_ID = 'guardian-a-user-id';
const GUARDIAN_B_ID = 'guardian-b-user-id';
const GUARDIAN_A_TOKEN = 'guardian-a-token';
const GUARDIAN_B_TOKEN = 'guardian-b-token';
const POPULATED_DATE = '2026-08-28';
const EMPTY_DATE = '2026-08-29';

const familyA: FamilyResponseDto = {
  id: FAMILY_A_ID,
  name: 'The Grove Family',
  countryCode: 'BRA',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const learnerA: LearnerSummaryDto = {
  id: LEARNER_A_ID,
  firstName: 'Ada',
  lastName: 'Lovelace',
  preferredName: 'Addie',
  stage: 'MIDDLE_LOGIC',
};

const populatedAgenda: DailyAgendaDto = {
  date: POPULATED_DATE,
  dayOfWeek: 5,
  items: [
    {
      type: 'ROUTINE_SLOT',
      id: ROUTINE_ID,
      title: 'Morning reading',
      startTime: '08:00',
      endTime: '08:20',
      learnerIds: [LEARNER_A_ID],
      isCompleted: false,
    },
    {
      type: 'LESSON',
      id: LESSON_ID,
      title: 'Mathematics',
      startTime: '09:00',
      endTime: '09:45',
      subjectId: SUBJECT_ID,
      subjectName: 'Math',
      status: 'COMPLETED',
      learnerIds: [LEARNER_A_ID],
      isCompleted: true,
    },
  ],
};

describe('Family dashboard E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();

    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === GUARDIAN_A_TOKEN) {
        return { userId: GUARDIAN_A_ID, email: 'guardian-a@test.com' };
      }
      if (token === GUARDIAN_B_TOKEN) {
        return { userId: GUARDIAN_B_ID, email: 'guardian-b@test.com' };
      }
      return null;
    });

    const familyApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      return (
        (userId === GUARDIAN_A_ID && familyId === FAMILY_A_ID) ||
        (userId === GUARDIAN_B_ID && familyId === FAMILY_B_ID)
      );
    });
    jest.spyOn(familyApi, 'getFamilyForUser').mockImplementation(async (userId, familyId) => {
      return userId === GUARDIAN_A_ID && familyId === FAMILY_A_ID ? familyA : null;
    });

    const learnersApi = app.get<LearnersPublicApi>(LEARNERS_PUBLIC_API);
    jest.spyOn(learnersApi, 'findLearnerById').mockImplementation(async (familyId, learnerId) => {
      return familyId === FAMILY_A_ID && learnerId === LEARNER_A_ID ? learnerA : null;
    });
    jest.spyOn(learnersApi, 'listActiveLearners').mockImplementation(async (familyId) => {
      return familyId === FAMILY_A_ID ? [learnerA] : [];
    });

    const scheduleApi = app.get<SchedulePublicApi>(SCHEDULE_PUBLIC_API);
    jest.spyOn(scheduleApi, 'getDailyAgenda').mockImplementation(
      async (_familyId, date, _learnerId) =>
        date === POPULATED_DATE
          ? populatedAgenda
          : { date, dayOfWeek: 6, items: [] },
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a populated learner dashboard that satisfies the public schema', async () => {
    const response = await supertest(app.getHttpServer())
      .get(
        `/api/v1/families/${FAMILY_A_ID}/dashboard?date=${POPULATED_DATE}&learnerId=${LEARNER_A_ID}`,
      )
      .set('Authorization', `Bearer ${GUARDIAN_A_TOKEN}`)
      .expect(200);

    expect(response.body).toEqual({
      date: POPULATED_DATE,
      family: { id: FAMILY_A_ID, name: 'The Grove Family' },
      learners: [{ id: LEARNER_A_ID, displayName: 'Addie' }],
      activeLearnerId: LEARNER_A_ID,
      journey: {
        completedMinutes: 45,
        targetMinutes: 0,
        completedLessons: 1,
        totalLessons: 1,
        daySequence: 0,
      },
      activities: [
        {
          id: ROUTINE_ID,
          title: 'Morning reading',
          scheduledTime: '08:00',
          durationMinutes: 20,
          completed: false,
          type: 'routine',
        },
        {
          id: LESSON_ID,
          title: 'Mathematics',
          subjectName: 'Math',
          scheduledTime: '09:00',
          durationMinutes: 45,
          completed: true,
          type: 'lesson',
        },
      ],
    });
    expect(dashboardResponseSchema.safeParse(response.body).success).toBe(true);
  });

  it('returns a valid empty dashboard when the selected date has no agenda items', async () => {
    const response = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${FAMILY_A_ID}/dashboard?date=${EMPTY_DATE}`)
      .set('Authorization', `Bearer ${GUARDIAN_A_TOKEN}`)
      .expect(200);

    expect(response.body.activities).toEqual([]);
    expect(response.body.activeLearnerId).toBeNull();
    expect(response.body.journey).toEqual({
      completedMinutes: 0,
      targetMinutes: 0,
      completedLessons: 0,
      totalLessons: 0,
      daySequence: 0,
    });
    expect(dashboardResponseSchema.safeParse(response.body).success).toBe(true);
  });

  it('rejects a request without an authentication token', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${FAMILY_A_ID}/dashboard?date=${POPULATED_DATE}`)
      .expect(401);
  });

  it("rejects access to another family's dashboard", async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${FAMILY_A_ID}/dashboard?date=${POPULATED_DATE}`)
      .set('Authorization', `Bearer ${GUARDIAN_B_TOKEN}`)
      .expect(403);
  });

  it('does not expose a learner outside the requested family', async () => {
    await supertest(app.getHttpServer())
      .get(
        `/api/v1/families/${FAMILY_A_ID}/dashboard?date=${POPULATED_DATE}&learnerId=${EXTERNAL_LEARNER_ID}`,
      )
      .set('Authorization', `Bearer ${GUARDIAN_A_TOKEN}`)
      .expect(404);
  });

  it.each([
    ['a malformed date', `date=28-08-2026`],
    ['a malformed learner UUID', `date=${POPULATED_DATE}&learnerId=not-a-uuid`],
  ])('rejects %s with a stable public response', async (_case, query) => {
    const response = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${FAMILY_A_ID}/dashboard?${query}`)
      .set('Authorization', `Bearer ${GUARDIAN_A_TOKEN}`)
      .expect(400);

    expect(response.body.message).toBe('Invalid dashboard query.');
  });
});
