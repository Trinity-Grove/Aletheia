import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildTradesWoodworkingConstructionSeedData,
  buildTradesWoodworkingConstructionDomainDto,
  buildTradesWoodworkingConstructionPathDto,
  buildTradesWoodworkingConstructionCompetencyDto,
} from './trades-woodworking-construction.seed-data.js';

export interface TradesWoodworkingConstructionSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

// Installs the "woodworking/construction" group of per-trade Ofícios
// paths (Marcenaria, Carpintaria, Construção Simples, Ferramentas
// Manuais) under the existing `TRADES` LearningDomain (PR #134). First
// of 3 sibling seeders for issue #144 Lote 2 item 6 -- see
// trades-woodworking-construction.seed-data.ts for the full rationale.
//
// Domain handling is defensive/idempotent, same as every seeder in this
// file group: if `TRADES` already exists (the normal case -- PR #134
// already created it), it's found and left untouched; if this seeder
// happens to run first on a fresh database, it creates the domain using
// the exact same seed TradesFormationSeeder uses, so run order never
// matters.
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService, same reasoning as every prior
// seeder. Idempotent by checking existence first (by code), never by
// catching a unique-constraint error.
@Injectable()
export class TradesWoodworkingConstructionSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<TradesWoodworkingConstructionSeedResult> {
    const data = buildTradesWoodworkingConstructionSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildTradesWoodworkingConstructionDomainDto(data.domain),
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
          buildTradesWoodworkingConstructionPathDto(pathData.path, domain.id),
        );
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
        pathsCreated += 1;
      }

      for (const competencySeed of pathData.competencies) {
        if (existingCompetencyCodes.has(competencySeed.code)) continue;
        const created = await this.definitionsService.createCompetencyDefinition(
          buildTradesWoodworkingConstructionCompetencyDto(competencySeed, domain.id, path.id),
        );
        await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
        competenciesCreated += 1;
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
