import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type CurriculumPack, type CurriculumPackItem, type CurriculumPackDependency } from '@prisma/client';
import type {
  CreateCurriculumPackOutput,
  CurriculumPackResponseDto,
  AddCurriculumPackItemOutput,
  CurriculumPackItemResponseDto,
  AddCurriculumPackDependencyOutput,
  CurriculumPackDependencyResponseDto,
  CurriculumPackDefinitionType,
  DefinitionStatus,
} from '@aletheia/contracts';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { computeStatusTransition } from './definition-status-transition.js';

// Admin CRUD for CurriculumPack + manifest + dependencies (issue #96
// Fase 4, section 27). Nothing here resolves or validates that manifest
// items/dependencies actually exist yet -- that's export's job (a
// published pack should be internally consistent by the time it's
// exported, but a DRAFT pack is allowed to reference not-yet-published
// or not-yet-created items while it's being assembled, same as every
// other Definition/Version table's DRAFT stage).
@Injectable()
export class CurriculumPackService {
  constructor(private readonly repository: CurriculumPackRepository) {}

  async createPack(dto: CreateCurriculumPackOutput): Promise<CurriculumPackResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createPack(dto));
    return this.toPackDto(row);
  }

  async listPacks(): Promise<CurriculumPackResponseDto[]> {
    const rows = await this.repository.listPacks();
    return rows.map((row) => this.toPackDto(row));
  }

  async getPack(id: string): Promise<CurriculumPackResponseDto> {
    const row = await this.repository.findPackById(id);
    if (!row) throw new NotFoundException('Curriculum pack not found.');
    return this.toPackDto(row);
  }

  async transitionPackStatus(id: string, status: DefinitionStatus): Promise<CurriculumPackResponseDto> {
    const existing = await this.repository.findPackById(id);
    if (!existing) throw new NotFoundException('Curriculum pack not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updatePackStatus(id, update);
    return this.toPackDto(row);
  }

  async addItem(packId: string, dto: AddCurriculumPackItemOutput): Promise<CurriculumPackItemResponseDto> {
    await this.requirePack(packId);
    const row = await this.withWriteErrorMapping(() => this.repository.addItem(packId, dto));
    return this.toItemDto(row);
  }

  async listItems(packId: string): Promise<CurriculumPackItemResponseDto[]> {
    await this.requirePack(packId);
    const rows = await this.repository.listItems(packId);
    return rows.map((row) => this.toItemDto(row));
  }

  async addDependency(
    packId: string,
    dto: AddCurriculumPackDependencyOutput,
  ): Promise<CurriculumPackDependencyResponseDto> {
    await this.requirePack(packId);
    const row = await this.withWriteErrorMapping(() => this.repository.addDependency(packId, dto));
    return this.toDependencyDto(row);
  }

  async listDependencies(packId: string): Promise<CurriculumPackDependencyResponseDto[]> {
    await this.requirePack(packId);
    const rows = await this.repository.listDependencies(packId);
    return rows.map((row) => this.toDependencyDto(row));
  }

  private async requirePack(id: string): Promise<void> {
    const existing = await this.repository.findPackById(id);
    if (!existing) throw new NotFoundException('Curriculum pack not found.');
  }

  private async withWriteErrorMapping<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('One or more referenced rows do not exist.');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('This pack, item, or dependency already exists.');
        }
      }
      throw error;
    }
  }

  private toPackDto(row: CurriculumPack): CurriculumPackResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toItemDto(row: CurriculumPackItem): CurriculumPackItemResponseDto {
    return {
      id: row.id,
      packId: row.packId,
      definitionType: row.definitionType as CurriculumPackDefinitionType,
      code: row.code,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toDependencyDto(row: CurriculumPackDependency): CurriculumPackDependencyResponseDto {
    return {
      id: row.id,
      packId: row.packId,
      dependsOnCode: row.dependsOnCode,
      dependsOnVersion: row.dependsOnVersion,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
