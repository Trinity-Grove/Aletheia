import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type FamilyLearningResource } from '@prisma/client';
import type {
  CommunityLearningResourceResponseDto,
  CreateFamilyLearningResourceOutput,
  FamilyLearningResourceResponseDto,
  UpdateFamilyLearningResourceOutput,
} from '@aletheia/contracts';
import {
  FamilyLearningResourceRepository,
  type UpdateFamilyLearningResourceData,
} from '../infrastructure/family-learning-resource.repository.js';

@Injectable()
export class FamilyLearningResourceService {
  constructor(private readonly repository: FamilyLearningResourceRepository) {}

  async create(familyId: string, dto: CreateFamilyLearningResourceOutput): Promise<FamilyLearningResourceResponseDto> {
    const row = await this.repository.create({
      familyId,
      resourceType: dto.resourceType,
      title: dto.title,
      description: dto.description ?? null,
      subject: dto.subject ?? null,
      ageMin: dto.ageMin ?? null,
      ageMax: dto.ageMax ?? null,
      content: dto.content as Prisma.InputJsonValue,
      visibility: dto.visibility,
    });
    return this.toDto(row);
  }

  async list(familyId: string): Promise<FamilyLearningResourceResponseDto[]> {
    const rows = await this.repository.listByFamily(familyId);
    return rows.map((row) => this.toDto(row));
  }

  async listPublic(): Promise<CommunityLearningResourceResponseDto[]> {
    const rows = await this.repository.listPublic();
    return rows.map((row) => this.toCommunityDto(row));
  }

  async get(familyId: string, id: string): Promise<FamilyLearningResourceResponseDto> {
    const row = await this.repository.findByIdAndFamily(id, familyId);
    if (!row) throw new NotFoundException('Learning resource not found.');
    return this.toDto(row);
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdateFamilyLearningResourceOutput,
  ): Promise<FamilyLearningResourceResponseDto> {
    const data: UpdateFamilyLearningResourceData = {};
    if (dto.resourceType !== undefined) data.resourceType = dto.resourceType;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.subject !== undefined) data.subject = dto.subject ?? null;
    if (dto.ageMin !== undefined) data.ageMin = dto.ageMin ?? null;
    if (dto.ageMax !== undefined) data.ageMax = dto.ageMax ?? null;
    if (dto.content !== undefined) data.content = dto.content as Prisma.InputJsonValue;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;

    const updated = await this.repository.update(id, familyId, data);
    if (!updated) throw new NotFoundException('Learning resource not found.');
    return this.toDto(updated);
  }

  async delete(familyId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(id, familyId);
    if (!deleted) throw new NotFoundException('Learning resource not found.');
  }

  async adopt(familyId: string, sourceResourceId: string): Promise<FamilyLearningResourceResponseDto> {
    const copy = await this.repository.adoptPublic(sourceResourceId, familyId);
    if (!copy) throw new NotFoundException('Community learning resource not found.');
    return this.toDto(copy);
  }

  private toDto(row: FamilyLearningResource): FamilyLearningResourceResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      resourceType: row.resourceType as FamilyLearningResourceResponseDto['resourceType'],
      title: row.title,
      description: row.description,
      subject: row.subject,
      ageMin: row.ageMin,
      ageMax: row.ageMax,
      content: row.content as FamilyLearningResourceResponseDto['content'],
      visibility: row.visibility as FamilyLearningResourceResponseDto['visibility'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCommunityDto(row: FamilyLearningResource): CommunityLearningResourceResponseDto {
    return {
      id: row.id,
      resourceType: row.resourceType as CommunityLearningResourceResponseDto['resourceType'],
      title: row.title,
      description: row.description,
      subject: row.subject,
      ageMin: row.ageMin,
      ageMax: row.ageMax,
      content: row.content as CommunityLearningResourceResponseDto['content'],
      visibility: 'PUBLIC',
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
