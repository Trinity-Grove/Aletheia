import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ConsentDefinition } from '@prisma/client';
import type {
  ConsentDefinitionResponseDto,
  ConsentScope,
  CreateConsentDefinitionInput,
  DefinitionStatus,
} from '@aletheia/contracts';
import { ConsentDefinitionsRepository } from '../infrastructure/consent-definitions.repository.js';
import { computeStatusTransition } from './definition-status-transition.js';

@Injectable()
export class ConsentDefinitionsService {
  constructor(private readonly repository: ConsentDefinitionsRepository) {}

  async create(dto: CreateConsentDefinitionInput): Promise<ConsentDefinitionResponseDto> {
    try {
      const row = await this.repository.create(dto);
      return this.toDto(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This consent definition code/version already exists.');
      }
      throw error;
    }
  }

  async list(): Promise<ConsentDefinitionResponseDto[]> {
    const rows = await this.repository.list();
    return rows.map((row) => this.toDto(row));
  }

  async findById(id: string): Promise<ConsentDefinitionResponseDto> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException('Consent definition not found.');
    }
    return this.toDto(row);
  }

  async findByCode(code: string): Promise<ConsentDefinitionResponseDto[]> {
    const rows = await this.repository.findByCode(code);
    return rows.map((row) => this.toDto(row));
  }

  async getPublishedDefinitions(scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]> {
    const rows = await this.repository.findPublished(scope);
    return rows.map((row) => this.toDto(row));
  }

  async transitionStatus(id: string, status: DefinitionStatus): Promise<ConsentDefinitionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Consent definition not found.');
    }
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateStatus(id, update);
    return this.toDto(row);
  }

  private toDto(row: ConsentDefinition): ConsentDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      scope: row.scope as ConsentScope,
      mandatory: row.mandatory,
      title: row.title,
      description: row.description,
      content: row.content,
      purposes: row.purposes,
      metadata: row.metadata as Record<string, unknown> | null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
