import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { buildTheologicalTraditionSeedRows } from './theological-tradition.seed-data.js';

// Installs baseline historical theological traditions (issues #95, #96).
// Idempotent: missing rows are created as PUBLISHED version 1, while existing
// versions are preserved without mutating publication dates or custom content.
@Injectable()
export class TheologicalTraditionSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<number> {
    const rows = buildTheologicalTraditionSeedRows();
    const now = new Date();

    for (const row of rows) {
      await this.prisma.theologicalTraditionDefinition.upsert({
        where: { code_version: { code: row.code, version: 1 } },
        create: {
          code: row.code,
          version: 1,
          status: 'PUBLISHED',
          schemaVersion: row.schemaVersion,
          name: row.name,
          description: row.description ?? null,
          metadata: row.metadata as Prisma.InputJsonValue,
          publishedAt: now,
        },
        update: {},
      });
    }

    return rows.length;
  }
}
