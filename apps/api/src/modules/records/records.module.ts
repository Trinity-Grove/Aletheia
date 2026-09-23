import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { LearningRecordRepository } from './infrastructure/learning-record.repository.js';
import { PortfolioRepository } from './infrastructure/portfolio.repository.js';
import { LearningRecordService } from './application/learning-record.service.js';
import { PortfolioService } from './application/portfolio.service.js';
import { PortfolioRetentionService } from './application/portfolio-retention.service.js';
import { LEARNING_RECORDS_PUBLIC_API } from './application/public-api.js';
import { LearningRecordController } from './presentation/learning-record.controller.js';
import { PortfolioController } from './presentation/portfolio.controller.js';

@Module({
  // CurriculumModule (issue #230): PortfolioService promotes a validated
  // EvidenceSubmission into a PortfolioItem via
  // EVIDENCE_SUBMISSION_PUBLIC_API -- CurriculumModule never imports
  // RecordsModule back, so no cycle.
  imports: [DatabaseModule, StorageModule, CurriculumModule],
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
