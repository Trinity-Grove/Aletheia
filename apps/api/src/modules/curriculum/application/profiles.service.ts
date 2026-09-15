import { Injectable } from '@nestjs/common';
import type { PedagogicalProfile, TheologicalProfile } from '@prisma/client';
import type {
  PedagogicalProfileResponseDto,
  SecondaryPedagogicalModel,
  TheologicalProfileResponseDto,
  UpsertPedagogicalProfileOutput,
  UpsertTheologicalProfileOutput,
} from '@aletheia/contracts';
import { ProfilesRepository } from '../infrastructure/profiles.repository.js';

// Family-scoped profile CRUD (issue #96 Fase 1, sections 13/14). Read +
// upsert only -- "upsert" always creates a new version, never mutates an
// existing row (see ProfilesRepository). getPedagogicalProfile is now also
// consumed by CurriculumService.applyTemplate (issue #95, human-approved)
// to weight -- never filter -- the subject set an applied template
// resolves; reused here exactly as-is, so that read path stays
// family-scoped the same way every other consumer of this service is.
@Injectable()
export class ProfilesService {
  constructor(private readonly repository: ProfilesRepository) {}

  async getPedagogicalProfile(familyId: string): Promise<PedagogicalProfileResponseDto | null> {
    const row = await this.repository.findLatestPedagogicalProfile(familyId);
    return row ? this.toPedagogicalProfileDto(row) : null;
  }

  async upsertPedagogicalProfile(
    familyId: string,
    dto: UpsertPedagogicalProfileOutput,
    actorId: string,
  ): Promise<PedagogicalProfileResponseDto> {
    const row = await this.repository.createPedagogicalProfileVersion(familyId, dto, actorId);
    return this.toPedagogicalProfileDto(row);
  }

  async listPedagogicalProfileHistory(familyId: string): Promise<PedagogicalProfileResponseDto[]> {
    const rows = await this.repository.listPedagogicalProfileHistory(familyId);
    return rows.map((row) => this.toPedagogicalProfileDto(row));
  }

  async getTheologicalProfile(familyId: string): Promise<TheologicalProfileResponseDto | null> {
    const row = await this.repository.findLatestTheologicalProfile(familyId);
    return row ? this.toTheologicalProfileDto(row) : null;
  }

  async upsertTheologicalProfile(
    familyId: string,
    dto: UpsertTheologicalProfileOutput,
    actorId: string,
  ): Promise<TheologicalProfileResponseDto> {
    const row = await this.repository.createTheologicalProfileVersion(familyId, dto, actorId);
    return this.toTheologicalProfileDto(row);
  }

  async listTheologicalProfileHistory(familyId: string): Promise<TheologicalProfileResponseDto[]> {
    const rows = await this.repository.listTheologicalProfileHistory(familyId);
    return rows.map((row) => this.toTheologicalProfileDto(row));
  }

  private toPedagogicalProfileDto(row: PedagogicalProfile): PedagogicalProfileResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      version: row.version,
      primaryModelCode: row.primaryModelCode,
      createdByUserId: row.createdByUserId,
      secondaryModels: row.secondaryModels as unknown as SecondaryPedagogicalModel[],
      overrides: row.overrides as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toTheologicalProfileDto(row: TheologicalProfile): TheologicalProfileResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      version: row.version,
      preferredTraditionCode: row.preferredTraditionCode,
      createdByUserId: row.createdByUserId,
      topicOverrides: row.topicOverrides as Record<string, string>,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
