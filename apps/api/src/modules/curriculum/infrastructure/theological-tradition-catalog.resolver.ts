import { Injectable } from '@nestjs/common';
import type { TheologicalTraditionCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Family-facing catalog for TheologicalTraditionDefinition (issue #126
// item 1) -- same shape and reasoning as
// PedagogicalModelDefinitionResolver.listPublishedCatalog() (issue #96
// section 35): a family choosing a preferred tradition needs enough to
// render an option and set it by code, not the admin-facing shape.
@Injectable()
export class TheologicalTraditionCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<TheologicalTraditionCatalogEntryDto[]> {
    const rows = await this.prisma.theologicalTraditionDefinition.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    const seenCodes = new Set<string>();
    const catalog: TheologicalTraditionCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      catalog.push({ code: row.code, name: row.name, description: row.description });
    }

    return catalog;
  }
}
