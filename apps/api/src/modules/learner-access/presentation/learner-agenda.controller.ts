import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  CompleteLessonDto,
  DailyAgendaDto,
  LessonPlanResponseDto,
} from '@aletheia/contracts';
import { LearnerAccessGuard, LearnerSelfGuard } from '../../../platform/auth/index.js';
import {
  SCHEDULE_PUBLIC_API,
  LESSON_PLAN_PUBLIC_API,
  type SchedulePublicApi,
  type LessonPlanPublicApi,
} from '../../lessons/application/public-api.js';
import {
  COMPLIANCE_REPORTS_PUBLIC_API,
  type ComplianceReportsPublicApi,
} from '../../reports/application/public-api.js';
import {
  LEARNING_RECORDS_PUBLIC_API,
  type LearningRecordsPublicApi,
} from '../../records/application/public-api.js';

interface RequestWithLearner {
  learner: { learnerId: string; familyId: string };
}

// Restricted surface: today's agenda + mark-complete for the learner's own
// id only. LearnerAccessGuard rejects anything but a valid, still-enabled
// learner session; LearnerSelfGuard rejects any :learnerId route param that
// doesn't match the session's own learnerId.
@ApiTags('Learner Access (learner)')
@UseGuards(LearnerAccessGuard, LearnerSelfGuard)
@Controller({ path: 'learner-access/learners/:learnerId', version: '1' })
export class LearnerAgendaController {
  constructor(
    @Inject(SCHEDULE_PUBLIC_API)
    private readonly scheduleApi: SchedulePublicApi,
    @Inject(LESSON_PLAN_PUBLIC_API)
    private readonly lessonPlanApi: LessonPlanPublicApi,
    @Inject(COMPLIANCE_REPORTS_PUBLIC_API)
    private readonly reportsApi: ComplianceReportsPublicApi,
    @Inject(LEARNING_RECORDS_PUBLIC_API)
    private readonly recordsApi: LearningRecordsPublicApi,
  ) {}

  @Get('agenda')
  @ApiOperation({ summary: "Get the learner's own daily agenda" })
  @ApiResponse({ status: 200, description: 'Agenda for the requested (or current) date.' })
  async getAgenda(
    @Param() params: { learnerId: string },
    @Query('date') date: string | undefined,
    @Req() request: RequestWithLearner,
  ): Promise<DailyAgendaDto> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    return this.scheduleApi.getDailyAgenda(request.learner.familyId, targetDate, params.learnerId);
  }

  @Post('lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark one of the learner’s own lessons complete' })
  @ApiResponse({ status: 200, description: 'Lesson marked complete.' })
  @ApiResponse({ status: 403, description: 'The lesson is not assigned to this learner.' })
  async completeLesson(
    @Param() params: { learnerId: string; lessonId: string },
    @Req() reqOrDto: RequestWithLearner,
    @Body() dtoOrReq?: CompleteLessonDto,
  ): Promise<LessonPlanResponseDto> {
    const request = ('learner' in reqOrDto ? reqOrDto : dtoOrReq) as RequestWithLearner;
    const dto = ('learner' in reqOrDto ? dtoOrReq : reqOrDto) as CompleteLessonDto | undefined;

    const lesson = await this.lessonPlanApi.getLessonPlan(request.learner.familyId, params.lessonId);
    const isAssignedToLearner = lesson.learners.some((l) => l.learnerId === params.learnerId);
    if (!isAssignedToLearner) {
      throw new ForbiddenException('This lesson is not assigned to you.');
    }

    const completionDate = new Date().toISOString().slice(0, 10);
    const completed = await this.lessonPlanApi.completeLesson(
      request.learner.familyId,
      params.lessonId,
      dto ?? {},
      params.learnerId,
    );

    // 1. Incremental Learning Record in Diary (Idempotent)
    const existingRecords = await this.recordsApi.listRecords(request.learner.familyId, {
      learnerId: params.learnerId,
      lessonPlanId: params.lessonId,
    });

    if (existingRecords.length === 0) {
      const duration = lesson.actualDurationMinutes ?? lesson.durationMinutes ?? 45;
      const objectiveIds = (lesson as any).objectiveIds ?? lesson.objectives?.map((o) => o.objectiveId) ?? [];
      await this.recordsApi.createRecord(request.learner.familyId, {
        learnerId: params.learnerId,
        subjectId: lesson.subjectId,
        academicYearId: lesson.academicYearId,
        lessonPlanId: lesson.id,
        type: 'PLANNED_LESSON',
        title: lesson.title,
        description: lesson.description,
        date: completionDate,
        durationMinutes: duration,
        notes: dto?.notes ?? 'Atividade concluída pelo educando no portal.',
        objectiveIds,
        evidenceItemIds: [],
      });
    }

    // 2. Automated Daily Attendance (Preserving Manual Parent Overrides)
    const existingAttendance = await this.reportsApi.listAttendance(request.learner.familyId, {
      learnerId: params.learnerId,
      startDate: completionDate,
      endDate: completionDate,
    });

    const lessonHours = Math.round(((lesson.actualDurationMinutes ?? lesson.durationMinutes ?? 45) / 60) * 100) / 100;

    if (existingAttendance.length === 0) {
      await this.reportsApi.logAttendance(request.learner.familyId, {
        learnerId: params.learnerId,
        academicYearId: lesson.academicYearId,
        date: completionDate,
        status: 'PRESENT',
        hoursSpent: lessonHours,
        isAutoLogged: true,
        notes: 'Presença registrada automaticamente pela conclusão de atividade na agenda.',
      });
    } else if (existingAttendance[0]?.isAutoLogged && existingAttendance[0]?.status === 'PRESENT') {
      const currentHours = existingAttendance[0].hoursSpent ?? 0;
      await this.reportsApi.logAttendance(request.learner.familyId, {
        learnerId: params.learnerId,
        academicYearId: lesson.academicYearId,
        date: completionDate,
        status: 'PRESENT',
        hoursSpent: Math.round((currentHours + lessonHours) * 100) / 100,
        isAutoLogged: true,
        notes: existingAttendance[0].notes,
      });
    }
    // Note: If existingAttendance[0].isAutoLogged === false, parent manual override is strictly preserved.

    return completed;
  }
}
