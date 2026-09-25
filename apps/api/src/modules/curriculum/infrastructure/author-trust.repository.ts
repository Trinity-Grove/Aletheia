import { Injectable } from '@nestjs/common';
import type { AuthorTrustProfile, Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

@Injectable()
export class AuthorTrustRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string): Promise<AuthorTrustProfile | null> {
    return this.prisma.authorTrustProfile.findUnique({ where: { userId } });
  }

  create(userId: string, data?: Partial<Prisma.AuthorTrustProfileCreateInput>): Promise<AuthorTrustProfile> {
    return this.prisma.authorTrustProfile.create({
      data: {
        userId,
        trustScore: data?.trustScore ?? 10,
        tier: data?.tier ?? 'NOVICE',
        approvedPacksCount: data?.approvedPacksCount ?? 0,
        rejectedPacksCount: data?.rejectedPacksCount ?? 0,
        upheldReportsCount: data?.upheldReportsCount ?? 0,
      },
    });
  }

  update(userId: string, data: Prisma.AuthorTrustProfileUpdateInput): Promise<AuthorTrustProfile> {
    return this.prisma.authorTrustProfile.update({
      where: { userId },
      data,
    });
  }
}
