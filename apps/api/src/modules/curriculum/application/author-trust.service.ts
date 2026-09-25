import { Injectable } from '@nestjs/common';
import type { AuthorTrustProfile, AuthorTrustTier } from '@prisma/client';
import { AuthorTrustRepository } from '../infrastructure/author-trust.repository.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface TrustScoreFactors {
  accountAgeDays: number;
  approvedCount: number;
  rejectedCount: number;
  upheldReportsCount: number;
}

export function computeTrustScore(factors: TrustScoreFactors): { score: number; tier: AuthorTrustTier } {
  const base = 10;
  const accountBonus = Math.min(20, Math.floor(Math.max(0, factors.accountAgeDays) / 30) * 5);
  const approvedBonus = Math.max(0, factors.approvedCount) * 15;
  const reportPenalty = Math.max(0, factors.upheldReportsCount) * 20;
  const rejectionPenalty = Math.max(0, factors.rejectedCount) * 30;

  const raw = base + accountBonus + approvedBonus - reportPenalty - rejectionPenalty;
  const score = Math.max(0, Math.min(100, raw));
  const tier: AuthorTrustTier = score >= 80 ? 'TRUSTED' : score >= 40 ? 'VERIFIED' : 'NOVICE';

  return { score, tier };
}

function calculateAccountAgeDays(createdAt: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - createdAt.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

@Injectable()
export class AuthorTrustService {
  constructor(
    private readonly repository: AuthorTrustRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getOrCreateProfile(userId: string): Promise<AuthorTrustProfile> {
    const profile = await this.repository.findByUserId(userId);
    if (profile) {
      return profile;
    }
    return this.repository.create(userId);
  }

  async recalculateScore(userId: string, accountCreatedAt?: Date): Promise<AuthorTrustProfile> {
    const profile = await this.getOrCreateProfile(userId);
    let createdAt = accountCreatedAt;
    if (!createdAt) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { createdAt: true },
      });
      createdAt = user.createdAt;
    }
    const accountAgeDays = calculateAccountAgeDays(createdAt);
    const { score, tier } = computeTrustScore({
      accountAgeDays,
      approvedCount: profile.approvedPacksCount,
      rejectedCount: profile.rejectedPacksCount,
      upheldReportsCount: profile.upheldReportsCount,
    });
    return this.repository.update(userId, {
      trustScore: score,
      tier,
      lastEvaluatedAt: new Date(),
    });
  }

  async onPackApproved(userId: string): Promise<AuthorTrustProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { createdAt: true },
    });
    const accountAgeDays = calculateAccountAgeDays(user.createdAt);
    const approvedPacksCount = profile.approvedPacksCount + 1;
    const { score, tier } = computeTrustScore({
      accountAgeDays,
      approvedCount: approvedPacksCount,
      rejectedCount: profile.rejectedPacksCount,
      upheldReportsCount: profile.upheldReportsCount,
    });
    return this.repository.update(userId, {
      approvedPacksCount,
      trustScore: score,
      tier,
      lastEvaluatedAt: new Date(),
    });
  }

  async onPackRejected(userId: string): Promise<AuthorTrustProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { createdAt: true },
    });
    const accountAgeDays = calculateAccountAgeDays(user.createdAt);
    const rejectedPacksCount = profile.rejectedPacksCount + 1;
    const { score, tier } = computeTrustScore({
      accountAgeDays,
      approvedCount: profile.approvedPacksCount,
      rejectedCount: rejectedPacksCount,
      upheldReportsCount: profile.upheldReportsCount,
    });
    return this.repository.update(userId, {
      rejectedPacksCount,
      trustScore: score,
      tier,
      lastEvaluatedAt: new Date(),
    });
  }

  async onReportUpheld(userId: string): Promise<AuthorTrustProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { createdAt: true },
    });
    const accountAgeDays = calculateAccountAgeDays(user.createdAt);
    const upheldReportsCount = profile.upheldReportsCount + 1;
    const { score, tier } = computeTrustScore({
      accountAgeDays,
      approvedCount: profile.approvedPacksCount,
      rejectedCount: profile.rejectedPacksCount,
      upheldReportsCount,
    });
    return this.repository.update(userId, {
      upheldReportsCount,
      trustScore: score,
      tier,
      lastEvaluatedAt: new Date(),
    });
  }
}
