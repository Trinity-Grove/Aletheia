import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildTextTransmissionSeedData,
  buildTextTransmissionDomainDto,
  buildTextTransmissionPathDto,
  buildTextTransmissionCompetencyDto,
} from './biblical-formation-text-transmission.seed-data.js';

export interface TextTransmissionSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Transmissão do Texto Bíblico e Formação do Cânon"
// LearningPath (issue #253) under the existing FAITH.BIBLICAL_FORMATION
// LearningDomain (PR #131) -- same pattern as
// BiblicalFormationOriginalLanguagesLiteracySeeder, including the
// defensive/idempotent domain handling: if the domain already exists
// (the normal case), it's found and left untouched; if this seeder
// happens to run first on a fresh database, it creates the domain
// using the exact same seed BiblicalFormationSeeder uses, so run order
// never matters.
@Injectable()
export class BiblicalFormationTextTransmissionSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<TextTransmissionSeedResult> {
    const data = buildTextTransmissionSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildTextTransmissionDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildTextTransmissionPathDto(data.path, domain.id),
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
        buildTextTransmissionCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
