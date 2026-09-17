import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { OFFICIAL_CURRICULUM_PACKS } from './official-curriculum-packs.seed-data.js';

export interface OfficialPacksSeedResult {
  total: number;
  created: number;
  existing: number;
}

@Injectable()
export class OfficialCurriculumPacksSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<OfficialPacksSeedResult> {
    let created = 0;
    let existing = 0;

    for (const pack of OFFICIAL_CURRICULUM_PACKS) {
      const found = await this.prisma.curriculumPack.findUnique({
        where: { code_version: { code: pack.code, version: 1 } },
      });

      if (found) {
        existing++;
        continue;
      }

      await this.prisma.curriculumPack.create({
        data: {
          code: pack.code,
          version: 1,
          status: 'PUBLISHED',
          schemaVersion: '1.0.0',
          name: pack.name,
          description: pack.description,
          metadata: pack.metadata as Prisma.InputJsonValue,
          publishedAt: new Date(),
        },
      });
      created++;
    }

    return {
      total: OFFICIAL_CURRICULUM_PACKS.length,
      created,
      existing,
    };
  }
}
