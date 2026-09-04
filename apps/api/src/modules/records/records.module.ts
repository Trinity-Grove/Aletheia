import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { LearningRecordRepository } from './infrastructure/learning-record.repository.js';
import { PortfolioRepository } from './infrastructure/portfolio.repository.js';
import { LearningRecordService } from './application/learning-record.service.js';
import { PortfolioService } from './application/portfolio.service.js';
import { PortfolioRetentionService } from './application/portfolio-retention.service.js';
import { LEARNING_RECORDS_PUBLIC_API } from './application/public-api.js';
import { LearningRecordController } from './presentation/learning-record.controller.js';
import { PortfolioController } from './presentation/portfolio.controller.js';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [LearningRecordController, PortfolioController],
  providers: [
    LearningRecordRepository,
    PortfolioRepository,
    LearningRecordService,
    PortfolioService,
    PortfolioRetentionService,
    {
      provide: LEARNING_RECORDS_PUBLIC_API,
      useExisting: LearningRecordService,
    },
  ],
  exports: [LEARNING_RECORDS_PUBLIC_API, LearningRecordService, PortfolioService, PortfolioRetentionService],
})
export class RecordsModule {}
