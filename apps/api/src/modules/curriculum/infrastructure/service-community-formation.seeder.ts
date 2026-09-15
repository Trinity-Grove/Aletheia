import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildServiceCommunityFormationSeedData,
  buildServiceCommunityFormationDomainDto,
  buildServiceCommunityFormationPathDto,
  buildServiceCommunityFormationCompetencyDto,
} from './service-community-formation.seed-data.js';

export interface ServiceCommunityFormationSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Serviço e Comunidade" foundational content from issue
// #95 section 24 (domain -> path -> competencies) -- same pattern as
// PhysicalFormationSeeder (issue #95 section 23) and the rest of the
// Domain -> Path -> Competency seeders.
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService. This seed is real net-new
// pedagogical content (not a migration of an existing hardcoded array),
// so it goes through the same create+validate+publish path an
// administrator would use by hand, instead of a bespoke persistence
// shortcut.
//
// Idempotent by checking existence first (by code) rather than by
// catching a unique-constraint error: a rerun never touches an existing
// row's status, content, or publication timestamp.
//
// Known limitation, documented rather than engineered around (out of
// scope for this slice): this assumes a normal run to completion. If the
// process crashes between creating the domain and creating the path/
// competencies, a rerun will find the domain (skip it) and still create
// the missing path/competencies -- so it's still eventually consistent,
// just not atomic across all three creates in a single failure window.
@Injectable()
export class ServiceCommunityFormationSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<ServiceCommunityFormationSeedResult> {
    const data = buildServiceCommunityFormationSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildServiceCommunityFormationDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildServiceCommunityFormationPathDto(data.path, domain.id),
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
        buildServiceCommunityFormationCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
