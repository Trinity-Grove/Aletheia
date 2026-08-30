import { Module } from '@nestjs/common';
import { FamiliesModule } from '../families/families.module.js';
import { LearnersModule } from '../learners/learners.module.js';
import { LessonsModule } from '../lessons/lessons.module.js';
import { DashboardService } from './application/dashboard.service.js';
import { DashboardController } from './presentation/dashboard.controller.js';

@Module({
  imports: [FamiliesModule, LearnersModule, LessonsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
