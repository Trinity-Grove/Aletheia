import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildPersonalFinanceFoundationsSeedData,
  buildPersonalFinanceFoundationsDomainDto,
  buildPersonalFinanceFoundationsPathDto,
  buildPersonalFinanceFoundationsCompetencyDto,
} from './personal-finance-foundations.seed-data.js';

export interface PersonalFinanceFoundationsSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Educação Financeira Prática" foundational content from
// issue #95 section 22 (domain -> path -> competencies) -- same pattern
// as BiblicalFormationSeeder (section 5, PR #131) through
// HomeSufficiencyFoundationsSeeder (section 21, PR #168).
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService, matching the established
// pattern for net-new pedagogical content (not a migration of an
// existing hardcoded array).
//
// Idempotent by checking existence first (by code) rather than by
// catching a unique-constraint error: a rerun never touches an existing
// row's status, content, or publication timestamp.
@Injectable()
export class PersonalFinanceFoundationsSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<PersonalFinanceFoundationsSeedResult> {
    const data = buildPersonalFinanceFoundationsSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(
        buildPersonalFinanceFoundationsDomainDto(data.domain),
      );
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(
        buildPersonalFinanceFoundationsPathDto(data.path, domain.id),
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
        buildPersonalFinanceFoundationsCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
