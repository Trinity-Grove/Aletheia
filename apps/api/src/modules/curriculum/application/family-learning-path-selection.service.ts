import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  FamilyLearningPathSelectionResponseDto,
  UpsertFamilyLearningPathSelectionDto,
} from '@aletheia/contracts';
import {
  FamilyLearningPathSelectionRepository,
  type FamilyLearningPathSelectionWithPath,
} from '../infrastructure/family-learning-path-selection.repository.js';

@Injectable()
export class FamilyLearningPathSelectionService {
  constructor(private readonly repository: FamilyLearningPathSelectionRepository) {}

  async upsert(
    familyId: string,
    pathId: string,
    dto: UpsertFamilyLearningPathSelectionDto,
  ): Promise<FamilyLearningPathSelectionResponseDto> {
    const selection = await this.repository.upsert(familyId, pathId, dto.enabled);
    if (!selection) throw new NotFoundException('Published learning path not found.');
    return this.toDto(selection);
  }

  async list(familyId: string): Promise<FamilyLearningPathSelectionResponseDto[]> {
    const selections = await this.repository.listByFamily(familyId);
    return selections.map((selection) => this.toDto(selection));
  }

  private toDto(selection: FamilyLearningPathSelectionWithPath): FamilyLearningPathSelectionResponseDto {
    return {
      id: selection.id,
      familyId: selection.familyId,
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
