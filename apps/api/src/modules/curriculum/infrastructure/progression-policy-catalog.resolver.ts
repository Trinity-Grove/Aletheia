import { Injectable } from '@nestjs/common';
import { evidenceCountRulesSchema, type ProgressionPolicyCatalogEntryDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Family-facing catalog for the policy types currently executable by the
// learner progression endpoint. Unsupported or malformed definitions stay an
// admin concern instead of appearing as activation choices that can never
// work.
@Injectable()
export class ProgressionPolicyCatalogResolver {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedCatalog(): Promise<ProgressionPolicyCatalogEntryDto[]> {
    const rows = await this.prisma.progressionPolicy.findMany({
      where: { status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_COUNT' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
    const seenCodes = new Set<string>();
    const catalog: ProgressionPolicyCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      const parsed = evidenceCountRulesSchema.safeParse(row.rules);
      if (!parsed.success) continue;
      seenCodes.add(row.code);
      catalog.push({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        policyType: 'EVIDENCE_COUNT',
        minimumEvidenceCount: parsed.data.minimumEvidenceCount,
        curriculumDefinitionId: row.curriculumDefinitionId,
      });
    }

    return catalog;
  }
}
