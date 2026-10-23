import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildTriviumFormationCompetencyDto,
  buildTriviumFormationDomainDto,
  buildTriviumFormationPathDto,
  buildTriviumFormationSeedData,
} from './trivium-formation.seed-data.js';

export interface TriviumFormationSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

@Injectable()
export class TriviumFormationSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<TriviumFormationSeedResult> {
    const data = buildTriviumFormationSeedData();
    const domains = await this.definitionsService.listLearningDomains();
    let domain = domains.find((item) => item.code === data.domain.code && item.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildTriviumFormationDomainDto(data.domain));
      domainCreated = true;
    }
    if (domain.status !== 'PUBLISHED') {
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
    }

    const paths = await this.definitionsService.listLearningPaths();
    const pathsByCode = new Map(paths.filter((item) => item.version === 1).map((item) => [item.code, item]));
    const competencies = await this.definitionsService.listCompetencyDefinitions();
    const competenciesByCode = new Map(
      competencies.filter((item) => item.version === 1).map((item) => [item.code, item]),
    );

    let pathsCreated = 0;
    let competenciesCreated = 0;

    for (const pathSeed of data.paths) {
      let path = pathsByCode.get(pathSeed.code);
      if (!path) {
        path = await this.definitionsService.createLearningPath(
          buildTriviumFormationPathDto(pathSeed, domain.id),
        );
        pathsCreated += 1;
      }
      if (path.status !== 'PUBLISHED') {
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
      }

      for (const competencySeed of pathSeed.competencies) {
        let competency = competenciesByCode.get(competencySeed.code);
        if (!competency) {
          competency = await this.definitionsService.createCompetencyDefinition(
            buildTriviumFormationCompetencyDto(competencySeed, domain.id, path.id),
          );
          competenciesCreated += 1;
        }
        if (competency.status !== 'PUBLISHED') {
          await this.definitionsService.transitionCompetencyDefinitionStatus(competency.id, 'PUBLISHED');
        }
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
