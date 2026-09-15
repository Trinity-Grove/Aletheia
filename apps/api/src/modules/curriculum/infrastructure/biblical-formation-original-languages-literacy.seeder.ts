import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildOriginalLanguagesLiteracySeedData,
  buildOriginalLanguagesLiteracyDomainDto,
  buildOriginalLanguagesLiteracyPathDto,
  buildOriginalLanguagesLiteracyCompetencyDto,
} from './biblical-formation-original-languages-literacy.seed-data.js';

export interface OriginalLanguagesLiteracySeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Alfabetização em Idiomas Originais" LearningPath
// (FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY) under the
// existing FAITH.BIBLICAL_FORMATION LearningDomain (PR #131) --
// issue #96 section 17, scoped to introductory literacy/awareness only
// (see the seed-data file header for the full licensing research and
// scope boundary vs. the full `BiblicalTextSource` roadmap feature).
// Same pattern as CookingProgressionSeeder / BiblicalFormationIntermediateSeeder.
//
// Domain handling is defensive/idempotent: if FAITH.BIBLICAL_FORMATION
// already exists (the normal case), it's found and left untouched; if
// this seeder happens to run first on a fresh database, it creates the
// domain using the exact same seed BiblicalFormationSeeder uses, so run
// order never matters.
@Injectable()
export class BiblicalFormationOriginalLanguagesLiteracySeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<OriginalLanguagesLiteracySeedResult> {
    const data = buildOriginalLanguagesLiteracySeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildOriginalLanguagesLiteracyDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildOriginalLanguagesLiteracyPathDto(data.path, domain.id),
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
        buildOriginalLanguagesLiteracyCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
