import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { LearnerRepository } from './infrastructure/learner.repository.js';
import { LearnerService } from './application/learner.service.js';
import { LEARNERS_PUBLIC_API } from './application/public-api.js';
import { LearnerController } from './presentation/learner.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LearnerController],
  providers: [
    LearnerRepository,
    LearnerService,
    {
      provide: LEARNERS_PUBLIC_API,
      useExisting: LearnerService,
    },
  ],
  exports: [LEARNERS_PUBLIC_API, LearnerService],
})
export class LearnersModule {}
