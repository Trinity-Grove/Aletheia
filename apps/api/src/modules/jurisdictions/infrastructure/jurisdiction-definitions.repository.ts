import { Injectable } from '@nestjs/common';
import type { JurisdictionDefinition, Prisma } from '@prisma/client';
import type { CreateJurisdictionDefinitionOutput } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { DefinitionStatusUpdate } from '../application/definition-status-transition.js';

// Thin CRUD for the JurisdictionDefinition Definition/Version table (issue
// #26). No business logic here -- status-transition validation lives in
// definition-status-transition.ts and is applied by the service layer,
// matching curriculum's DefinitionsRepository split.
@Injectable()
export class JurisdictionDefinitionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateJurisdictionDefinitionOutput): Promise<JurisdictionDefinition> {
    return this.prisma.jurisdictionDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  list(): Promise<JurisdictionDefinition[]> {
    return this.prisma.jurisdictionDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findById(id: string): Promise<JurisdictionDefinition | null> {
    return this.prisma.jurisdictionDefinition.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<JurisdictionDefinition[]> {
    return this.prisma.jurisdictionDefinition.findMany({
      where: { code },
      orderBy: [{ version: 'desc' }],
    });
  }

  // Current-for-code resolution: the highest-version PUBLISHED row. Mirrors
  // the "current" semantics DefinitionVersionOperationsService.rollback
  // relies on for every other catalog table (a rollback deprecates the
  // published version, so this naturally falls back to the next one).
  findCurrentPublishedByCode(code: string): Promise<JurisdictionDefinition | null> {
    return this.prisma.jurisdictionDefinition.findFirst({
      where: { code, status: 'PUBLISHED' },
      orderBy: [{ version: 'desc' }],
    });
  }

  updateStatus(id: string, update: DefinitionStatusUpdate): Promise<JurisdictionDefinition> {
    return this.prisma.jurisdictionDefinition.update({ where: { id }, data: update });
  }
}
