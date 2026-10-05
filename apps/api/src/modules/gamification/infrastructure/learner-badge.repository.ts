import { Injectable } from '@nestjs/common';
import type { LearnerBadgeAward } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface LearnerActivitySnapshot {
  records: {
    date: Date;
    durationMinutes: number | null;
    type: string;
    subjectId: string | null;
    characterHabitGrowth: string | null;
  }[];
  attendance: { date: Date; status: string }[];
  evidenceSubmitted: number;
  evidenceValidated: number;
  portfolioHighlights: number;
  competenciesAchieved: number;
  prayersAnswered: number;
}

// Read model over tables owned by records, reports, curriculum and
// devotional -- the same read-only cross-table pattern the compliance
// evaluation and report services use. Writes only learner_badge_awards.
@Injectable()
export class LearnerBadgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async learnerExists(familyId: string, learnerId: string): Promise<boolean> {
    const learner = await this.prisma.learner.findFirst({
      where: { id: learnerId, familyId },
      select: { id: true },
    });
    return Boolean(learner);
  }

  async loadActivity(familyId: string, learnerId: string): Promise<LearnerActivitySnapshot> {
    const scope = { familyId, learnerId };
    const [
      records,
      attendance,
      evidenceSubmitted,
      evidenceValidated,
      portfolioHighlights,
      competenciesAchieved,
      prayersAnswered,
    ] = await Promise.all([
      this.prisma.learningRecord.findMany({
        where: scope,
        select: { date: true, durationMinutes: true, type: true, subjectId: true, characterHabitGrowth: true },
      }),
      this.prisma.attendanceRecord.findMany({ where: scope, select: { date: true, status: true } }),
      this.prisma.evidenceSubmission.count({ where: scope }),
      this.prisma.evidenceSubmission.count({ where: { ...scope, validationStatus: 'VALIDATED' } }),
      this.prisma.portfolioItem.count({ where: { ...scope, isHighlight: true, deletedAt: null } }),
      this.prisma.learnerCompetencyAchievement.count({ where: scope }),
      this.prisma.prayerRequest.count({ where: { ...scope, isAnswered: true } }),
    ]);

    return {
      records,
      attendance,
      evidenceSubmitted,
      evidenceValidated,
      portfolioHighlights,
      competenciesAchieved,
      prayersAnswered,
    };
  }

  // Idempotent: the (learner_id, badge_code) unique key makes concurrent
  // reads that both detect a new unlock collapse into a single award.
  async grantAndList(familyId: string, learnerId: string, badgeCodes: string[]): Promise<LearnerBadgeAward[]> {
    if (badgeCodes.length > 0) {
      await this.prisma.learnerBadgeAward.createMany({
        data: badgeCodes.map((badgeCode) => ({ familyId, learnerId, badgeCode })),
        skipDuplicates: true,
      });
    }
    return this.prisma.learnerBadgeAward.findMany({
      where: { familyId, learnerId },
      orderBy: { awardedAt: 'asc' },
    });
  }

  async acknowledge(familyId: string, learnerId: string, badgeCodes?: string[]): Promise<number> {
    const result = await this.prisma.learnerBadgeAward.updateMany({
      where: {
        familyId,
        learnerId,
        acknowledgedAt: null,
        ...(badgeCodes ? { badgeCode: { in: badgeCodes } } : {}),
      },
      data: { acknowledgedAt: new Date() },
    });
    return result.count;
  }
}
