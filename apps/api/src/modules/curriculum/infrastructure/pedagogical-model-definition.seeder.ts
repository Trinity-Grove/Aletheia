import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CurriculumTemplateEngine } from './curriculum-template.engine.js';
import { buildPedagogicalModelDefinitionSeedRows } from './pedagogical-model-definition.seed-data.js';

// Installs missing baseline models only. Once a version exists, its content,
// lifecycle and publication timestamp belong to the catalog and must survive
// seed reruns. Content changes require a new version through the admin API.
@Injectable()
export class PedagogicalModelDefinitionSeeder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: CurriculumTemplateEngine,
  ) {}

  async seed(): Promise<number> {
    const rows = buildPedagogicalModelDefinitionSeedRows(this.engine);
    const now = new Date();

    for (const row of rows) {
      await this.prisma.pedagogicalModelDefinition.upsert({
        where: { code_version: { code: row.code, version: 1 } },
        create: {
          code: row.code,
          version: 1,
          status: 'PUBLISHED',
          name: row.name,
          description: row.description,
          metadata: {
            subjects: row.subjects,
            approach: row.approach,
            recommendedAgeRange: row.recommendedAgeRange,
            educationalStages: row.educationalStages,
          },
          publishedAt: now,
        },
        update: {},
      });
    }

    return rows.length;
  }
}
