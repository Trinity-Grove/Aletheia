import { Injectable, NotFoundException } from '@nestjs/common';
import type { LearnerGamificationStatsDto, LearnerGamificationSummaryDto } from '@aletheia/contracts';
import {
  LearnerBadgeRepository,
  type LearnerActivitySnapshot,
} from '../infrastructure/learner-badge.repository.js';
import { BADGE_CATALOG } from './badge-catalog.js';
import { buildSummary, computeStreak, isBadgeEarned, type StreakResult } from './badge-engine.js';
import type { GamificationPublicApi } from './public-api.js';

const ACTIVE_ATTENDANCE = new Set(['PRESENT', 'FIELD_TRIP']);
const GRACE_ATTENDANCE = new Set(['HOLIDAY', 'SICK', 'EXCUSED_ABSENCE']);

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function deriveStats(
  activity: LearnerActivitySnapshot,
  today: string,
): { stats: LearnerGamificationStatsDto; streak: StreakResult } {
  const activeDates = new Set<string>();
  const graceDates = new Set<string>();
  const subjects = new Set<string>();
  let minutes = 0;
  let readingLogs = 0;
  let projects = 0;
  let habits = 0;

  for (const record of activity.records) {
    activeDates.add(isoDay(record.date));
    if (record.subjectId) subjects.add(record.subjectId);
    minutes += Math.max(0, record.durationMinutes ?? 0);
    if (record.type === 'READING_LOG') readingLogs += 1;
    if (record.type === 'PROJECT_WORK') projects += 1;
    if (record.type === 'HABIT_PRACTICE' || record.characterHabitGrowth?.trim()) habits += 1;
  }
  for (const entry of activity.attendance) {
    if (ACTIVE_ATTENDANCE.has(entry.status)) activeDates.add(isoDay(entry.date));
    else if (GRACE_ATTENDANCE.has(entry.status)) graceDates.add(isoDay(entry.date));
  }

  const streak = computeStreak({ activeDates, graceDates, today });
  return {
    streak,
    stats: {
      LEARNING_DAYS: activeDates.size,
      LONGEST_STREAK: streak.longest,
      LEARNING_RECORDS: activity.records.length,
      LEARNING_MINUTES: minutes,
      READING_LOGS: readingLogs,
      EVIDENCE_SUBMITTED: activity.evidenceSubmitted,
      EVIDENCE_VALIDATED: activity.evidenceValidated,
      PORTFOLIO_HIGHLIGHTS: activity.portfolioHighlights,
      PROJECTS: projects,
      COMPETENCIES_ACHIEVED: activity.competenciesAchieved,
      SUBJECTS_EXPLORED: subjects.size,
      HABIT_PRACTICES: habits,
      PRAYERS_ANSWERED: activity.prayersAnswered,
    },
  };
}

// Badges are evaluated lazily on read: there is no event bus in this
// codebase, and every metric is derivable from records the family already
// keeps, so reading the summary is what grants any newly reached badge.
@Injectable()
export class GamificationService implements GamificationPublicApi {
  constructor(private readonly repository: LearnerBadgeRepository) {}

  async getSummary(familyId: string, learnerId: string, today = isoDay(new Date())): Promise<LearnerGamificationSummaryDto> {
    await this.assertLearner(familyId, learnerId);
    const activity = await this.repository.loadActivity(familyId, learnerId);
    const { stats, streak } = deriveStats(activity, today);
    const reached = BADGE_CATALOG.filter((badge) => isBadgeEarned(badge, stats)).map((badge) => badge.code);
    const awards = await this.repository.grantAndList(familyId, learnerId, reached);
    return buildSummary({ learnerId, stats, streak, awards });
  }

  async acknowledgeBadges(familyId: string, learnerId: string, badgeCodes?: string[]): Promise<number> {
    await this.assertLearner(familyId, learnerId);
    return this.repository.acknowledge(familyId, learnerId, badgeCodes);
  }

  private async assertLearner(familyId: string, learnerId: string): Promise<void> {
    if (!(await this.repository.learnerExists(familyId, learnerId))) {
      throw new NotFoundException('Learner not found');
    }
  }
}
