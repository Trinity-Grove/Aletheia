import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AddDefinitionTagOutput,
  DefinitionTagResponseDto,
  SearchDefinitionsByTagDto,
} from '@aletheia/contracts';
import { DefinitionTagsRepository } from '../infrastructure/definition-tags.repository.js';

// Generic tagging (issue #96 section 38) over any of the packageable
// Definition/Version tables (see curriculum-pack.ts's closed type list,
// reused here). Deliberately its own small service/repository/controller
// trio rather than folding into DefinitionsService -- that file already
// carries the full CRUD + audit-log surface for 14 tables; tags are a
// cross-cutting annotation layer over all of them, not one more type in
// that same list.
@Injectable()
export class DefinitionTagsService {
  constructor(private readonly repository: DefinitionTagsRepository) {}

  async addTag(dto: AddDefinitionTagOutput): Promise<DefinitionTagResponseDto> {
    if (!(await this.repository.definitionExists(dto.entityType, dto.definitionId))) {
      throw new BadRequestException(`${dto.entityType} ${dto.definitionId} does not exist.`);
    }
    const row = await this.withWriteErrorMapping(() => this.repository.create(dto));
    return this.toDto(row);
  }

  async listTagsForDefinition(entityType: string, definitionId: string): Promise<DefinitionTagResponseDto[]> {
    const rows = await this.repository.listForDefinition(entityType, definitionId);
    return rows.map((row) => this.toDto(row));
  }

  async removeTag(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Tag not found.');
    await this.repository.delete(id);
  }

  async search(query: SearchDefinitionsByTagDto): Promise<DefinitionTagResponseDto[]> {
    const rows = await this.repository.search(query);
    return rows.map((row) => this.toDto(row));
  }

  private async withWriteErrorMapping<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This tag already exists on this definition.');
      }
      throw error;
    }
  }

  private toDto(row: {
    id: string;
    entityType: string;
    definitionId: string;
    namespace: string;
    tag: string;
    createdAt: Date;
  }): DefinitionTagResponseDto {
    return {
      id: row.id,
      entityType: row.entityType,
      definitionId: row.definitionId,
      namespace: row.namespace,
      tag: row.tag,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
