import type {
  CompleteLessonDto,
  CreateLessonPlanDto,
  DailyAgendaDto,
  LessonPlanResponseDto,
} from '@aletheia/contracts';

export const LESSON_PLAN_PUBLIC_API = Symbol('LESSON_PLAN_PUBLIC_API');

export interface LessonPlanPublicApi {
  createLessonPlan(familyId: string, dto: CreateLessonPlanDto): Promise<LessonPlanResponseDto>;
  getLessonPlan(familyId: string, id: string): Promise<LessonPlanResponseDto>;
  listLessonPlans(familyId: string): Promise<LessonPlanResponseDto[]>;
  completeLesson(
    familyId: string,
    id: string,
    dto: CompleteLessonDto,
    learnerId?: string,
  ): Promise<LessonPlanResponseDto>;
  reopenLesson(
    familyId: string,
    id: string,
    learnerId?: string,
  ): Promise<LessonPlanResponseDto>;
}

export const SCHEDULE_PUBLIC_API = Symbol('SCHEDULE_PUBLIC_API');

export interface SchedulePublicApi {
  getDailyAgenda(familyId: string, date: string, learnerId?: string): Promise<DailyAgendaDto>;
}
