import { Injectable } from '@nestjs/common';
import type { FamilyCurriculumPackMedia, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class FamilyCurriculumPackMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    familyId: string,
    familyCurriculumPackId: string,
    data: Prisma.FamilyCurriculumPackMediaUncheckedCreateInput,
  ): Promise<FamilyCurriculumPackMedia | null> {
    const pack = await this.prisma.familyCurriculumPack.findFirst({
      where: { id: familyCurriculumPackId, familyId },
      select: { id: true },
    });
    if (!pack) return null;

    return this.prisma.familyCurriculumPackMedia.create({ data });
  }

  async list(
    familyId: string,
    familyCurriculumPackId: string,
  ): Promise<FamilyCurriculumPackMedia[] | null> {
    const pack = await this.prisma.familyCurriculumPack.findFirst({
      where: { id: familyCurriculumPackId, familyId },
      select: { id: true },
    });
    if (!pack) return null;

    return this.prisma.familyCurriculumPackMedia.findMany({
      where: { familyCurriculumPackId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(
    familyId: string,
    familyCurriculumPackId: string,
    id: string,
  ): Promise<boolean> {
    const media = await this.prisma.familyCurriculumPackMedia.findFirst({
      where: {
        id,
        familyCurriculumPackId,
        familyCurriculumPack: { familyId },
      },
      select: { id: true },
    });
    if (!media) return false;

    await this.prisma.familyCurriculumPackMedia.delete({ where: { id: media.id } });
    return true;
  }
}
