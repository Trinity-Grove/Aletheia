import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { LessonPlanRepository } from './infrastructure/lesson-plan.repository.js';
import { ScheduleRepository } from './infrastructure/schedule.repository.js';
import { LessonPlanService } from './application/lesson-plan.service.js';
import { ScheduleService } from './application/schedule.service.js';
import { LESSON_PLAN_PUBLIC_API, SCHEDULE_PUBLIC_API } from './application/public-api.js';
import { LessonPlanController } from './presentation/lesson-plan.controller.js';
import { ScheduleController } from './presentation/schedule.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LessonPlanController, ScheduleController],
  providers: [
    LessonPlanRepository,
    ScheduleRepository,
    LessonPlanService,
    ScheduleService,
    {
      provide: LESSON_PLAN_PUBLIC_API,
      useExisting: LessonPlanService,
    },
    {
      provide: SCHEDULE_PUBLIC_API,
      useExisting: ScheduleService,
    },
  ],
  exports: [LESSON_PLAN_PUBLIC_API, SCHEDULE_PUBLIC_API, LessonPlanService, ScheduleService],
})
export class LessonsModule {}
