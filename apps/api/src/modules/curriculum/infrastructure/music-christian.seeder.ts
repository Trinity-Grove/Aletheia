import { Injectable } from '@nestjs/common';
import { DefinitionsService } from '../application/definitions.service.js';
import {
  buildMusicChristianSeedData,
  buildMusicChristianDomainDto,
  buildMusicChristianPathDto,
  buildMusicChristianCompetencyDto,
} from './music-christian.seed-data.js';

export interface MusicChristianSeedResult {
  domainCreated: boolean;
  pathCreated: boolean;
  competenciesCreated: number;
}

// Installs the "Música e Cristianismo" LearningPath (issue #95 section
// 13) under the existing `MUSIC` LearningDomain (PR #132). Same
// defensive/idempotent pattern as MusicInstrumentsSeeder: if `MUSIC`
// already exists, it's found and left untouched; if this seeder happens
// to run first on a fresh database, it creates the domain using the
// exact same seed MusicFormationSeeder uses, so run order never matters.
// See music-christian.seed-data.ts for the full rationale and the
// interdenominational-neutrality constraint this content must satisfy.
@Injectable()
export class MusicChristianSeeder {
  constructor(private readonly definitionsService: DefinitionsService) {}

  async seed(): Promise<MusicChristianSeedResult> {
    const data = buildMusicChristianSeedData();

    const existingDomains = await this.definitionsService.listLearningDomains();
    let domain = existingDomains.find((d) => d.code === data.domain.code && d.version === 1);
    let domainCreated = false;
    if (!domain) {
      domain = await this.definitionsService.createLearningDomain(buildMusicChristianDomainDto(data.domain));
      await this.definitionsService.transitionLearningDomainStatus(domain.id, 'PUBLISHED');
      domainCreated = true;
    }

    const existingPaths = await this.definitionsService.listLearningPaths();
    let path = existingPaths.find((p) => p.code === data.path.code && p.version === 1);
    let pathCreated = false;
    if (!path) {
      path = await this.definitionsService.createLearningPath(buildMusicChristianPathDto(data.path, domain.id));
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
        buildMusicChristianCompetencyDto(competencySeed, domain.id, path.id),
      );
      await this.definitionsService.transitionCompetencyDefinitionStatus(created.id, 'PUBLISHED');
      competenciesCreated += 1;
    }

    return { domainCreated, pathCreated, competenciesCreated };
  }
}
