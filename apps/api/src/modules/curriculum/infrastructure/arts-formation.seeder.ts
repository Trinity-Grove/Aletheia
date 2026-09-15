import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildArtsFormationCompetencyDto,
  buildArtsFormationDomainDto,
  buildArtsFormationPathDto,
  buildArtsFormationSeedData,
} from './arts-formation.seed-data.js';

export interface ArtsFormationSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

/** Publishes the issue #95 section 14 Arts -> Foundations catalog idempotently. */
@Injectable()
export class ArtsFormationSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<ArtsFormationSeedResult> {
    const data = buildArtsFormationSeedData();
    const domains = await this.definitionsService.listLearningDomains();
    let domain = domains.find((item) => item.code === data.domain.code && item.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildArtsFormationDomainDto(data.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const paths = await this.definitionsService.listLearningPaths();
    let path = paths.find((item) => item.code === data.path.code && item.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(buildArtsFormationPathDto(data.path, domain.id));
      await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
      pathCreated = true;
    }

    const competencies = await this.definitionsService.listCompetencyDefinitions();
    const existingCodes = new Set(competencies.filter((item) => item.version === 1).map((item) => item.code));
    let competenciesCreated = 0;
    for (const competency of data.competencies) {
      if (existingCodes.has(competency.code)) continue;
      const created = await this.definitionsService.createCompetencyDefinition(
        buildArtsFormationCompetencyDto(competency, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
