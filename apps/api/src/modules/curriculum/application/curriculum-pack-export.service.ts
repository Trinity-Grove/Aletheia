import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CURRICULUM_PACK_EXPORT_FORMAT_VERSION,
  type CurriculumPackExportDocument,
  type CurriculumPackDefinitionType,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { exportDefinitionContent, findDefinitionByCodeVersion } from '../infrastructure/curriculum-pack-portability.js';

// Export a published CurriculumPack into a single portable JSON
// document (issue #96 Fase 4, section 28, read half): the pack's own
// metadata plus the full, portable content of every manifest item --
// not just IDs, since the receiving system won't have this database's
// UUIDs. Every foreign-key reference inside a definition's content is
// itself resolved to a {type, code, version} pointer.
@Injectable()
export class CurriculumPackExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packRepository: CurriculumPackRepository,
  ) {}

  async exportPack(packId: string): Promise<CurriculumPackExportDocument> {
    const pack = await this.packRepository.findPackById(packId);
    if (!pack) throw new NotFoundException('Curriculum pack not found.');
    if (pack.status !== 'PUBLISHED') {
      throw new BadRequestException('Only a PUBLISHED pack can be exported.');
    }

    const [items, dependencies] = await Promise.all([
      this.packRepository.listItems(packId),
      this.packRepository.listDependencies(packId),
    ]);

    const exportedItems = await Promise.all(
      items.map(async (item) => {
        const type = item.definitionType as CurriculumPackDefinitionType;
        const lookup = await findDefinitionByCodeVersion(this.prisma, type, item.code, item.version);
        if (!lookup) {
          throw new BadRequestException(
            `Pack manifest references ${type} ${item.code}@${item.version}, which no longer exists. ` +
              'Cannot export an inconsistent pack.',
          );
        }
        const content = await exportDefinitionContent(this.prisma, type, item.code, item.version);
        return {
          definitionType: type,
          code: item.code,
          version: item.version,
          status: lookup.status,
          schemaVersion: lookup.schemaVersion,
          content: content ?? {},
        };
      }),
    );

    return {
      formatVersion: CURRICULUM_PACK_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      pack: {
        code: pack.code,
        version: pack.version,
        status: pack.status,
        schemaVersion: pack.schemaVersion,
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata as Record<string, unknown>,
      },
      dependencies: dependencies.map((d) => ({
        dependsOnCode: d.dependsOnCode,
        dependsOnVersion: d.dependsOnVersion,
      })),
      items: exportedItems,
    };
  }
}
