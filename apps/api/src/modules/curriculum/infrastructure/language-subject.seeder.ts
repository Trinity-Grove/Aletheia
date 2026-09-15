import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildLanguageSubjectCompetencyDto,
  buildLanguageSubjectDomainDto,
  buildLanguageSubjectPathDto,
  buildLanguageSubjectCatalogSeedData,
} from './language-subject.seed-data.js';

export interface LanguageSubjectSeedResult {
  domainsCreated: number;
  pathsCreated: number;
  competenciesCreated: number;
}

@Injectable()
export class LanguageSubjectSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<LanguageSubjectSeedResult> {
    const data = buildLanguageSubjectCatalogSeedData();
    const existingDomains = await this.definitionsService.listLearningDomains();
    const domainsByCode = new Map(
      existingDomains.filter((domain) => domain.version === 1).map((domain) => [domain.code, domain]),
    );
    let domainsCreated = 0;

    for (const language of data) {
      if (domainsByCode.has(language.domain.code)) continue;
      const domain = await this.definitionsService.createLearningDomain(buildLanguageSubjectDomainDto(language.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainsByCode.set(language.domain.code, domain);
      domainsCreated += 1;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    const existingPathCodes = new Map(existingPaths.filter((path) => path.version === 1).map((path) => [path.code, path]));
    const existingCompetencies = await this.definitionsService.listCompetencyDefinitions();
    const existingCompetencyCodes = new Set(
      existingCompetencies.filter((competency) => competency.version === 1).map((competency) => competency.code),
    );

    let pathsCreated = 0;
    let competenciesCreated = 0;
    for (const language of data) {
      const domain = domainsByCode.get(language.domain.code);
      if (!domain) throw new Error(`Language domain ${language.domain.code} was not created or found`);
      for (const pathData of language.paths) {
        let path = existingPathCodes.get(pathData.path.code);
        if (!path) {
          path = await this.definitionsService.createLearningPath(buildLanguageSubjectPathDto(pathData.path, domain.id));
          await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
          existingPathCodes.set(path.code, path);
          pathsCreated += 1;
        }
        for (const competencySeed of pathData.competencies) {
          if (existingCompetencyCodes.has(competencySeed.code)) continue;
          const created = await this.definitionsService.createCompetencyDefinition(
            buildLanguageSubjectCompetencyDto(competencySeed, domain.id, path.id),
          );
          await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
          existingCompetencyCodes.add(competencySeed.code);
          competenciesCreated += 1;
        }
      }
    }

    return { domainsCreated, pathsCreated, competenciesCreated };
  }
}
