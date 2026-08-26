import type {
  CreateLessonPlanDto,
  LessonPlanResponseDto,
} from '@aletheia/contracts';

export const LESSON_PLAN_PUBLIC_API = Symbol('LESSON_PLAN_PUBLIC_API');

export interface LessonPlanPublicApi {
  createLessonPlan(familyId: string, dto: CreateLessonPlanDto): Promise<LessonPlanResponseDto>;
  getLessonPlan(familyId: string, id: string): Promise<LessonPlanResponseDto>;
  listLessonPlans(familyId: string): Promise<LessonPlanResponseDto[]>;
}
