import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildGeographySubjectSeedData,
  buildGeographySubjectDomainDto,
  buildGeographySubjectPathDto,
  buildGeographySubjectCompetencyDto,
} from './geography-subject.seed-data.js';

export interface GeographySubjectSeedResult {
  domainCreated: boolean;
  pathsCreated: number;
  competenciesCreated: number;
}

// Installs the "Geografia" core-academic-subject content (domain ->
// multiple grade-band paths -> competencies). Fourth and final core
// subject in this Lote 1 batch, after Matemática (#142/#145), Ciências
// (#147) and História (#149) -- see geography-subject.seed-data.ts for
// the full rationale. Same shape as MathSubjectSeeder/ScienceSubjectSeeder
// /HistorySubjectSeeder: this domain has multiple LearningPaths (one per
// grade band), so the seeding loop is one level deeper than the
// single-path enrichment-domain seeders.
//
// Deliberately goes through DefinitionsService -- the exact application
// service /api/v1/admin/curriculum-definitions/* calls -- rather than
// writing rows directly via PrismaService, same reasoning as every prior
// seeder in this file group: this is real net-new pedagogical content,
// not a migration of an existing hardcoded array.
//
// Idempotent by checking existence first (by code) rather than by
// catching a unique-constraint error: a rerun never touches an existing
// row's status, content, or publication timestamp.
//
// Known limitation, documented rather than engineered around (out of
// scope for this slice): this assumes a normal run to completion. A
// crash mid-run leaves a rerun to fill in only what's missing --
// eventually consistent, not atomic across all creates in one failure
// window.
@Injectable()
export class GeographySubjectSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<GeographySubjectSeedResult> {
    const data = buildGeographySubjectSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildGeographySubjectDomainDto(data.domain));
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
          buildGeographySubjectPathDto(pathData.path, domain.id),
        );
        await this.definitionsService.transitionLearningPathStatus(path.id, 'PUBLISHED');
        pathsCreated += 1;
      }

      for (const competencySeed of pathData.competencies) {
        if (existingCompetencyCodes.has(competencySeed.code)) continue;
        const created = await this.definitionsService.createCompetencyDefinition(
          buildGeographySubjectCompetencyDto(competencySeed, domain.id, path.id),
        );
        await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
        competenciesCreated += 1;
      }
    }

    return { domainCreated, pathsCreated, competenciesCreated };
  }
}
