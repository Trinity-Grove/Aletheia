import { Injectable } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackCompositionRevision, CurriculumPackItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface CompositionItemInput {
  definitionType: string;
  code: string;
  version: number;
}

export class CompositionRevisionConflictError extends Error {
  constructor(public readonly currentRevision: number) {
    super(`Composition revision conflict. Current revision is ${currentRevision}.`);
  }
}

@Injectable()
export class CurriculumPackCompositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrent(packId: string): Promise<(CurriculumPack & { items: CurriculumPackItem[] }) | null> {
    return this.prisma.curriculumPack.findUnique({
      where: { id: packId },
      include: { items: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
    });
  }

  listRevisions(packId: string): Promise<CurriculumPackCompositionRevision[]> {
    return this.prisma.curriculumPackCompositionRevision.findMany({
      where: { packId },
      orderBy: { revision: 'desc' },
    });
  }

  async replace(
    packId: string,
    expectedRevision: number,
    items: CompositionItemInput[],
  ): Promise<{
    pack: CurriculumPack;
    items: CurriculumPackItem[];
    revision: number;
    changed: boolean;
  } | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.curriculumPack.findUnique({
        where: { id: packId },
        include: { items: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
      });
      if (!current) return null;
      if (current.compositionRevision !== expectedRevision) {
        throw new CompositionRevisionConflictError(current.compositionRevision);
      }

      const currentRefs = current.items.map(({ definitionType, code, version }) => ({ definitionType, code, version }));
      const changed = JSON.stringify(currentRefs) !== JSON.stringify(items);
      if (!changed) {
        return { pack: current, items: current.items, revision: current.compositionRevision, changed: false };
      }

      const revision = current.compositionRevision + 1;
      await tx.curriculumPackItem.deleteMany({ where: { packId } });
      if (items.length > 0) {
        await tx.curriculumPackItem.createMany({
          data: items.map((item, position) => ({ ...item, packId, position })),
        });
      }

      const pack = await tx.curriculumPack.update({
        where: { id: packId },
        data: { compositionRevision: revision },
      });
      await tx.curriculumPackCompositionRevision.create({
        data: {
          packId,
          revision,
          items: items.map((item, position) => ({ ...item, position })) as Prisma.InputJsonValue,
        },
      });

      const updatedItems = await tx.curriculumPackItem.findMany({
        where: { packId },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });
      return { pack, items: updatedItems, revision, changed: true };
    });
  }
}
