import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildPortugueseSubjectCompetencyDto,
  buildPortugueseSubjectDomainDto,
  buildPortugueseSubjectPathDto,
  buildPortugueseSubjectSeedData,
} from './portuguese-subject.seed-data.js';

export interface PortugueseSubjectSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

@Injectable()
export class PortugueseSubjectSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<PortugueseSubjectSeedResult> {
    const data = buildPortugueseSubjectSeedData();
    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((candidate) => candidate.code === data.domain.code && candidate.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildPortugueseSubjectDomainDto(data.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    const existingPathCodes = new Map(existingPaths.filter((path) => path.version === 1).map((path) => [path.code, path]));
    const existingCompetencies = await this.definitionsService.listCompetencyDefinitions();
    const existingCompetencyCodes = new Set(
      existingCompetencies.filter((competency) => competency.version === 1).map((competency) => competency.code),
    );

    let pathsCreated = 0;
    let competenciesCreated = 0;
    for (const pathData of data.paths) {
      let path = existingPathCodes.get(pathData.path.code);
      if (!path) {
        path = await this.definitionsService.createLearningPath(
          buildPortugueseSubjectPathDto(pathData.path, domain.id),
        );
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
        pathsCreated += 1;
      }
      for (const competencySeed of pathData.competencies) {
        if (existingCompetencyCodes.has(competencySeed.code)) continue;
        const created = await this.definitionsService.createCompetencyDefinition(
          buildPortugueseSubjectCompetencyDto(competencySeed, domain.id, path.id),
        );
        await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
        competenciesCreated += 1;
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
