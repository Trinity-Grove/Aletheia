import { Injectable } from '@nestjs/common';
import type { PedagogicalModelCatalogEntryDto, TemplateSubjectDefinition } from '@aletheia/contracts';
import { pedagogicalModelMetadataSchema } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface PublishedPedagogicalModel {
  id: string;
  subjects: TemplateSubjectDefinition[];
}

@Injectable()
export class PedagogicalModelDefinitionResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolvePublished(code: string): Promise<PublishedPedagogicalModel | null> {
    const row = await this.prisma.pedagogicalModelDefinition.findFirst({
      where: { code, status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    });

    if (!row) return null;

    return { id: row.id, subjects: pedagogicalModelMetadataSchema.parse(row.metadata).subjects };
  }
  async getSubjectDefinitions(code: string): Promise<TemplateSubjectDefinition[]> {
    return (await this.resolvePublished(code))?.subjects ?? [];
  }

  // Family-facing catalog (issue #96 section 35: a family should be able
  // to discover a new PUBLISHED model without a release). Same
  // "PUBLISHED, ordered by version desc" shape resolvePublished() already
  // uses, but across every code rather than one -- so it's done in one
  // query plus an in-memory dedupe (data volumes here are a handful of
  // frameworks, not worth a DISTINCT ON) rather than N findFirst calls.
  async listPublishedCatalog(): Promise<PedagogicalModelCatalogEntryDto[]> {
    const rows = await this.prisma.pedagogicalModelDefinition.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    const seenCodes = new Set<string>();
    const catalog: PedagogicalModelCatalogEntryDto[] = [];

    for (const row of rows) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);

      let subjects: TemplateSubjectDefinition[] | undefined;
      try {
        const meta = pedagogicalModelMetadataSchema.safeParse(row.metadata);
        if (meta.success && meta.data.subjects && meta.data.subjects.length > 0) {
          subjects = meta.data.subjects;
        }
      } catch {
        // ignore parsing error
      }

      catalog.push({
        code: row.code,
        name: row.name,
        description: row.description,
        ...(subjects ? { subjects } : {}),
      });
    }

    return catalog;
  }
}
