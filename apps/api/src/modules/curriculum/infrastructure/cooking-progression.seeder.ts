import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildCookingProgressionSeedData,
  buildCookingProgressionDomainDto,
  buildCookingProgressionPathDto,
  buildCookingProgressionCompetencyDto,
} from './cooking-progression.seed-data.js';

export interface CookingProgressionSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Progressão" LearningPath (COOKING.PROGRESSION) under the
// existing `COOKING` LearningDomain (PR #135). Same pattern as
// CookingFormationSeeder and the ResilienceWaterFireSeeder /
// ResilienceNavigationCampingSeeder sibling-path seeders.
//
// Domain handling is defensive/idempotent: if `COOKING` already exists
// (the normal case, since CookingFormationSeeder runs first in every
// real deployment), it's found and left untouched; if this seeder
// happens to run first on a fresh database, it creates the domain using
// the exact same seed CookingFormationSeeder uses, so run order never
// matters.
@Injectable()
export class CookingProgressionSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<CookingProgressionSeedResult> {
    const data = buildCookingProgressionSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildCookingProgressionDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildCookingProgressionPathDto(data.path, domain.id),
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
        buildCookingProgressionCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
