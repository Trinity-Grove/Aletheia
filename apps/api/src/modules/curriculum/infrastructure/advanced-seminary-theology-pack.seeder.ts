import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { SEMINARY_THEOLOGY_PACK_PAYLOAD } from '@aletheia/contracts';

export interface AdvancedSeminaryTheologyPackSeedResult {
  code: string;
  version: number;
  cycles: number;
  disciplines: number;
}

@Injectable()
export class AdvancedSeminaryTheologyPackSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<AdvancedSeminaryTheologyPackSeedResult> {
    const now = new Date();

    const pack = await this.prisma.curriculumPack.upsert({
      where: {
        code_version: {
          code: 'ADVANCED_SEMINARY_THEOLOGY',
          version: 1,
        },
      },
      create: {
        code: 'ADVANCED_SEMINARY_THEOLOGY',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: 'Módulo Teológico Avançado (Nível Seminário)',
        description: SEMINARY_THEOLOGY_PACK_PAYLOAD.description,
        metadata: SEMINARY_THEOLOGY_PACK_PAYLOAD as unknown as Prisma.InputJsonValue,
        publishedAt: now,
      },
      update: {
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: 'Módulo Teológico Avançado (Nível Seminário)',
        description: SEMINARY_THEOLOGY_PACK_PAYLOAD.description,
        metadata: SEMINARY_THEOLOGY_PACK_PAYLOAD as unknown as Prisma.InputJsonValue,
        publishedAt: now,
      },
    });

    const totalDisciplines = SEMINARY_THEOLOGY_PACK_PAYLOAD.cycles.reduce(
      (sum, cycle) => sum + cycle.disciplines.length,
      0,
    );

    return {
      code: pack.code,
      version: pack.version,
      cycles: SEMINARY_THEOLOGY_PACK_PAYLOAD.cycles.length,
      disciplines: totalDisciplines,
    };
  }
}
