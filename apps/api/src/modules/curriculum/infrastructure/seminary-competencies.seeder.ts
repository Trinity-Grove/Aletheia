import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { SEMINARY_DISCIPLINES_METADATA } from '@aletheia/contracts';

export interface SeminaryCompetenciesSeedResult {
  domainCreatedOrFound: string;
  pathCreatedOrFound: string;
  competenciesCount: number;
}

@Injectable()
export class SeminaryCompetenciesSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<SeminaryCompetenciesSeedResult> {
    const now = new Date();

    const domain = await this.prisma.learningDomain.upsert({
      where: { code_version: { code: 'FAITH.THEOLOGY', version: 1 } },
      create: {
        code: 'FAITH.THEOLOGY',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: 'Teologia e Formação Ministerial',
        description: 'Estudos teológicos e formação ministerial bíblica e confessional.',
        publishedAt: now,
      },
      update: {
        status: 'PUBLISHED',
        name: 'Teologia e Formação Ministerial',
        description: 'Estudos teológicos e formação ministerial bíblica e confessional.',
        publishedAt: now,
      },
    });

    const path = await this.prisma.learningPath.upsert({
      where: { code_version: { code: 'FAITH.THEOLOGY.SEMINARY', version: 1 } },
      create: {
        code: 'FAITH.THEOLOGY.SEMINARY',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        domainId: domain.id,
        name: 'Formação Teológica de Nível Seminário',
        description: 'Trilha curricular teológica de nível de seminário com 4 ciclos e 24 disciplinas.',
        publishedAt: now,
      },
      update: {
        status: 'PUBLISHED',
        domainId: domain.id,
        name: 'Formação Teológica de Nível Seminário',
        description: 'Trilha curricular teológica de nível de seminário com 4 ciclos e 24 disciplinas.',
        publishedAt: now,
      },
    });

    for (const discipline of SEMINARY_DISCIPLINES_METADATA) {
      const metadata: Prisma.InputJsonValue = {
        description: discipline.description,
        topics: discipline.topics,
        primaryReadings: discipline.primaryReadings,
        suggestedEvidenceTypes: discipline.suggestedEvidenceTypes,
      };

      await this.prisma.competencyDefinition.upsert({
        where: { code_version: { code: discipline.code, version: 1 } },
        create: {
          code: discipline.code,
          version: 1,
          status: 'PUBLISHED',
          schemaVersion: '1.0.0',
          domainId: domain.id,
          pathId: path.id,
          title: discipline.name,
          level: discipline.cycle,
          metadata,
          publishedAt: now,
        },
        update: {
          status: 'PUBLISHED',
          domainId: domain.id,
          pathId: path.id,
          title: discipline.name,
          level: discipline.cycle,
          metadata,
          publishedAt: now,
        },
      });
    }

    return {
      domainCreatedOrFound: domain.code,
      pathCreatedOrFound: path.code,
      competenciesCount: SEMINARY_DISCIPLINES_METADATA.length,
    };
  }
}
