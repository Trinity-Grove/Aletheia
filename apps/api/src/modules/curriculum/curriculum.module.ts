import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { CurriculumRepository } from './infrastructure/curriculum.repository.js';
import { ObjectiveRepository } from './infrastructure/objective.repository.js';
import { CurriculumTemplateEngine } from './infrastructure/curriculum-template.engine.js';
import { CurriculumService } from './application/curriculum.service.js';
import { ObjectiveService } from './application/objective.service.js';
import { CURRICULUM_PUBLIC_API } from './application/public-api.js';
import { CurriculumController } from './presentation/curriculum.controller.js';
import { ObjectiveController } from './presentation/objective.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CurriculumController, ObjectiveController],
  providers: [
    CurriculumRepository,
    ObjectiveRepository,
    CurriculumTemplateEngine,
    CurriculumService,
    ObjectiveService,
    {
      provide: CURRICULUM_PUBLIC_API,
      useExisting: CurriculumService,
    },
  ],
  exports: [CURRICULUM_PUBLIC_API, CurriculumService, ObjectiveService],
})
export class CurriculumModule {}
