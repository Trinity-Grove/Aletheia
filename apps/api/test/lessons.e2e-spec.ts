import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../src/modules/families/application/public-api.js';
import { LessonPlanService } from '../src/modules/lessons/application/lesson-plan.service.js';
import { ScheduleService } from '../src/modules/lessons/application/schedule.service.js';
import type {
  DailyAgendaDto,
  DailyAgendaItemDto,
  DayOfWeek,
  LessonPlanResponseDto,
  ScheduleSlotResponseDto,
} from '@aletheia/contracts';

describe('Lessons & Weekly Routine E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = '00000000-0000-0000-0000-000000000001';
  const familyBId = '00000000-0000-0000-0000-000000000002';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';

  const learner1Id = '10000000-0000-0000-0000-000000000001';
  const learner2Id = '10000000-0000-0000-0000-000000000002';
  const objective1Id = '20000000-0000-0000-0000-000000000001';
  const objective2Id = '20000000-0000-0000-0000-000000000002';
  const subject1Id = '30000000-0000-0000-0000-000000000001';
  const year1Id = '40000000-0000-0000-0000-000000000001';

  let lessonsStore: LessonPlanResponseDto[] = [];
  let slotsStore: ScheduleSlotResponseDto[] = [];

  beforeAll(async () => {
    app = await createApplication();

    // 1. Auth mocking
    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: 'guardian-a@test.com' };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: 'guardian-b@test.com' };
      }
      return null;
    });

    // 2. Multi-tenant Family membership check
    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    // 3. LessonPlanService mocking
    const lessonPlanService = app.get(LessonPlanService);
    jest.spyOn(lessonPlanService, 'createLessonPlan').mockImplementation(async (familyId, dto) => {
      const lesson: LessonPlanResponseDto = {
        id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        subjectId: dto.subjectId,
        title: dto.title,
        date: dto.date,
        status: 'PLANNED',
        description: dto.description ?? undefined,
        startTime: dto.startTime ?? undefined,
        endTime: dto.endTime ?? undefined,
        durationMinutes: dto.durationMinutes ?? undefined,
        academicYearId: dto.academicYearId ?? undefined,
        materials: dto.materials ?? undefined,
        homework: dto.homework ?? undefined,
        notes: dto.notes ?? undefined,
        learners: (dto.learnerIds ?? []).map((lid, idx) => ({
          id: `lpl-${Date.now()}-${idx}`,
          lessonPlanId: 'temp',
          learnerId: lid,
          completed: false,
          learnerName: `Learner ${lid}`,
        })),
        objectives: (dto.objectiveIds ?? []).map((oid, idx) => ({
          id: `lpo-${Date.now()}-${idx}`,
          lessonPlanId: 'temp',
          objectiveId: oid,
          title: `Objective ${oid}`,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // fix references
      lesson.learners.forEach((l) => {
        l.lessonPlanId = lesson.id;
      });
      lesson.objectives.forEach((o) => {
        o.lessonPlanId = lesson.id;
      });
      lessonsStore.push(lesson);
      return lesson;
    });

    jest.spyOn(lessonPlanService, 'getLessonPlan').mockImplementation(async (familyId, id) => {
      const lesson = lessonsStore.find((l) => l.familyId === familyId && l.id === id);
      if (!lesson) {
        throw new NotFoundException('Lesson plan not found');
      }
      return lesson;
    });

    jest.spyOn(lessonPlanService, 'listLessonPlans').mockImplementation(async (familyId, filter = {}) => {
      return lessonsStore.filter((l) => {
        if (l.familyId !== familyId) return false;
        if (filter.date && l.date !== filter.date) return false;
        if (filter.startDate && l.date < filter.startDate) return false;
        if (filter.endDate && l.date > filter.endDate) return false;
        if (filter.subjectId && l.subjectId !== filter.subjectId) return false;
        if (filter.status && l.status !== filter.status) return false;
        if (filter.academicYearId && l.academicYearId !== filter.academicYearId) return false;
        if (filter.learnerId && !l.learners.some((lr) => lr.learnerId === filter.learnerId)) return false;
        return true;
      });
    });

    jest.spyOn(lessonPlanService, 'updateLessonPlan').mockImplementation(async (familyId, id, dto) => {
      const lesson = lessonsStore.find((l) => l.familyId === familyId && l.id === id);
      if (!lesson) {
        throw new NotFoundException('Lesson plan not found');
      }
      if (dto.title !== undefined) lesson.title = dto.title;
      if (dto.description !== undefined) lesson.description = dto.description ?? undefined;
      if (dto.date !== undefined) lesson.date = dto.date;
      if (dto.startTime !== undefined) lesson.startTime = dto.startTime ?? undefined;
      if (dto.endTime !== undefined) lesson.endTime = dto.endTime ?? undefined;
      lesson.updatedAt = new Date().toISOString();
      return lesson;
    });

    jest.spyOn(lessonPlanService, 'completeLesson').mockImplementation(async (familyId, id, dto, learnerId) => {
      const lesson = lessonsStore.find((l) => l.familyId === familyId && l.id === id);
      if (!lesson) {
        throw new NotFoundException('Lesson plan not found');
      }
      if (learnerId) {
        const lr = lesson.learners.find((l) => l.learnerId === learnerId);
        if (lr) {
          lr.completed = true;
          if (dto.notes) lr.notes = dto.notes;
        }
      } else {
        lesson.status = 'COMPLETED';
        lesson.completedAt = dto.completedAt ?? new Date().toISOString();
        if (dto.actualDurationMinutes !== undefined) lesson.actualDurationMinutes = dto.actualDurationMinutes ?? undefined;
        if (dto.notes !== undefined) lesson.notes = dto.notes ?? undefined;
        lesson.learners.forEach((l) => {
          l.completed = true;
        });
      }
      lesson.updatedAt = new Date().toISOString();
      return lesson;
    });

    jest.spyOn(lessonPlanService, 'rescheduleLesson').mockImplementation(async (familyId, id, dto) => {
      const lesson = lessonsStore.find((l) => l.familyId === familyId && l.id === id);
      if (!lesson) {
        throw new NotFoundException('Lesson plan not found');
      }
      lesson.date = dto.newDate;
      if (dto.startTime !== undefined) lesson.startTime = dto.startTime ?? undefined;
      if (dto.endTime !== undefined) lesson.endTime = dto.endTime ?? undefined;
      lesson.status = 'POSTPONED';
      lesson.updatedAt = new Date().toISOString();
      return lesson;
    });

    jest.spyOn(lessonPlanService, 'deleteLessonPlan').mockImplementation(async (familyId, id) => {
      const idx = lessonsStore.findIndex((l) => l.familyId === familyId && l.id === id);
      if (idx === -1) {
        throw new NotFoundException('Lesson plan not found');
      }
      lessonsStore.splice(idx, 1);
      return true;
    });

    // 4. ScheduleService mocking
    const scheduleService = app.get(ScheduleService);
    jest.spyOn(scheduleService, 'createSlot').mockImplementation(async (familyId, dto) => {
      const slot: ScheduleSlotResponseDto = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        title: dto.title,
        academicYearId: dto.academicYearId ?? undefined,
        subjectId: dto.subjectId ?? undefined,
        learnerId: dto.learnerId ?? undefined,
        description: dto.description ?? undefined,
        location: dto.location ?? undefined,
        color: dto.color ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      slotsStore.push(slot);
      return slot;
    });

    jest.spyOn(scheduleService, 'getSlot').mockImplementation(async (familyId, id) => {
      const slot = slotsStore.find((s) => s.familyId === familyId && s.id === id);
      if (!slot) {
        throw new NotFoundException('Schedule slot not found');
      }
      return slot;
    });

    jest.spyOn(scheduleService, 'listSlots').mockImplementation(async (familyId, filter = {}) => {
      return slotsStore.filter((s) => {
        if (s.familyId !== familyId) return false;
        if (filter.dayOfWeek !== undefined && s.dayOfWeek !== filter.dayOfWeek) return false;
        if (filter.learnerId && s.learnerId !== filter.learnerId) return false;
        if (filter.subjectId && s.subjectId !== filter.subjectId) return false;
        if (filter.academicYearId && s.academicYearId !== filter.academicYearId) return false;
        return true;
      });
    });

    jest.spyOn(scheduleService, 'updateSlot').mockImplementation(async (familyId, id, dto) => {
      const slot = slotsStore.find((s) => s.familyId === familyId && s.id === id);
      if (!slot) {
        throw new NotFoundException('Schedule slot not found');
      }
      if (dto.title !== undefined) slot.title = dto.title;
      if (dto.startTime !== undefined) slot.startTime = dto.startTime;
      if (dto.endTime !== undefined) slot.endTime = dto.endTime;
      if (dto.dayOfWeek !== undefined) slot.dayOfWeek = dto.dayOfWeek;
      slot.updatedAt = new Date().toISOString();
      return slot;
    });

    jest.spyOn(scheduleService, 'deleteSlot').mockImplementation(async (familyId, id) => {
      const idx = slotsStore.findIndex((s) => s.familyId === familyId && s.id === id);
      if (idx === -1) {
        throw new NotFoundException('Schedule slot not found');
      }
      slotsStore.splice(idx, 1);
      return true;
    });

    jest.spyOn(scheduleService, 'getDailyAgenda').mockImplementation(async (familyId, dateStr, learnerId) => {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const day = Number(dayStr);
      const date = new Date(Date.UTC(year, month, day));
      const jsDay = date.getUTCDay();
      const dayOfWeek = (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

      const routineSlots = slotsStore.filter((s) => {
        if (s.familyId !== familyId) return false;
        if (s.dayOfWeek !== dayOfWeek) return false;
        if (learnerId && s.learnerId && s.learnerId !== learnerId) return false;
        return true;
      });

      const dayLessons = lessonsStore.filter((l) => {
        if (l.familyId !== familyId) return false;
        if (l.date !== dateStr) return false;
        if (learnerId && !l.learners.some((lr) => lr.learnerId === learnerId)) return false;
        return true;
      });

      const slotItems: DailyAgendaItemDto[] = routineSlots.map((slot) => ({
        type: 'ROUTINE_SLOT',
        id: slot.id,
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectId: slot.subjectId,
        subjectColor: slot.color,
        isCompleted: false,
        learnerIds: slot.learnerId ? [slot.learnerId] : [],
        scheduleSlot: slot,
      }));

      const lessonItems: DailyAgendaItemDto[] = dayLessons.map((lesson) => ({
        type: 'LESSON',
        id: lesson.id,
        title: lesson.title,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        subjectId: lesson.subjectId,
        status: lesson.status,
        isCompleted: lesson.status === 'COMPLETED',
        learnerIds: lesson.learners.map((lr) => lr.learnerId),
        lessonPlan: lesson,
      }));

      const items = [...slotItems, ...lessonItems].sort((a, b) => {
        const timeA = a.startTime ?? '99:99';
        const timeB = b.startTime ?? '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return a.title.localeCompare(b.title);
      });

      const result: DailyAgendaDto = {
        date: dateStr,
        dayOfWeek,
        items,
      };
      return result;
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    lessonsStore = [];
    slotsStore = [];
  });

  describe('Multi-Tenant Access Control & Boundary', () => {
    it('returns 403 Forbidden when Guardian A attempts to access Family B lesson endpoints', async () => {
      const resLessons = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/lessons`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(resLessons.status).toBe(403);

      const resSchedule = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/schedule/slots`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(resSchedule.status).toBe(403);
    });

    it('returns 403 Forbidden when Guardian B attempts to access Family A lesson endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/lessons`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .send({
          title: 'Cross-Tenant Intrusion',
          subjectId: subject1Id,
          date: '2026-09-01',
          learnerIds: [learner1Id],
        });

      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized for unauthenticated requests', async () => {
      const resLessonList = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/lessons`);

      expect(resLessonList.status).toBe(401);

      const resScheduleSlots = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/schedule/slots`);

      expect(resScheduleSlots.status).toBe(401);

      const resAgenda = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/schedule/agenda`);

      expect(resAgenda.status).toBe(401);
    });
  });

  describe('Lesson Planning Flow', () => {
    it('creates, queries, completes, reschedules, and deletes a lesson plan', async () => {
      // 1. Create lesson with multiple learners & learning objectives
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/lessons`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          title: 'História do Brasil Colonial',
          description: 'Estudo do período colonial com foco nas capitanias hereditárias',
          subjectId: subject1Id,
          academicYearId: year1Id,
          date: '2026-09-01',
          startTime: '09:00',
          endTime: '10:00',
          durationMinutes: 60,
          materials: 'Livro didático pág 45-50',
          learnerIds: [learner1Id, learner2Id],
          objectiveIds: [objective1Id, objective2Id],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe('História do Brasil Colonial');
      expect(createRes.body.learners).toHaveLength(2);
      expect(createRes.body.objectives).toHaveLength(2);
      expect(createRes.body.status).toBe('PLANNED');

      const lessonId = createRes.body.id;

      // 2. Query lessons with filters (subjectId, date, learnerId)
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/lessons?subjectId=${subject1Id}&date=2026-09-01&learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(lessonId);

      // 3. Complete lesson with duration & notes
      const completeRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/lessons/${lessonId}/complete`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          actualDurationMinutes: 55,
          notes: 'Ótima discussão sobre as capitanias',
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.status).toBe('COMPLETED');
      expect(completeRes.body.actualDurationMinutes).toBe(55);
      expect(completeRes.body.notes).toBe('Ótima discussão sobre as capitanias');
      expect(completeRes.body.completedAt).toBeDefined();

      // 4. Reschedule lesson
      const rescheduleRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/lessons/${lessonId}/reschedule`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          newDate: '2026-09-03',
          startTime: '10:00',
          endTime: '11:00',
          reason: 'Visita ao museu remarcada',
        });

      expect(rescheduleRes.status).toBe(200);
      expect(rescheduleRes.body.date).toBe('2026-09-03');
      expect(rescheduleRes.body.startTime).toBe('10:00');
      expect(rescheduleRes.body.status).toBe('POSTPONED');

      // 5. Delete / Archive lesson
      const deleteRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify deletion in list
      const listAfterDelete = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/lessons`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listAfterDelete.status).toBe(200);
      expect(listAfterDelete.body).toHaveLength(0);
    });
  });

  describe('Weekly Routine & Daily Agenda Flow', () => {
    it('creates routine slots, queries slots, checks daily agenda consolidation, and deletes routine slots', async () => {
      // 1. Create routine slot (e.g. Tuesday at 08:00 - 2026-09-01 is Tuesday: dayOfWeek = 2)
      const createSlotRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/schedule/slots`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          dayOfWeek: 2, // Tuesday
          startTime: '08:00',
          endTime: '08:45',
          title: 'Devocional Matinal',
          learnerId: learner1Id,
          color: '#10B981',
        });

      expect(createSlotRes.status).toBe(201);
      expect(createSlotRes.body.title).toBe('Devocional Matinal');
      expect(createSlotRes.body.dayOfWeek).toBe(2);

      const slotId = createSlotRes.body.id;

      // 2. Query routine slots with filters
      const listSlotsRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/schedule/slots?dayOfWeek=2&learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listSlotsRes.status).toBe(200);
      expect(listSlotsRes.body).toHaveLength(1);
      expect(listSlotsRes.body[0].id).toBe(slotId);

      // 3. Create a scheduled lesson on 2026-09-01 (Tuesday) at 09:00
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/lessons`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          title: 'Aula de Matemática',
          subjectId: subject1Id,
          date: '2026-09-01',
          startTime: '09:00',
          endTime: '10:00',
          learnerIds: [learner1Id],
        })
        .expect(201);

      // 4. Query daily agenda on 2026-09-01 consolidating routine slots + scheduled lessons
      const agendaRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/schedule/agenda?date=2026-09-01&learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(agendaRes.status).toBe(200);
      expect(agendaRes.body.date).toBe('2026-09-01');
      expect(agendaRes.body.dayOfWeek).toBe(2);
      expect(agendaRes.body.items).toHaveLength(2);

      // Check chronological ordering: 08:00 routine slot first, 09:00 lesson second
      expect(agendaRes.body.items[0].type).toBe('ROUTINE_SLOT');
      expect(agendaRes.body.items[0].title).toBe('Devocional Matinal');
      expect(agendaRes.body.items[0].startTime).toBe('08:00');

      expect(agendaRes.body.items[1].type).toBe('LESSON');
      expect(agendaRes.body.items[1].title).toBe('Aula de Matemática');
      expect(agendaRes.body.items[1].startTime).toBe('09:00');

      // 5. Delete routine slot
      const deleteSlotRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/schedule/slots/${slotId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(deleteSlotRes.status).toBe(200);
      expect(deleteSlotRes.body.success).toBe(true);

      // Verify slot deletion
      const listSlotsAfterDelete = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/schedule/slots`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listSlotsAfterDelete.status).toBe(200);
      expect(listSlotsAfterDelete.body).toHaveLength(0);
    });
  });
});
