import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackItem } from '@prisma/client';
import {
  curriculumCompositionCatalogItemSchema,
  curriculumCompositionCatalogQuerySchema,
  curriculumCompositionItemSchema,
  portableRefSchema,
  type CurriculumCompositionCatalogItem,
  type CurriculumCompositionCatalogQuery,
  type CurriculumCompositionItem,
  type CurriculumCompositionRef,
  type CurriculumPackCompositionRevisionResponseDto,
  type CurriculumPackCompositionResponseDto,
  type PortableRef,
  type UpdateCurriculumPackCompositionDto,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { DefinitionsRepository } from '../infrastructure/definitions.repository.js';
import { findDefinitionByCodeVersion, exportDefinitionContent } from '../infrastructure/curriculum-pack-portability.js';
import {
  CompositionRevisionConflictError,
  CurriculumPackCompositionRepository,
} from '../infrastructure/curriculum-pack-composition.repository.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';

type CatalogRow = {
  code: string;
  version: number;
  status: string;
  schemaVersion: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
};

@Injectable()
export class CurriculumPackCompositionService {
  constructor(
    private readonly repository: CurriculumPackCompositionRepository,
    private readonly packRepository: CurriculumPackRepository,
    private readonly definitionsRepository: DefinitionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listCatalog(query: CurriculumCompositionCatalogQuery = {}): Promise<CurriculumCompositionCatalogItem[]> {
    const parsed = curriculumCompositionCatalogQuerySchema.parse(query);
    const [domains, competencies, models, paths, skills, rubrics, evidenceTypes, activities, curricula, traditions, positions, translations] = await Promise.all([
      this.definitionsRepository.listLearningDomains(),
      this.definitionsRepository.listCompetencyDefinitions(),
      this.definitionsRepository.listPedagogicalModelDefinitions(),
      this.definitionsRepository.listLearningPaths(),
      this.definitionsRepository.listSkillDefinitions(),
      this.definitionsRepository.listRubricDefinitions(),
      this.definitionsRepository.listEvidenceTypeDefinitions(),
      this.definitionsRepository.listActivityDefinitions(),
      this.definitionsRepository.listCurriculumDefinitions(),
      this.definitionsRepository.listTheologicalTraditionDefinitions(),
      this.definitionsRepository.listTheologicalPositionDefinitions(),
      this.definitionsRepository.listBibleTranslationDefinitions(),
    ]);

    const groups: Array<{ type: CurriculumCompositionItem['definitionType']; rows: CatalogRow[] }> = [
      { type: 'LearningDomain', rows: domains },
      { type: 'CompetencyDefinition', rows: competencies },
      { type: 'PedagogicalModelDefinition', rows: models },
      { type: 'LearningPath', rows: paths },
      { type: 'SkillDefinition', rows: skills },
      { type: 'RubricDefinition', rows: rubrics },
      { type: 'EvidenceTypeDefinition', rows: evidenceTypes },
      { type: 'ActivityDefinition', rows: activities },
      { type: 'CurriculumDefinition', rows: curricula },
      { type: 'TheologicalTraditionDefinition', rows: traditions },
      { type: 'TheologicalPositionDefinition', rows: positions },
      { type: 'BibleTranslationDefinition', rows: translations },
    ];

    const normalizedQuery = parsed.query?.toLocaleLowerCase();
    return groups
      .filter(({ type }) => !parsed.definitionType || type === parsed.definitionType)
      .flatMap(({ type, rows }) =>
        rows
          .filter((row) => row.status === 'PUBLISHED')
          .map((row) => {
            const item = {
              definitionType: type,
              code: row.code,
              version: row.version,
              label: row.title ?? row.name ?? row.code,
              description: row.description ?? null,
              status: 'PUBLISHED' as const,
              schemaVersion: row.schemaVersion,
            };
            return curriculumCompositionCatalogItemSchema.parse(item);
          })
          .filter((item) => {
            if (!normalizedQuery) return true;
            return `${item.code} ${item.label} ${item.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery);
          }),
      )
      .slice(0, parsed.limit);
  }

  async getComposition(userId: string, packId: string): Promise<CurriculumPackCompositionResponseDto> {
    await this.requireEditableAuthor(packId, userId);
    const current = await this.repository.findCurrent(packId);
    if (!current) throw new NotFoundException('Curriculum pack not found.');
    const items = current.items.map((item) => this.toCompositionItem(item));
    return { packId, revision: current.compositionRevision, items, preview: items };
  }

  async listRevisions(userId: string, packId: string): Promise<CurriculumPackCompositionRevisionResponseDto[]> {
    await this.requireEditableAuthor(packId, userId);
    const rows = await this.repository.listRevisions(packId);
    return rows.map((row) => ({
      id: row.id,
      packId: row.packId,
      revision: row.revision,
      items: curriculumCompositionItemSchema.array().parse(row.items),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async updateComposition(
    userId: string,
    packId: string,
    dto: UpdateCurriculumPackCompositionDto,
  ): Promise<CurriculumPackCompositionResponseDto> {
    await this.requireEditableAuthor(packId, userId);
    const refs = this.normalizeRefs(dto.items);
    await this.validateRefs(refs);

    try {
      const result = await this.repository.replace(packId, dto.expectedRevision, refs);
      if (!result) throw new NotFoundException('Curriculum pack not found.');
      const items = result.items.map((item) => this.toCompositionItem(item));
      return { packId, revision: result.revision, items, preview: items };
    } catch (error) {
      if (error instanceof CompositionRevisionConflictError) {
        throw new ConflictException(
          `This composition changed in another session. Reload revision ${error.currentRevision} before saving again.`,
        );
      }
      throw error;
    }
  }

  private normalizeRefs(items: UpdateCurriculumPackCompositionDto['items']): CurriculumCompositionRef[] {
    const seen = new Set<string>();
    return items.map((item) => {
      const key = `${item.definitionType}|${item.code}|${item.version}`;
      if (seen.has(key)) {
        throw new BadRequestException(`The composition contains a duplicate item: ${item.code}@${item.version}.`);
      }
      seen.add(key);
      return { definitionType: item.definitionType, code: item.code, version: item.version };
    });
  }

  private async validateRefs(items: CurriculumCompositionRef[]): Promise<void> {
    const selected = new Set(items.map((item) => `${item.definitionType}|${item.code}|${item.version}`));
    for (const item of items) {
      const lookup = await findDefinitionByCodeVersion(
        this.prisma,
        item.definitionType,
        item.code,
        item.version,
      );
      if (!lookup || lookup.status !== 'PUBLISHED') {
        throw new BadRequestException(`Only published definitions can be added: ${item.code}@${item.version}.`);
      }

      const content = await exportDefinitionContent(this.prisma, item.definitionType, item.code, item.version);
      if (!content) {
        throw new BadRequestException(`Definition ${item.code}@${item.version} cannot be exported.`);
      }

      for (const ref of this.collectPortableRefs(content)) {
        const key = `${ref.type}|${ref.code}|${ref.version}`;
        if (selected.has(key)) continue;
        const referenced = await findDefinitionByCodeVersion(this.prisma, ref.type, ref.code, ref.version);
        if (!referenced || referenced.status !== 'PUBLISHED') {
          throw new BadRequestException(
            `Definition ${item.code}@${item.version} has an unavailable reference: ${ref.code}@${ref.version}.`,
          );
        }
      }
    }
  }

  private collectPortableRefs(value: unknown): PortableRef[] {
    if (Array.isArray(value)) return value.flatMap((entry) => this.collectPortableRefs(entry));
    if (!value || typeof value !== 'object') return [];

    const parsed = portableRefSchema.safeParse(value);
    const refs = parsed.success ? [parsed.data] : [];
    return refs.concat(
      Object.values(value as Record<string, unknown>).flatMap((entry) => this.collectPortableRefs(entry)),
    );
  }

  private async requireEditableAuthor(packId: string, userId: string): Promise<CurriculumPack> {
    const pack = await this.packRepository.findPackById(packId);
    if (!pack) throw new NotFoundException('Curriculum pack not found.');
    if (pack.authorUserId !== userId) {
      throw new ForbiddenException('You can only manage compositions for packs that you authored.');
    }
    if (pack.status !== 'DRAFT' || pack.moderationStatus !== 'DRAFT') {
      throw new BadRequestException('Only community drafts can be composed.');
    }
    return pack;
  }

  private toCompositionItem(item: CurriculumPackItem): CurriculumCompositionItem {
    return curriculumCompositionItemSchema.parse({
      definitionType: item.definitionType,
      code: item.code,
      version: item.version,
      position: item.position,
    });
  }
}
