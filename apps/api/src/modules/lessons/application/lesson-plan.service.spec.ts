import { LessonPlanService } from './lesson-plan.service.js';
import { LessonPlanEntity, LessonPlanLearnerEntity, LessonPlanObjectiveEntity } from '../domain/lesson-plan.entity.js';
import { NotFoundException } from '@nestjs/common';

describe('LessonPlanService', () => {
  let service: LessonPlanService;
  let lessonPlanRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LESSON_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const LEARNER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const SUBJECT_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  const mockLessonEntity = (override: Partial<any> = {}) =>
    new LessonPlanEntity(
      override.id ?? LESSON_ID,
      override.familyId ?? FAMILY_ID,
      override.academicYearId ?? null,
      override.subjectId ?? SUBJECT_ID,
      override.title ?? 'Math Lesson: Fractions',
      override.description ?? 'Introduction to fractions',
      override.date ?? new Date('2026-08-26'),
      override.startTime ?? '09:00',
      override.endTime ?? '10:00',
      override.durationMinutes ?? 60,
      override.actualDurationMinutes ?? null,
      override.status ?? 'PLANNED',
      override.materials ?? 'Worksheet',
      override.homework ?? null,
      override.notes ?? null,
      override.completedAt ?? null,
      override.createdAt ?? new Date('2026-08-26T00:00:00Z'),
      override.updatedAt ?? new Date('2026-08-26T00:00:00Z'),
      override.learners ?? [
        new LessonPlanLearnerEntity('lpl-1', LESSON_ID, LEARNER_ID, null, false, new Date(), 'Alice'),
      ],
      override.objectives ?? [
        new LessonPlanObjectiveEntity('lpo-1', LESSON_ID, 'obj-1', new Date(), 'Understand fractions'),
      ],
      override.subjectName ?? 'Matemática',
      override.subjectColor ?? '#3B82F6',
    );

  beforeEach(() => {
    lessonPlanRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          mockLessonEntity({
            familyId,
            title: dto.title,
            subjectId: dto.subjectId,
            date: new Date(dto.date),
          }),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) => {
        if (id === LESSON_ID) return Promise.resolve(mockLessonEntity({ familyId }));
        return Promise.resolve(null);
      }),
      list: jest.fn().mockResolvedValue([mockLessonEntity()]),
      update: jest.fn().mockImplementation((familyId, id, dto) => {
        if (id === LESSON_ID) {
          return Promise.resolve(
            mockLessonEntity({
              familyId,
              title: dto.title ?? 'Updated Title',
            }),
          );
        }
        return Promise.resolve(null);
      }),
      completeLesson: jest.fn().mockImplementation((familyId, id, params) => {
        if (id === LESSON_ID) {
          return Promise.resolve(
            mockLessonEntity({
              familyId,
              status: params.learnerId ? 'IN_PROGRESS' : 'COMPLETED',
              completedAt: params.completedAt ?? new Date(),
              actualDurationMinutes: params.actualDurationMinutes ?? 55,
              notes: params.notes ?? 'Great lesson',
              learners: [
                new LessonPlanLearnerEntity(
                  'lpl-1',
                  LESSON_ID,
                  LEARNER_ID,
                  params.notes ?? null,
                  true,
                  new Date(),
                  'Alice',
                ),
              ],
            }),
          );
        }
        return Promise.resolve(null);
      }),
      reschedule: jest.fn().mockImplementation((familyId, id, params) => {
        if (id === LESSON_ID) {
          return Promise.resolve(
            mockLessonEntity({
              familyId,
              date: new Date(params.newDate),
              status: 'POSTPONED',
              notes: `[Reagendado para ${params.newDate}]: ${params.reason}`,
            }),
          );
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockImplementation((familyId, id) => Promise.resolve(id === LESSON_ID)),
    };

    service = new LessonPlanService(lessonPlanRepo);
  });

  describe('createLessonPlan', () => {
    it('creates and returns a serialized lesson plan scoped by familyId', async () => {
      const res = await service.createLessonPlan(FAMILY_ID, {
        subjectId: SUBJECT_ID,
        title: 'Math Lesson: Fractions',
        date: '2026-08-26',
        learnerIds: [LEARNER_ID],
      });

      expect(lessonPlanRepo.create).toHaveBeenCalledWith(FAMILY_ID, expect.any(Object));
      expect(res.id).toBe(LESSON_ID);
      expect(res.familyId).toBe(FAMILY_ID);
      expect(res.title).toBe('Math Lesson: Fractions');
      expect(res.status).toBe('PLANNED');
      expect(res.learners).toHaveLength(1);
    });
  });

  describe('getLessonPlan', () => {
    it('returns lesson plan when found', async () => {
      const res = await service.getLessonPlan(FAMILY_ID, LESSON_ID);
      expect(res.id).toBe(LESSON_ID);
      expect(lessonPlanRepo.findById).toHaveBeenCalledWith(FAMILY_ID, LESSON_ID);
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.getLessonPlan(FAMILY_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listLessonPlans', () => {
    it('lists lesson plans scoped by family', async () => {
      const res = await service.listLessonPlans(FAMILY_ID, { date: '2026-08-26' });
      expect(res).toHaveLength(1);
      expect(lessonPlanRepo.list).toHaveBeenCalledWith(FAMILY_ID, { date: '2026-08-26' });
    });
  });

  describe('updateLessonPlan', () => {
    it('updates lesson plan fields', async () => {
      const res = await service.updateLessonPlan(FAMILY_ID, LESSON_ID, {
        title: 'Updated Math',
      });
      expect(res.title).toBe('Updated Math');
      expect(lessonPlanRepo.update).toHaveBeenCalledWith(FAMILY_ID, LESSON_ID, {
        title: 'Updated Math',
      });
    });

    it('throws NotFoundException if lesson to update is not found', async () => {
      await expect(
        service.updateLessonPlan(FAMILY_ID, 'non-existent', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeLesson', () => {
    it('marks entire lesson completed', async () => {
      const res = await service.completeLesson(FAMILY_ID, LESSON_ID, {
        actualDurationMinutes: 55,
        notes: 'Great lesson',
      });

      expect(lessonPlanRepo.completeLesson).toHaveBeenCalledWith(
        FAMILY_ID,
        LESSON_ID,
        expect.objectContaining({
          actualDurationMinutes: 55,
          notes: 'Great lesson',
        }),
      );
      expect(res.status).toBe('COMPLETED');
      expect(res.learners[0]?.completed).toBe(true);
    });

    it('marks lesson completed for specific learner', async () => {
      const res = await service.completeLesson(
        FAMILY_ID,
        LESSON_ID,
        { actualDurationMinutes: 55 },
        LEARNER_ID,
      );

      expect(lessonPlanRepo.completeLesson).toHaveBeenCalledWith(
        FAMILY_ID,
        LESSON_ID,
        expect.objectContaining({ learnerId: LEARNER_ID }),
      );
      expect(res.status).toBe('IN_PROGRESS');
    });

    it('throws NotFoundException if lesson does not exist', async () => {
      await expect(
        service.completeLesson(FAMILY_ID, 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rescheduleLesson', () => {
    it('reschedules lesson to new date and updates status to POSTPONED', async () => {
      const res = await service.rescheduleLesson(FAMILY_ID, LESSON_ID, {
        newDate: '2026-08-28',
        reason: 'Learner was sick',
      });

      expect(lessonPlanRepo.reschedule).toHaveBeenCalledWith(
        FAMILY_ID,
        LESSON_ID,
        expect.objectContaining({
          newDate: '2026-08-28',
          reason: 'Learner was sick',
        }),
      );
      expect(res.status).toBe('POSTPONED');
      expect(res.date).toBe('2026-08-28');
    });

    it('throws NotFoundException if lesson does not exist', async () => {
      await expect(
        service.rescheduleLesson(FAMILY_ID, 'non-existent', { newDate: '2026-08-28' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLessonPlan', () => {
    it('deletes lesson plan', async () => {
      const res = await service.deleteLessonPlan(FAMILY_ID, LESSON_ID);
      expect(res).toBe(true);
      expect(lessonPlanRepo.delete).toHaveBeenCalledWith(FAMILY_ID, LESSON_ID);
    });

    it('throws NotFoundException when deleting non-existent lesson', async () => {
      await expect(service.deleteLessonPlan(FAMILY_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
