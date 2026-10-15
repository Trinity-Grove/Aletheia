import { Injectable } from '@nestjs/common';
import type { LearningDomainCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Family-facing catalog for AI lesson planning. Only active published domains
// are discoverable, and older versions of the same code are collapsed so the
// UI cannot select a context the AI endpoint would reject.
@Injectable()
export class LearningDomainCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<LearningDomainCatalogEntryDto[]> {
    const rows = await this.prisma.learningDomain.findMany({
      where: { status: 'PUBLISHED', isActive: true },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
      select: { id: true, code: true, version: true, name: true, description: true },
    });

    const seenCodes = new Set<string>();
    const catalog: LearningDomainCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      catalog.push(row);
    }

    return catalog;
  }
}
