import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildResilienceFormationSeedData,
  buildResilienceFormationDomainDto,
  buildResilienceFormationPathDto,
  buildResilienceFormationCompetencyDto,
} from './resilience-formation.seed-data.js';

export interface ResilienceFormationSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Resiliência, Outdoor e Preparação Familiar" -> Primeiros
// Socorros content from issue #95 section 20 (domain -> path ->
// competencies) -- same pattern as BiblicalFormationSeeder (issue #95
// section 5, PR #131), MusicFormationSeeder (issue #95 section 13, PR
// #132), TradesFormationSeeder (issue #95 section 15, PR #134),
// CookingFormationSeeder (issue #95 section 18, PR #135), and
// GardeningFormationSeeder (issue #95 section 19, PR #136).
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService the way
// PedagogicalModelDefinitionSeeder/EvidenceTypeDefinitionSeeder/
// BibleTranslationDefinitionSeeder do. Those seeders predate this one and
// upsert raw Prisma rows; this seed is real net-new pedagogical content
// (not a migration of an existing hardcoded array), so it goes through
// the same create+validate+publish path an administrator would use by
// hand, instead of a bespoke persistence shortcut.
//
// Idempotent by checking existence first (by code) rather than by
// catching a unique-constraint error: a rerun never touches an existing
// row's status, content, or publication timestamp, matching the "install
// missing baseline models only" contract the other seeders already
// establish, just implemented as a lookup-then-create instead of an
// upsert-with-no-op-update (DefinitionsService has no upsert primitive --
// composing idempotency this way still only uses the existing admin
// service methods, no new persistence code).
//
// Known limitation, documented rather than engineered around (out of
// scope for this slice): this assumes a normal run to completion. If the
// process crashes between creating the domain and creating the path/
// competencies, a rerun will find the domain (skip it) and still create
// the missing path/competencies -- so it's still eventually consistent,
// just not atomic across all three creates in a single failure window.
@Injectable()
export class ResilienceFormationSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<ResilienceFormationSeedResult> {
    const data = buildResilienceFormationSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildResilienceFormationDomainDto(data.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(buildResilienceFormationPathDto(data.path, domain.id));
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
        buildResilienceFormationCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
