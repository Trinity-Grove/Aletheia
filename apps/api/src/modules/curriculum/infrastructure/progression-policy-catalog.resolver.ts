import { Injectable } from '@nestjs/common';
import { evidenceCountRulesSchema, evidenceRubricRulesSchema, type ProgressionPolicyCatalogEntryDto } from '@aletheia/contracts';
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
      where: { status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: { in: ['EVIDENCE_COUNT', 'EVIDENCE_RUBRIC'] } },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
    const seenCodes = new Set<string>();
    const catalog: ProgressionPolicyCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      if (row.policyType === 'EVIDENCE_COUNT') {
        const parsed = evidenceCountRulesSchema.safeParse(row.rules);
        if (!parsed.success) continue;
        seenCodes.add(row.code);
        catalog.push({ id: row.id, code: row.code, name: row.name, description: row.description,
          policyType: 'EVIDENCE_COUNT', minimumEvidenceCount: parsed.data.minimumEvidenceCount,
          curriculumDefinitionId: row.curriculumDefinitionId });
        continue;
      }
      if (row.policyType !== 'EVIDENCE_RUBRIC') continue;
      const parsed = evidenceRubricRulesSchema.safeParse(row.rules);
      if (!parsed.success) continue;
      const rubric = await this.prisma.rubricDefinition.findUnique({
        where: { id: parsed.data.rubricDefinitionId },
        include: { criteria: { select: { id: true, scaleMin: true, scaleMax: true } } },
      });
      if (!rubric || rubric.version !== parsed.data.rubricVersion || rubric.status !== 'PUBLISHED' || rubric.schemaVersion !== '1.0.0' || rubric.criteria.length === 0) continue;
      const criterionIds = new Set(rubric.criteria.map((criterion) => criterion.id));
      const configuredIds = Object.keys(parsed.data.minimumScoresByCriterion);
      if (configuredIds.length !== criterionIds.size || configuredIds.some((id) => !criterionIds.has(id))) continue;
      if (rubric.criteria.some((criterion) => {
        const threshold = parsed.data.minimumScoresByCriterion[criterion.id];
        return typeof threshold !== 'number' || !Number.isInteger(threshold) || threshold < criterion.scaleMin || threshold > criterion.scaleMax;
      })) continue;
      seenCodes.add(row.code);
      catalog.push({ id: row.id, code: row.code, name: row.name, description: row.description,
        policyType: 'EVIDENCE_RUBRIC', minimumEvidenceCount: parsed.data.minimumEvidenceCount,
        rubricDefinitionId: parsed.data.rubricDefinitionId, rubricVersion: parsed.data.rubricVersion,
        minimumScoresByCriterion: parsed.data.minimumScoresByCriterion,
        requireHumanApproval: parsed.data.requireHumanApproval, curriculumDefinitionId: row.curriculumDefinitionId });
    }

    return catalog;
  }
}
