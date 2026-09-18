import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { JurisdictionDefinitionsRepository } from './infrastructure/jurisdiction-definitions.repository.js';
import { JurisdictionDefinitionSeeder } from './infrastructure/jurisdiction-definition.seeder.js';
import { JurisdictionDefinitionsService } from './application/jurisdiction-definitions.service.js';
import { JurisdictionDefinitionsController } from './presentation/jurisdiction-definitions.controller.js';
import { ComplianceEvaluationService } from './application/compliance-evaluation.service.js';
import { ComplianceEvaluationController } from './presentation/compliance-evaluation.controller.js';

// Versioned jurisdiction/compliance catalog & evaluation engine (issue #26).
// Standalone module, same Definition/Version pattern as curriculum's
// DefinitionsService/Controller, kept separate because this is compliance/legal
// with its own lifecycle and no shared state with CurriculumModule.
@Module({
  imports: [DatabaseModule],
  controllers: [JurisdictionDefinitionsController, ComplianceEvaluationController],
  providers: [
    JurisdictionDefinitionsRepository,
    JurisdictionDefinitionSeeder,
    JurisdictionDefinitionsService,
    ComplianceEvaluationService,
  ],
  exports: [JurisdictionDefinitionsService, JurisdictionDefinitionSeeder, ComplianceEvaluationService],
})
export class JurisdictionsModule {}
