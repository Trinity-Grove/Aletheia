import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  LearnerLearningPathSelectionResponseDto,
  LearningPathExplorerCatalogEntryDto,
  UpsertLearnerLearningPathSelectionDto,
} from '@aletheia/contracts';
import {
  LearnerLearningPathSelectionRepository,
  type LearnerLearningPathSelectionWithPath,
  type PublishedLearningPathCatalogRow,
} from '../infrastructure/learner-learning-path-selection.repository.js';

function jsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

@Injectable()
export class LearnerLearningPathSelectionService {
  constructor(private readonly repository: LearnerLearningPathSelectionRepository) {}

  async listCatalog(
    familyId: string,
    learnerId: string,
    academicYearId: string,
  ): Promise<LearningPathExplorerCatalogEntryDto[]> {
    const rows = await this.repository.listPublishedCatalog(familyId, learnerId, academicYearId);
    if (!rows) throw new NotFoundException('Learner or academic year not found for this family.');
    return rows.map((row) => this.toCatalogEntry(row));
  }

  async upsert(
    familyId: string,
    learnerId: string,
    academicYearId: string,
    pathId: string,
    dto: UpsertLearnerLearningPathSelectionDto,
  ): Promise<LearnerLearningPathSelectionResponseDto> {
    const selection = await this.repository.upsert(familyId, learnerId, academicYearId, pathId, dto.enabled);
    if (!selection) throw new NotFoundException('Published learning path or family context not found.');
    return this.toDto(selection);
  }

  private toCatalogEntry(row: PublishedLearningPathCatalogRow): LearningPathExplorerCatalogEntryDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      name: row.name,
      description: row.description,
      metadata: jsonObject(row.metadata),
      selected: row.learnerSelections.some((selection) => selection.enabled),
      competencies: row.competencies.map((competency) => ({
        code: competency.code,
        title: competency.title,
        level: competency.level,
        metadata: jsonObject(competency.metadata),
      })),
    };
  }

  private toDto(selection: LearnerLearningPathSelectionWithPath): LearnerLearningPathSelectionResponseDto {
    return {
      id: selection.id,
      familyId: selection.familyId,
      learnerId: selection.learnerId,
      academicYearId: selection.academicYearId,
      pathId: selection.pathId,
      enabled: selection.enabled,
      createdAt: selection.createdAt.toISOString(),
      updatedAt: selection.updatedAt.toISOString(),
      path: {
        code: selection.path.code,
        name: selection.path.name,
        version: selection.path.version,
        status: selection.path.status,
      },
    };
  }
}
