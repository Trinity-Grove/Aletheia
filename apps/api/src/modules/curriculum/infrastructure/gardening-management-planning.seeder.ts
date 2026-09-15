import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildGardeningManagementPlanningSeedData,
  buildGardeningManagementPlanningDomainDto,
  buildGardeningManagementPlanningPathDto,
  buildGardeningManagementPlanningCompetencyDto,
} from './gardening-management-planning.seed-data.js';

export interface GardeningManagementPlanningSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

// Installs the "Manejo" and "Planejamento" LearningPaths under the
// existing `GARDENING` LearningDomain (PR #136). Last of 2 sibling
// seeders covering issue #95 section 19's remaining three subsections --
// see gardening-management-planning.seed-data.ts for the full rationale.
//
// Domain handling is defensive/idempotent, same as every seeder in this
// file group: if `GARDENING` already exists, it's found and left
// untouched; if this seeder happens to run first on a fresh database, it
// creates the domain using the exact same seed GardeningFormationSeeder
// uses, so run order never matters.
@Injectable()
export class GardeningManagementPlanningSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<GardeningManagementPlanningSeedResult> {
    const data = buildGardeningManagementPlanningSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildGardeningManagementPlanningDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    const existingPathCodes = new Map(
      existingPaths.filter((p) => p.version === 1).map((p) => [p.code, p]),
    );

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
          buildGardeningManagementPlanningPathDto(pathData.path, domain.id),
        );
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
        pathsCreated += 1;
      }

      for (const competencySeed of pathData.competencies) {
        if (existingCompetencyCodes.has(competencySeed.code)) continue;
        const created = await this.definitionsService.createCompetencyDefinition(
          buildGardeningManagementPlanningCompetencyDto(competencySeed, domain.id, path.id),
        );
        await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
        competenciesCreated += 1;
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
