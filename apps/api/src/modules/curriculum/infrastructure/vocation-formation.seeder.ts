import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildVocationFormationSeedData,
  buildVocationFormationDomainDto,
  buildVocationFormationPathDto,
  buildVocationFormationCompetencyDto,
} from './vocation-formation.seed-data.js';

export interface VocationFormationSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

// Installs the "Vocação" foundational content from issue #95 section 17
// (domain -> two paths -> competencies) -- same pattern as
// TechnologyFormationSeeder (section 16, PR #167), applied here because
// section 17 splits naturally into "Autoconhecimento e Exploração
// Vocacional" and "Prática Vocacional e Propósito".
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService.
//
// Idempotent by checking existence first (by code) rather than by
// catching a unique-constraint error: a rerun never touches an existing
// row's status, content, or publication timestamp.
@Injectable()
export class VocationFormationSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<VocationFormationSeedResult> {
    const data = buildVocationFormationSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildVocationFormationDomainDto(data.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    const existingPathCodes = new Map(existingPaths.filter((p) => p.version === 1).map((p) => [p.code, p]));

    const existingCompetencies = await this.definitionsService.listCompetencyDefinitions();
    const existingCompetencyCodes = new Set(
      existingCompetencies.filter((c) => c.version === 1).map((c) => c.code),
    );

    let pathsCreated = 0;
    let competenciesCreated = 0;

    for (const pathData of data.paths) {
      let path = existingPathCodes.get(pathData.path.code);
      if (!path) {
        path = await this.definitionsService.createLearningPath(
          buildVocationFormationPathDto(pathData.path, domain.id),
        );
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
        pathsCreated += 1;
      }

      for (const competencySeed of pathData.competencies) {
        if (existingCompetencyCodes.has(competencySeed.code)) continue;
        const created = await this.definitionsService.createCompetencyDefinition(
          buildVocationFormationCompetencyDto(competencySeed, domain.id, path.id),
        );
        await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
        competenciesCreated += 1;
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
