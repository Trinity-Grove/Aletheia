import { Injectable } from '@nestjs/common';
import type { CurriculumDefinitionCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Family-facing catalog for CurriculumDefinition (issue #126 item 3) --
// same shape/reasoning as PedagogicalModelDefinitionResolver.
// listPublishedCatalog() and TheologicalTraditionCatalogResolver, but
// this one DOES carry `id` (see curriculum-definition.ts's comment on
// curriculumDefinitionCatalogEntrySchema for why): a family activating a
// curriculum for a learner needs the real FK id, not a code, because the
// resulting LearnerCompetencyTracking rows snapshot exact
// CompetencyDefinition rows reached through this exact CurriculumDefinition
// row.
//
// Same "dedup to latest PUBLISHED version per code" convention as
// PedagogicalModelDefinitionResolver.listPublishedCatalog() and
// TheologicalTraditionCatalogResolver -- a family activating a curriculum
// wants the current version, not to pick between an old and a new one
// that share a code.
@Injectable()
export class CurriculumDefinitionCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<CurriculumDefinitionCatalogEntryDto[]> {
    const rows = await this.prisma.curriculumDefinition.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    const seenCodes = new Set<string>();
    const catalog: CurriculumDefinitionCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      catalog.push({ id: row.id, code: row.code, name: row.name, description: row.description });
    }

    return catalog;
  }
}
