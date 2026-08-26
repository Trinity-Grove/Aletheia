import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { LearningRecordRepository } from './infrastructure/learning-record.repository.js';
import { PortfolioRepository } from './infrastructure/portfolio.repository.js';
import { LearningRecordService } from './application/learning-record.service.js';
import { PortfolioService } from './application/portfolio.service.js';
import { LEARNING_RECORDS_PUBLIC_API } from './application/public-api.js';
import { LearningRecordController } from './presentation/learning-record.controller.js';
import { PortfolioController } from './presentation/portfolio.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LearningRecordController, PortfolioController],
  providers: [
    LearningRecordRepository,
    PortfolioRepository,
    LearningRecordService,
    PortfolioService,
    {
      provide: LEARNING_RECORDS_PUBLIC_API,
      useExisting: LearningRecordService,
    },
  ],
  exports: [LEARNING_RECORDS_PUBLIC_API, LearningRecordService, PortfolioService],
})
export class RecordsModule {}
