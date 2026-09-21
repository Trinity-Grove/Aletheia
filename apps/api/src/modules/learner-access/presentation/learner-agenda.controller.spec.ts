import { ForbiddenException } from '@nestjs/common';
import { LearnerAgendaController } from './learner-agenda.controller.js';
import type {
  LessonPlanResponseDto,
  DailyAgendaDto,
} from '@aletheia/contracts';
import type { SchedulePublicApi, LessonPlanPublicApi } from '../../lessons/application/public-api.js';
import type { ComplianceReportsPublicApi } from '../../reports/application/public-api.js';
import type { LearningRecordsPublicApi } from '../../records/application/public-api.js';

describe('LearnerAgendaController', () => {
  let controller: LearnerAgendaController;
  let scheduleApi: jest.Mocked<SchedulePublicApi>;
  let lessonPlanApi: jest.Mocked<LessonPlanPublicApi>;
  let reportsApi: jest.Mocked<ComplianceReportsPublicApi>;
  let recordsApi: jest.Mocked<LearningRecordsPublicApi>;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const LEARNER_ID = '22222222-2222-4222-8222-222222222222';
  const LESSON_ID = '33333333-3333-4333-8333-333333333333';
  const SUBJECT_ID = '44444444-4444-4444-8444-444444444444';
  const ACADEMIC_YEAR_ID = '55555555-5555-4555-8555-555555555555';
  const OBJECTIVE_ID = '66666666-6666-4666-8666-666666666666';

  const mockRequest = {
    learner: {
      learnerId: LEARNER_ID,
      familyId: FAMILY_ID,
    },
  };

  const mockParams = {
    learnerId: LEARNER_ID,
    lessonId: LESSON_ID,
  };

  const mockLesson: LessonPlanResponseDto = {
    id: LESSON_ID,
    familyId: FAMILY_ID,
    academicYearId: ACADEMIC_YEAR_ID,
    subjectId: SUBJECT_ID,
    title: 'Matemática - Frações',
    description: 'Introdução a frações equivalentes',
    date: '2026-09-21',
    durationMinutes: 60,
    actualDurationMinutes: null,
    status: 'PLANNED',
    materials: null,
    homework: null,
    notes: null,
    completedAt: null,
    learners: [
      {
        id: 'lpl-1',
        lessonPlanId: LESSON_ID,
        learnerId: LEARNER_ID,
        completed: false,
      },
    ],
    objectives: [
      {
        id: 'lpo-1',
        lessonPlanId: LESSON_ID,
        objectiveId: OBJECTIVE_ID,
        title: 'Compreender frações',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCompletedLesson: LessonPlanResponseDto = {
    ...mockLesson,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    learners: [
      {
        id: 'lpl-1',
        lessonPlanId: LESSON_ID,
        learnerId: LEARNER_ID,
        completed: true,
      },
    ],
  };

  beforeEach(() => {
    scheduleApi = {
      getDailyAgenda: jest.fn(),
    } as unknown as jest.Mocked<SchedulePublicApi>;

    lessonPlanApi = {
      getLessonPlan: jest.fn(),
      completeLesson: jest.fn(),
      createLessonPlan: jest.fn(),
      listLessonPlans: jest.fn(),
      reopenLesson: jest.fn(),
    } as unknown as jest.Mocked<LessonPlanPublicApi>;

    reportsApi = {
      logAttendance: jest.fn(),
      listAttendance: jest.fn(),
      getComplianceSummary: jest.fn(),
      upsertComplianceRequirement: jest.fn(),
      listComplianceRequirements: jest.fn(),
      generateReport: jest.fn(),
      getReport: jest.fn(),
      listReports: jest.fn(),
    } as unknown as jest.Mocked<ComplianceReportsPublicApi>;

    recordsApi = {
      createRecord: jest.fn(),
      getRecord: jest.fn(),
      listRecords: jest.fn(),
      getProgressSummary: jest.fn(),
      deleteByLessonPlanId: jest.fn(),
    } as unknown as jest.Mocked<LearningRecordsPublicApi>;

    controller = new LearnerAgendaController(
      scheduleApi,
      lessonPlanApi,
      reportsApi,
      recordsApi,
    );
  });

  describe('getAgenda', () => {
    it('delegates to scheduleApi.getDailyAgenda with provided or today date', async () => {
      const mockAgenda: DailyAgendaDto = {
        date: '2026-09-21',
        dayOfWeek: 1,
        items: [],
      };
      scheduleApi.getDailyAgenda.mockResolvedValue(mockAgenda);

      const result = await controller.getAgenda({ learnerId: LEARNER_ID }, '2026-09-21', mockRequest);

      expect(scheduleApi.getDailyAgenda).toHaveBeenCalledWith(FAMILY_ID, '2026-09-21', LEARNER_ID);
      expect(result).toBe(mockAgenda);
    });
  });

  describe('completeLesson', () => {
    it('Test 1: marks lesson complete and creates an incremental LearningRecord when none exists', async () => {
      lessonPlanApi.getLessonPlan.mockResolvedValue(mockLesson);
      lessonPlanApi.completeLesson.mockResolvedValue(mockCompletedLesson);
      recordsApi.listRecords.mockResolvedValue([]);
      recordsApi.createRecord.mockResolvedValue({ id: 'rec-1' } as never);
      reportsApi.listAttendance.mockResolvedValue([]);
      reportsApi.logAttendance.mockResolvedValue({ id: 'att-1' } as never);

      const result = await controller.completeLesson(mockParams, mockRequest);

      expect(lessonPlanApi.completeLesson).toHaveBeenCalledWith(
        FAMILY_ID,
        LESSON_ID,
        {},
        LEARNER_ID,
      );
      expect(recordsApi.listRecords).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        lessonPlanId: LESSON_ID,
      });
      expect(recordsApi.createRecord).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        subjectId: SUBJECT_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        lessonPlanId: LESSON_ID,
        type: 'PLANNED_LESSON',
        title: mockLesson.title,
        description: mockLesson.description,
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        durationMinutes: 60,
        notes: 'Atividade concluída pelo educando no portal.',
        objectiveIds: [OBJECTIVE_ID],
        evidenceItemIds: [],
      });
      expect(result).toEqual(mockCompletedLesson);
    });

    it('Test 2: does NOT duplicate LearningRecord if one already exists for that lessonPlanId', async () => {
      lessonPlanApi.getLessonPlan.mockResolvedValue(mockLesson);
      lessonPlanApi.completeLesson.mockResolvedValue(mockCompletedLesson);
      recordsApi.listRecords.mockResolvedValue([{ id: 'rec-existing' } as never]);
      reportsApi.listAttendance.mockResolvedValue([]);
      reportsApi.logAttendance.mockResolvedValue({ id: 'att-1' } as never);

      await controller.completeLesson(mockParams, mockRequest);

      expect(recordsApi.listRecords).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        lessonPlanId: LESSON_ID,
      });
      expect(recordsApi.createRecord).not.toHaveBeenCalled();
    });

    it('Test 3: logs attendance as PRESENT with isAutoLogged: true when no attendance exists for today', async () => {
      lessonPlanApi.getLessonPlan.mockResolvedValue(mockLesson);
      lessonPlanApi.completeLesson.mockResolvedValue(mockCompletedLesson);
      recordsApi.listRecords.mockResolvedValue([]);
      recordsApi.createRecord.mockResolvedValue({ id: 'rec-1' } as never);
      reportsApi.listAttendance.mockResolvedValue([]);
      reportsApi.logAttendance.mockResolvedValue({ id: 'att-1' } as never);

      await controller.completeLesson(mockParams, mockRequest);

      const completionDate = new Date().toISOString().slice(0, 10);
      expect(reportsApi.listAttendance).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        startDate: completionDate,
        endDate: completionDate,
      });
      expect(reportsApi.logAttendance).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        date: completionDate,
        status: 'PRESENT',
        hoursSpent: 1, // 60 minutes / 60 = 1 hour
        isAutoLogged: true,
        notes: 'Presença registrada automaticamente pela conclusão de atividade na agenda.',
      });
    });

    it('Test 4: accumulates hoursSpent when existing attendance for today has isAutoLogged: true and status: PRESENT', async () => {
      lessonPlanApi.getLessonPlan.mockResolvedValue(mockLesson);
      lessonPlanApi.completeLesson.mockResolvedValue(mockCompletedLesson);
      recordsApi.listRecords.mockResolvedValue([]);
      recordsApi.createRecord.mockResolvedValue({ id: 'rec-1' } as never);

      const completionDate = new Date().toISOString().slice(0, 10);
      const existingAttendance = {
        id: 'att-existing',
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        date: completionDate,
        status: 'PRESENT' as const,
        hoursSpent: 1.5,
        notes: 'Presença prévia acumulada',
        isAutoLogged: true,
      };
      reportsApi.listAttendance.mockResolvedValue([existingAttendance as never]);
      reportsApi.logAttendance.mockResolvedValue({ id: 'att-updated' } as never);

      await controller.completeLesson(mockParams, mockRequest);

      expect(reportsApi.logAttendance).toHaveBeenCalledWith(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        date: completionDate,
        status: 'PRESENT',
        hoursSpent: 2.5, // 1.5 + 1.0 = 2.5
        isAutoLogged: true,
        notes: 'Presença prévia acumulada',
      });
    });

    it('Test 5: does NOT overwrite attendance when existing attendance has isAutoLogged: false (parent manual override, e.g. UNEXCUSED_ABSENCE)', async () => {
      lessonPlanApi.getLessonPlan.mockResolvedValue(mockLesson);
      lessonPlanApi.completeLesson.mockResolvedValue(mockCompletedLesson);
      recordsApi.listRecords.mockResolvedValue([]);
      recordsApi.createRecord.mockResolvedValue({ id: 'rec-1' } as never);

      const completionDate = new Date().toISOString().slice(0, 10);
      const manualAttendance = {
        id: 'att-manual',
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        date: completionDate,
        status: 'UNEXCUSED_ABSENCE' as const,
        hoursSpent: 0,
        notes: 'Falta registrada pelo responsável',
        isAutoLogged: false,
      };
      reportsApi.listAttendance.mockResolvedValue([manualAttendance as never]);

      await controller.completeLesson(mockParams, mockRequest);

      expect(reportsApi.logAttendance).not.toHaveBeenCalled();
    });

    it('Test 6: throws ForbiddenException when lesson is not assigned to the learner', async () => {
      const unassignedLesson: LessonPlanResponseDto = {
        ...mockLesson,
        learners: [
          {
            id: 'lpl-other',
            lessonPlanId: LESSON_ID,
            learnerId: '99999999-9999-4999-8999-999999999999',
            completed: false,
          },
        ],
      };
      lessonPlanApi.getLessonPlan.mockResolvedValue(unassignedLesson);

      await expect(controller.completeLesson(mockParams, mockRequest)).rejects.toThrow(ForbiddenException);
      expect(lessonPlanApi.completeLesson).not.toHaveBeenCalled();
      expect(recordsApi.createRecord).not.toHaveBeenCalled();
      expect(reportsApi.logAttendance).not.toHaveBeenCalled();
    });
  });
});
