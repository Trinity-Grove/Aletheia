import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  FamilyProjectSelectionResponseDto,
  UpsertFamilyProjectSelectionDto,
} from '@aletheia/contracts';
import {
  FamilyProjectSelectionRepository,
  type FamilyProjectSelectionWithProject,
} from '../infrastructure/family-project-selection.repository.js';

@Injectable()
export class FamilyProjectSelectionService {
  constructor(private readonly repository: FamilyProjectSelectionRepository) {}

  async upsert(
    familyId: string,
    projectId: string,
    dto: UpsertFamilyProjectSelectionDto,
  ): Promise<FamilyProjectSelectionResponseDto> {
    const selection = await this.repository.upsert(familyId, projectId, dto.enabled);
    if (!selection) throw new NotFoundException('Published project not found.');
    return this.toDto(selection);
  }

  async list(familyId: string): Promise<FamilyProjectSelectionResponseDto[]> {
    const selections = await this.repository.listByFamily(familyId);
    return selections.map((selection) => this.toDto(selection));
  }

  private toDto(selection: FamilyProjectSelectionWithProject): FamilyProjectSelectionResponseDto {
    return {
      id: selection.id,
      familyId: selection.familyId,
      projectId: selection.projectId,
      enabled: selection.enabled,
      createdAt: selection.createdAt.toISOString(),
      updatedAt: selection.updatedAt.toISOString(),
      project: {
        code: selection.project.code,
        name: selection.project.name,
        version: selection.project.version,
        status: selection.project.status,
      },
    };
  }
}
