import { Injectable, NotFoundException } from '@nestjs/common';
import type { FamilyActivity, Prisma } from '@prisma/client';
import type {
  CreateFamilyActivityOutput,
  FamilyActivityResponseDto,
  FamilyContentVisibility,
  UpdateFamilyActivityOutput,
} from '@aletheia/contracts';
import { FamilyActivityRepository } from '../infrastructure/family-activity.repository.js';

@Injectable()
export class FamilyActivityService {
  constructor(private readonly repository: FamilyActivityRepository) {}

  async create(
    familyId: string,
    dto: CreateFamilyActivityOutput,
  ): Promise<FamilyActivityResponseDto> {
    const row = await this.repository.create({
      familyId,
      name: dto.name,
      description: dto.description ?? null,
      ageMin: dto.ageMin ?? null,
      ageMax: dto.ageMax ?? null,
      estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
      supervisionRequired: dto.supervisionRequired,
      riskLevel: dto.riskLevel ?? null,
      evidenceRequirementMode: dto.evidenceRequirementMode,
      metadata: dto.metadata as Prisma.InputJsonValue,
      visibility: dto.visibility,
    });
    return this.toDto(row);
  }

  async list(familyId: string): Promise<FamilyActivityResponseDto[]> {
    const rows = await this.repository.listByFamily(familyId);
    return rows.map((row) => this.toDto(row));
  }

  async get(familyId: string, id: string): Promise<FamilyActivityResponseDto> {
    const row = await this.requireActivity(familyId, id);
    return this.toDto(row);
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdateFamilyActivityOutput,
  ): Promise<FamilyActivityResponseDto> {
    const updated = await this.repository.update(id, familyId, {
      familyId,
      name: dto.name,
      description: dto.description ?? null,
      ageMin: dto.ageMin ?? null,
      ageMax: dto.ageMax ?? null,
      estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
      supervisionRequired: dto.supervisionRequired,
      riskLevel: dto.riskLevel ?? null,
      evidenceRequirementMode: dto.evidenceRequirementMode,
      metadata: dto.metadata as Prisma.InputJsonValue,
      visibility: dto.visibility,
    });
    if (!updated) throw new NotFoundException('Family activity not found.');
    return this.toDto(updated);
  }

  async delete(familyId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(id, familyId);
    if (!deleted) throw new NotFoundException('Family activity not found.');
  }

  private async requireActivity(familyId: string, id: string): Promise<FamilyActivity> {
    const row = await this.repository.findByIdAndFamily(id, familyId);
    if (!row) throw new NotFoundException('Family activity not found.');
    return row;
  }

  private toDto(row: FamilyActivity): FamilyActivityResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      name: row.name,
      description: row.description,
      ageMin: row.ageMin,
      ageMax: row.ageMax,
      estimatedDurationMinutes: row.estimatedDurationMinutes,
      supervisionRequired: row.supervisionRequired,
      riskLevel: row.riskLevel,
      evidenceRequirementMode: row.evidenceRequirementMode as 'ANY' | 'ALL',
      metadata: row.metadata as Record<string, unknown>,
      visibility: row.visibility as FamilyContentVisibility,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
