import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { BRAZIL_JURISDICTION_SEED } from './brazil-jurisdiction.seed-data.js';

// Installs the missing baseline jurisdiction row(s) only. Once a version
// exists, its content, lifecycle and publication timestamp belong to the
// catalog and must survive seed reruns -- a rule change is a new version
// through the admin API, never a rewrite of this seed (same discipline as
// PedagogicalModelDefinitionSeeder).
@Injectable()
export class JurisdictionDefinitionSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<number> {
    const seeds = [BRAZIL_JURISDICTION_SEED];
    const now = new Date();

    for (const seed of seeds) {
      await this.prisma.jurisdictionDefinition.upsert({
        where: { code_version: { code: seed.code, version: 1 } },
        create: {
          code: seed.code,
          version: 1,
          status: 'PUBLISHED',
          name: seed.name,
          description: seed.description,
          metadata: seed.metadata as unknown as Prisma.InputJsonValue,
          publishedAt: now,
        },
        update: {},
      });
    }

    return seeds.length;
  }
}
