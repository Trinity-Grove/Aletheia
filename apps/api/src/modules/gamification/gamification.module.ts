import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { GamificationService } from './application/gamification.service.js';
import { GAMIFICATION_PUBLIC_API } from './application/public-api.js';
import { LearnerBadgeRepository } from './infrastructure/learner-badge.repository.js';
import { LearnerBadgesController } from './presentation/learner-badges.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LearnerBadgesController],
  providers: [
    LearnerBadgeRepository,
    GamificationService,
    { provide: GAMIFICATION_PUBLIC_API, useExisting: GamificationService },
  ],
  exports: [GAMIFICATION_PUBLIC_API],
})
export class GamificationModule {}
