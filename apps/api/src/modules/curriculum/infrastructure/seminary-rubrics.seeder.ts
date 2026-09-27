import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { SEMINARY_THEOLOGY_RUBRIC_DEFINITION } from '@aletheia/contracts';

export interface SeminaryRubricsSeedResult {
  rubricCode: string;
  criteriaCount: number;
}

@Injectable()
export class SeminaryRubricsSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<SeminaryRubricsSeedResult> {
    const now = new Date();

    const rubric = await this.prisma.rubricDefinition.upsert({
      where: {
        code_version: {
          code: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.code,
          version: 1,
        },
      },
      create: {
        code: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.code,
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.name,
        description: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.description ?? null,
        publishedAt: now,
      },
      update: {
        status: 'PUBLISHED',
        name: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.name,
        description: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.description ?? null,
        publishedAt: now,
      },
    });

    for (let i = 0; i < SEMINARY_THEOLOGY_RUBRIC_DEFINITION.criteria.length; i++) {
      const criterion = SEMINARY_THEOLOGY_RUBRIC_DEFINITION.criteria[i]!;
      await this.prisma.rubricCriterion.upsert({
        where: {
          rubricId_code: {
            rubricId: rubric.id,
            code: criterion.code,
          },
        },
        create: {
          rubricId: rubric.id,
          code: criterion.code,
          label: criterion.name,
          weight: criterion.weight,
          order: i + 1,
          scaleMin: 0,
          scaleMax: 4,
          metadata: criterion.description ? { description: criterion.description } : {},
        },
        update: {
          label: criterion.name,
          weight: criterion.weight,
          order: i + 1,
          scaleMin: 0,
          scaleMax: 4,
          metadata: criterion.description ? { description: criterion.description } : {},
        },
      });
    }

    return {
      rubricCode: rubric.code,
      criteriaCount: SEMINARY_THEOLOGY_RUBRIC_DEFINITION.criteria.length,
    };
  }
}
