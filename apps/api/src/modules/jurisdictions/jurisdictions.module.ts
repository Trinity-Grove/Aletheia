import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { JurisdictionDefinitionsRepository } from './infrastructure/jurisdiction-definitions.repository.js';
import { JurisdictionDefinitionSeeder } from './infrastructure/jurisdiction-definition.seeder.js';
import { JurisdictionDefinitionsService } from './application/jurisdiction-definitions.service.js';
import { JurisdictionDefinitionsController } from './presentation/jurisdiction-definitions.controller.js';

// Versioned jurisdiction/compliance catalog (issue #26, "Brasil como
// organizador/complemento" first slice). Standalone module, same
// Definition/Version pattern as curriculum's DefinitionsService/Controller,
// kept separate because this is a new category (compliance, not pedagogy)
// with its own lifecycle and no shared state with CurriculumModule.
@Module({
  imports: [DatabaseModule],
  controllers: [JurisdictionDefinitionsController],
  providers: [JurisdictionDefinitionsRepository, JurisdictionDefinitionSeeder, JurisdictionDefinitionsService],
  exports: [JurisdictionDefinitionsService, JurisdictionDefinitionSeeder],
})
export class JurisdictionsModule {}
