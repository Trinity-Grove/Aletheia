import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildGardeningProductionSeedData,
  buildGardeningProductionDomainDto,
  buildGardeningProductionPathDto,
  buildGardeningProductionCompetencyDto,
} from './gardening-production.seed-data.js';

export interface GardeningProductionSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Produção" LearningPath under the existing `GARDENING`
// LearningDomain (PR #136). First of 2 sibling seeders covering issue #95
// section 19's remaining three subsections -- see
// gardening-production.seed-data.ts for the full rationale.
//
// Domain handling is defensive/idempotent, same as every seeder in this
// file group: if `GARDENING` already exists, it's found and left
// untouched; if this seeder happens to run first on a fresh database, it
// creates the domain using the exact same seed GardeningFormationSeeder
// uses, so run order never matters.
@Injectable()
export class GardeningProductionSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<GardeningProductionSeedResult> {
    const data = buildGardeningProductionSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildGardeningProductionDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildGardeningProductionPathDto(data.path, domain.id),
      );
      await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
      pathCreated = true;
    }

    const existingCompetencies = await this.definitionsService.listCompetencyDefinitions();
    const existingCompetencyCodes = new Set(
      existingCompetencies.filter((c) => c.version === 1).map((c) => c.code),
    );
    let competenciesCreated = 0;
    for (const competencySeed of data.competencies) {
      if (existingCompetencyCodes.has(competencySeed.code)) continue;
      const created = await this.definitionsService.createCompetencyDefinition(
        buildGardeningProductionCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
