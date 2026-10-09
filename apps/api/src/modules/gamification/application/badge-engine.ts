import type {
  LearnerBadgeMetric,
  LearnerGamificationSummaryDto,
  LearnerGamificationStatsDto,
} from '@aletheia/contracts';
import {
  BADGE_CATALOG,
  BADGE_TIER_XP,
  GROWTH_LEVELS,
  METRIC_XP,
  type BadgeDefinition,
} from './badge-catalog.js';

// Pure, side-effect-free gamification rules. Everything here takes plain
// values so the rules can be unit-tested without a database.

const DAY_MS = 86_400_000;

function toDayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00.000Z`) / DAY_MS);
}

function isWeekend(dayNumber: number): boolean {
  // 1970-01-01 (day 0) was a Thursday.
  const weekday = (dayNumber + 4) % 7; // 0 = Sunday
  return weekday === 0 || weekday === 6;
}

export interface StreakInput {
  // YYYY-MM-DD days on which the learner actually learned.
  activeDates: Iterable<string>;
  // YYYY-MM-DD days the family marked as rest (holiday, sick, excused).
  graceDates: Iterable<string>;
  today: string;
}

export interface StreakResult {
  current: number;
  longest: number;
  activeToday: boolean;
}

// A streak counts consecutive learning days. Weekends and days the family
// recorded as holiday/sick/excused never break a streak (and never count
// toward it): a child must not lose progress for resting or being ill.
// Today never breaks the current streak either -- the day is not over yet.
export function computeStreak({ activeDates, graceDates, today }: StreakInput): StreakResult {
  const active = new Set<number>();
  for (const date of activeDates) active.add(toDayNumber(date));
  const grace = new Set<number>();
  for (const date of graceDates) grace.add(toDayNumber(date));

  const isRest = (day: number) => !active.has(day) && (isWeekend(day) || grace.has(day));
  const sorted = [...active].sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let previous: number | undefined;
  for (const day of sorted) {
    let connected = previous !== undefined;
    for (let gap = (previous ?? day) + 1; connected && gap < day; gap += 1) {
      if (!isRest(gap)) connected = false;
    }
    run = connected ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  const todayNumber = toDayNumber(today);
  const earliest = sorted[0];
  let current = 0;
  if (earliest !== undefined) {
    for (let day = todayNumber; day >= earliest; day -= 1) {
      if (active.has(day)) current += 1;
      else if (day !== todayNumber && !isRest(day)) break;
    }
  }

  return { current, longest: Math.max(longest, current), activeToday: active.has(todayNumber) };
}

export function computeLevel(xp: number): LearnerGamificationSummaryDto['level'] {
  let index = 0;
  for (let i = 0; i < GROWTH_LEVELS.length; i += 1) {
    if (xp >= GROWTH_LEVELS[i]!.minXp) index = i;
  }
  const level = GROWTH_LEVELS[index]!;
  const next = GROWTH_LEVELS[index + 1];
  return {
    code: level.code,
    number: index + 1,
    currentLevelXp: level.minXp,
    nextLevelXp: next ? next.minXp : null,
  };
}

export function isBadgeEarned(badge: BadgeDefinition, stats: LearnerGamificationStatsDto): boolean {
  return stats[badge.metric] >= badge.threshold;
}

export interface AwardState {
  badgeCode: string;
  awardedAt: Date;
  acknowledgedAt: Date | null;
}

export interface SummaryInput {
  learnerId: string;
  stats: LearnerGamificationStatsDto;
  streak: StreakResult;
  // Persisted awards, including the ones just granted for this read.
  awards: AwardState[];
  catalog?: readonly BadgeDefinition[];
}

// Awards are append-only: a badge stays earned even if the metric that
// unlocked it later drops (e.g. a guardian deletes a record). Children keep
// what they earned.
export function buildSummary({
  learnerId,
  stats,
  streak,
  awards,
  catalog = BADGE_CATALOG,
}: SummaryInput): LearnerGamificationSummaryDto {
  const awardsByCode = new Map(awards.map((award) => [award.badgeCode, award]));

  const badges = catalog.map((badge) => {
    const award = awardsByCode.get(badge.code);
    return {
      code: badge.code,
      category: badge.category,
      tier: badge.tier,
      icon: badge.icon,
      metric: badge.metric,
      threshold: badge.threshold,
      current: Math.max(0, Math.trunc(stats[badge.metric])),
      earned: Boolean(award),
      awardedAt: award ? award.awardedAt.toISOString() : null,
      isNew: Boolean(award && !award.acknowledgedAt),
    };
  });

  let xp = 0;
  for (const [metric, perUnit] of Object.entries(METRIC_XP) as [LearnerBadgeMetric, number][]) {
    xp += stats[metric] * perUnit;
  }
  for (const badge of catalog) {
    if (awardsByCode.has(badge.code)) xp += BADGE_TIER_XP[badge.tier];
  }

  const earnedCount = badges.filter((badge) => badge.earned).length;
  return {
    learnerId,
    xp,
    level: computeLevel(xp),
    streak,
    stats,
    badges,
    earnedCount,
    totalCount: badges.length,
  };
}
