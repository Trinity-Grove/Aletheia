import { Injectable } from '@nestjs/common';
import type { EvidenceTypeCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Family-facing catalog for EvidenceTypeDefinition (issue #126 item 3) --
// populates the evidence-submission form's "type of evidence" dropdown
// (createEvidenceSubmissionSchema.evidenceTypeId is a real FK id). Same
// "dedup to latest PUBLISHED version per code" convention as the other
// family-facing catalog resolvers in this module.
@Injectable()
export class EvidenceTypeCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<EvidenceTypeCatalogEntryDto[]> {
    const rows = await this.prisma.evidenceTypeDefinition.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    const seenCodes = new Set<string>();
    const catalog: EvidenceTypeCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      catalog.push({ id: row.id, code: row.code, name: row.name, description: row.description });
    }

    return catalog;
  }
}
