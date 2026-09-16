import { Injectable } from '@nestjs/common';
import type { ConsentDefinition, Prisma } from '@prisma/client';
import type { ConsentScope, CreateConsentDefinitionInput } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { DefinitionStatusUpdate } from '../application/definition-status-transition.js';

@Injectable()
export class ConsentDefinitionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateConsentDefinitionInput): Promise<ConsentDefinition> {
    return this.prisma.consentDefinition.create({
      data: {
        code: data.code,
        version: data.version ?? 1,
        status: 'DRAFT',
        schemaVersion: 1,
        scope: data.scope ?? 'FAMILY',
        mandatory: data.mandatory ?? false,
        title: data.title,
        description: data.description ?? null,
        content: data.content,
        purposes: data.purposes,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  list(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  findById(id: string): Promise<ConsentDefinition | null> {
    return this.prisma.consentDefinition.findUnique({
      where: { id },
    });
  }

  findByCode(code: string): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: { code },
      orderBy: [{ version: 'desc' }],
    });
  }

  findPublished(scope?: ConsentScope): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        status: 'PUBLISHED',
        ...(scope ? { scope } : {}),
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  updateStatus(id: string, update: DefinitionStatusUpdate): Promise<ConsentDefinition> {
    return this.prisma.consentDefinition.update({
      where: { id },
      data: update,
    });
  }
}
