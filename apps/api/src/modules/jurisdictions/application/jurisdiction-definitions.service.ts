import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JurisdictionDefinition } from '@prisma/client';
import type {
  CreateJurisdictionDefinitionOutput,
  JurisdictionDefinitionResponseDto,
  DefinitionStatus,
  FamilyJurisdictionResponseDto,
  JurisdictionConfidenceLevel,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { JurisdictionDefinitionsRepository } from '../infrastructure/jurisdiction-definitions.repository.js';
import { computeStatusTransition } from './definition-status-transition.js';

// Admin CRUD for the versioned jurisdiction/compliance catalog (issue #26,
// "Brasil como organizador/complemento" first slice). Same DRAFT ->
// PUBLISHED -> DEPRECATED -> ARCHIVED discipline as curriculum's
// DefinitionsService: transitions are explicit calls, never an implicit
// side effect of create/update, and a PUBLISHED row's content is never
// mutated in place.
@Injectable()
export class JurisdictionDefinitionsService {
  constructor(
    private readonly repository: JurisdictionDefinitionsRepository,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

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

  async getFamilyJurisdiction(familyId: string): Promise<FamilyJurisdictionResponseDto> {
    let code = 'BR';

    if (this.prisma && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(familyId)) {
      const requirement = await this.prisma.complianceRequirement.findFirst({
        where: { familyId },
        select: { jurisdiction: true, jurisdictionDefinitionId: true },
      });

      if (requirement?.jurisdictionDefinitionId) {
        const pinnedDef = await this.repository.findById(requirement.jurisdictionDefinitionId);
        if (pinnedDef) {
          return this.toFamilyJurisdictionDto(pinnedDef);
        }
      }

      if (requirement?.jurisdiction) {
        code = requirement.jurisdiction;
      } else {
        const family = await this.prisma.family.findUnique({
          where: { id: familyId },
          select: { countryCode: true },
        });
        if (family?.countryCode) {
          code = family.countryCode;
        }
      }
    }

    const definition = await this.repository.findCurrentPublishedByCode(code);
    if (definition) {
      return this.toFamilyJurisdictionDto(definition);
    }

    return {
      code: 'BR',
      name: 'Brasil (Referencial Nacional)',
      version: 1,
      confidenceLevel: 'ESTABLISHED',
      minInstructionalDays: 200,
      minInstructionalHours: 800,
      officialSource:
        'Lei de Diretrizes e Bases da Educação Nacional (Lei 9.394/1996) e Jurisprudência do STF (RE 888.815)',
      legalBasisSummary:
        'Liberdade constitucional da família na condução pedagógica e dever de comprovação de instrução regular.',
    };
  }

  private toFamilyJurisdictionDto(row: JurisdictionDefinition): FamilyJurisdictionResponseDto {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    return {
      code: row.code,
      name: row.name,
      version: row.version,
      confidenceLevel: (meta.confidenceLevel as JurisdictionConfidenceLevel) ?? 'ESTABLISHED',
      minInstructionalDays: typeof meta.minInstructionalDays === 'number' ? meta.minInstructionalDays : null,
      minInstructionalHours: typeof meta.minInstructionalHours === 'number' ? meta.minInstructionalHours : null,
      officialSource: typeof meta.officialSource === 'string' ? meta.officialSource : null,
      legalBasisSummary:
        typeof meta.legalBasisNotes === 'string'
          ? meta.legalBasisNotes
          : typeof meta.summary === 'string'
            ? meta.summary
            : null,
    };
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
