import { Injectable } from '@nestjs/common';
import type { RubricCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class RubricCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<RubricCatalogEntryDto[]> {
    const rows = await this.prisma.rubricDefinition.findMany({
      where: { status: 'PUBLISHED', schemaVersion: '1.0.0' },
      include: { criteria: { orderBy: { order: 'asc' } } },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
    const seenCodes = new Set<string>();
    const catalog: RubricCatalogEntryDto[] = [];
    for (const row of rows) {
      if (seenCodes.has(row.code) || row.criteria.length === 0) continue;
      seenCodes.add(row.code);
      catalog.push({
        id: row.id,
        code: row.code,
        version: row.version,
        name: row.name,
        description: row.description,
        competencyId: row.competencyId,
        criteria: row.criteria.map((criterion) => ({
          id: criterion.id,
          code: criterion.code,
          label: criterion.label,
          order: criterion.order,
          scaleMin: criterion.scaleMin,
          scaleMax: criterion.scaleMax,
        })),
      });
    }
    return catalog;
  }
}
