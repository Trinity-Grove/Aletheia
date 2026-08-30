import { ScheduleService } from './schedule.service.js';
import { ScheduleSlotEntity } from '../domain/schedule-slot.entity.js';
import { LessonPlanEntity, LessonPlanLearnerEntity } from '../domain/lesson-plan.entity.js';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LessonPlanRepository } from '../infrastructure/lesson-plan.repository.js';
import { ScheduleRepository } from '../infrastructure/schedule.repository.js';
import { SCHEDULE_PUBLIC_API, type SchedulePublicApi } from './public-api.js';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepo: any;
  let lessonPlanRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const SLOT_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const LEARNER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const LESSON_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  const mockSlotEntity = (override: Partial<any> = {}) =>
    new ScheduleSlotEntity(
      override.id ?? SLOT_ID,
      override.familyId ?? FAMILY_ID,
      override.academicYearId ?? null,
      override.subjectId ?? 'sub-1',
      override.learnerId ?? LEARNER_ID,
      override.dayOfWeek ?? 3, // Wednesday
      override.startTime ?? '08:30',
      override.endTime ?? '09:30',
      override.title ?? 'Morning Devotion & Math',
      override.description ?? null,
      override.location ?? 'Living Room',
      override.color ?? '#3B82F6',
      override.createdAt ?? new Date('2026-08-26T00:00:00Z'),
      override.updatedAt ?? new Date('2026-08-26T00:00:00Z'),
      override.subjectName ?? 'Matemática',
      override.learnerName ?? 'Alice',
    );

  const mockLessonEntity = (override: Partial<any> = {}) =>
    new LessonPlanEntity(
      override.id ?? LESSON_ID,
      override.familyId ?? FAMILY_ID,
      override.academicYearId ?? null,
      override.subjectId ?? 'sub-1',
      override.title ?? 'History: Ancient Rome',
      override.description ?? null,
      override.date ?? new Date('2026-08-26'), // Wednesday (2026-08-26 is Wednesday)
      override.startTime ?? '10:00',
      override.endTime ?? '11:00',
      override.durationMinutes ?? 60,
      override.actualDurationMinutes ?? null,
      override.status ?? 'PLANNED',
      override.materials ?? null,
      override.homework ?? null,
      override.notes ?? null,
      override.completedAt ?? null,
      override.createdAt ?? new Date('2026-08-26T00:00:00Z'),
      override.updatedAt ?? new Date('2026-08-26T00:00:00Z'),
      override.learners ?? [
        new LessonPlanLearnerEntity('lpl-1', LESSON_ID, LEARNER_ID, null, false, new Date(), 'Alice'),
      ],
      override.objectives ?? [],
      override.subjectName ?? 'História',
      override.subjectColor ?? '#EF4444',
    );

  beforeEach(() => {
    scheduleRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          mockSlotEntity({
            familyId,
            title: dto.title,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
          }),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) => {
        if (id === SLOT_ID) return Promise.resolve(mockSlotEntity({ familyId }));
        return Promise.resolve(null);
      }),
      list: jest.fn().mockResolvedValue([mockSlotEntity()]),
      update: jest.fn().mockImplementation((familyId, id, dto) => {
        if (id === SLOT_ID) {
          return Promise.resolve(
            mockSlotEntity({
              familyId,
              title: dto.title ?? 'Updated Title',
            }),
          );
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockImplementation((familyId, id) => Promise.resolve(id === SLOT_ID)),
    };

    lessonPlanRepo = {
      list: jest.fn().mockResolvedValue([mockLessonEntity()]),
    };

    service = new ScheduleService(scheduleRepo, lessonPlanRepo);
  });

  describe('createSlot', () => {
    it('creates weekly schedule slot scoped by familyId', async () => {
      const res = await service.createSlot(FAMILY_ID, {
        dayOfWeek: 3,
        startTime: '08:30',
        endTime: '09:30',
        title: 'Morning Devotion & Math',
      });

      expect(scheduleRepo.create).toHaveBeenCalledWith(FAMILY_ID, expect.any(Object));
      expect(res.id).toBe(SLOT_ID);
      expect(res.familyId).toBe(FAMILY_ID);
      expect(res.dayOfWeek).toBe(3);
    });
  });

  describe('getSlot', () => {
    it('returns schedule slot when found', async () => {
      const res = await service.getSlot(FAMILY_ID, SLOT_ID);
      expect(res.id).toBe(SLOT_ID);
      expect(scheduleRepo.findById).toHaveBeenCalledWith(FAMILY_ID, SLOT_ID);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.getSlot(FAMILY_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listSlots', () => {
    it('lists slots with multi-tenant filter', async () => {
      const res = await service.listSlots(FAMILY_ID, { dayOfWeek: 3 });
      expect(res).toHaveLength(1);
      expect(scheduleRepo.list).toHaveBeenCalledWith(FAMILY_ID, { dayOfWeek: 3 });
    });
  });

  describe('updateSlot', () => {
    it('updates slot properties', async () => {
      const res = await service.updateSlot(FAMILY_ID, SLOT_ID, { title: 'Updated Slot' });
      expect(res.title).toBe('Updated Slot');
      expect(scheduleRepo.update).toHaveBeenCalledWith(FAMILY_ID, SLOT_ID, { title: 'Updated Slot' });
    });

    it('throws NotFoundException if slot not found', async () => {
      await expect(
        service.updateSlot(FAMILY_ID, 'non-existent', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSlot', () => {
    it('deletes slot', async () => {
      const res = await service.deleteSlot(FAMILY_ID, SLOT_ID);
      expect(res).toBe(true);
      expect(scheduleRepo.delete).toHaveBeenCalledWith(FAMILY_ID, SLOT_ID);
    });

    it('throws NotFoundException if slot to delete not found', async () => {
      await expect(service.deleteSlot(FAMILY_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDailyAgenda', () => {
    it('combines routine slots (matching day of week) and scheduled lesson plans for given date', async () => {
      const agenda = await service.getDailyAgenda(FAMILY_ID, '2026-08-26', LEARNER_ID);

      expect(agenda.date).toBe('2026-08-26');
      expect(agenda.dayOfWeek).toBe(3);
      expect(scheduleRepo.list).toHaveBeenCalledWith(FAMILY_ID, {
        dayOfWeek: 3,
        learnerId: LEARNER_ID,
      });
      expect(lessonPlanRepo.list).toHaveBeenCalledWith(FAMILY_ID, {
        date: '2026-08-26',
        learnerId: LEARNER_ID,
      });

      expect(agenda.items).toHaveLength(2);
      expect(agenda.items[0]?.type).toBe('ROUTINE_SLOT');
      expect(agenda.items[0]?.startTime).toBe('08:30');
      expect(agenda.items[1]?.type).toBe('LESSON');
      expect(agenda.items[1]?.startTime).toBe('10:00');
    });

    it('correctly maps Sunday (dayOfWeek = 7)', async () => {
      scheduleRepo.list.mockResolvedValue([]);
      lessonPlanRepo.list.mockResolvedValue([]);

      const agenda = await service.getDailyAgenda(FAMILY_ID, '2026-08-30');
      expect(agenda.dayOfWeek).toBe(7);
      expect(scheduleRepo.list).toHaveBeenCalledWith(FAMILY_ID, {
        dayOfWeek: 7,
        learnerId: undefined,
      });
    });
  });

  describe('public API provider', () => {
    it('resolves the schedule service and forwards family, date, and learner arguments', async () => {
      const scheduleList = jest.fn().mockResolvedValue([]);
      const lessonPlanList = jest.fn().mockResolvedValue([]);
      const moduleRef = await Test.createTestingModule({
        providers: [
          ScheduleService,
          { provide: ScheduleRepository, useValue: { list: scheduleList } },
          { provide: LessonPlanRepository, useValue: { list: lessonPlanList } },
          { provide: SCHEDULE_PUBLIC_API, useExisting: ScheduleService },
        ],
      }).compile();

      const publicApi = moduleRef.get<SchedulePublicApi>(SCHEDULE_PUBLIC_API);
      await publicApi.getDailyAgenda(FAMILY_ID, '2026-08-26', LEARNER_ID);

      expect(publicApi).toBe(moduleRef.get(ScheduleService));
      expect(scheduleList).toHaveBeenCalledWith(FAMILY_ID, {
        dayOfWeek: 3,
        learnerId: LEARNER_ID,
      });
      expect(lessonPlanList).toHaveBeenCalledWith(FAMILY_ID, {
        date: '2026-08-26',
        learnerId: LEARNER_ID,
      });
      await moduleRef.close();
    });
  });
});
