import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JurisdictionDefinition } from '@prisma/client';
import type {
  CreateJurisdictionDefinitionOutput,
  JurisdictionDefinitionResponseDto,
  DefinitionStatus,
} from '@aletheia/contracts';
import { JurisdictionDefinitionsRepository } from '../infrastructure/jurisdiction-definitions.repository.js';
import { computeStatusTransition } from './definition-status-transition.js';

// Admin CRUD for the versioned jurisdiction/compliance catalog (issue #26,
// "Brasil como organizador/complemento" first slice). Same DRAFT ->
// PUBLISHED -> DEPRECATED -> ARCHIVED discipline as curriculum's
// DefinitionsService: transitions are explicit calls, never an implicit
// side effect of create/update, and a PUBLISHED row's content is never
// mutated in place.
//
// Deliberately NOT wired into any family-facing read path yet -- the
// existing free-text ComplianceRequirement.jurisdiction field keeps
// resolving exactly as before for every family that hasn't set
// jurisdictionDefinitionId. That cutover, and the compliance-evaluation
// engine issue #26 also describes, are separate follow-on work.
@Injectable()
export class JurisdictionDefinitionsService {
  constructor(private readonly repository: JurisdictionDefinitionsRepository) {}

  async create(dto: CreateJurisdictionDefinitionOutput): Promise<JurisdictionDefinitionResponseDto> {
    try {
      const row = await this.repository.create(dto);
      return this.toDto(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This jurisdiction code/version already exists.');
      }
      throw error;
    }
  }

  async list(): Promise<JurisdictionDefinitionResponseDto[]> {
    const rows = await this.repository.list();
    return rows.map((row) => this.toDto(row));
  }

  async findByCode(code: string): Promise<JurisdictionDefinitionResponseDto[]> {
    const rows = await this.repository.findByCode(code);
    return rows.map((row) => this.toDto(row));
  }

  async transitionStatus(id: string, status: DefinitionStatus): Promise<JurisdictionDefinitionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Jurisdiction definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateStatus(id, update);
    return this.toDto(row);
  }

  private toDto(row: JurisdictionDefinition): JurisdictionDefinitionResponseDto {
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
}
