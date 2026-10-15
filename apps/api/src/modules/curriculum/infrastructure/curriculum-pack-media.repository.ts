import { Injectable } from '@nestjs/common';
import type { CurriculumPackMedia, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class CurriculumPackMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPackByOriginFamilyPackId(originFamilyCurriculumPackId: string) {
    return this.prisma.curriculumPack.findUnique({ where: { originFamilyCurriculumPackId } });
  }

  async createCommunityMedia(
    curriculumPackId: string,
    media: Array<Omit<Prisma.CurriculumPackMediaUncheckedCreateInput, 'curriculumPackId'>>,
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      tx.curriculumPackMedia.createMany({
        data: media.map((item) => ({ ...item, curriculumPackId })),
        skipDuplicates: true,
      }),
    );
  }

  listPublicMedia(curriculumPackId: string): Promise<CurriculumPackMedia[]> {
    return this.prisma.curriculumPackMedia.findMany({
      where: { curriculumPackId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
