import { learnerBadgeMetricSchema, type LearnerGamificationStatsDto } from '@aletheia/contracts';
import { BADGE_CATALOG } from './badge-catalog.js';
import { buildSummary, computeLevel, computeStreak, isBadgeEarned } from './badge-engine.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function stats(overrides: Partial<LearnerGamificationStatsDto> = {}): LearnerGamificationStatsDto {
  const base = Object.fromEntries(learnerBadgeMetricSchema.options.map((metric) => [metric, 0]));
  return { ...base, ...overrides } as LearnerGamificationStatsDto;
}

const noStreak = { current: 0, longest: 0, activeToday: false };

describe('badge catalog', () => {
  it('has unique codes and positive thresholds', () => {
    const codes = BADGE_CATALOG.map((badge) => badge.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const badge of BADGE_CATALOG) expect(badge.threshold).toBeGreaterThan(0);
  });
});

describe('computeStreak', () => {
  // 2026-09-28 is a Monday; 2026-10-05 is the following Monday.
  it('counts consecutive weekdays and lets weekends bridge the streak', () => {
    const result = computeStreak({
      activeDates: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05'],
      graceDates: [],
      today: '2026-10-05',
    });
    expect(result).toEqual({ current: 6, longest: 6, activeToday: true });
  });

  it('does not break the current streak just because today has no activity yet', () => {
    const result = computeStreak({
      activeDates: ['2026-10-01', '2026-10-02'],
      graceDates: [],
      today: '2026-10-05',
    });
    expect(result).toEqual({ current: 2, longest: 2, activeToday: false });
  });

  it('treats holiday/sick days as rest instead of a break', () => {
    const result = computeStreak({
      activeDates: ['2026-09-28', '2026-09-30'],
      graceDates: ['2026-09-29'],
      today: '2026-09-30',
    });
    expect(result.current).toBe(2);
  });

  it('breaks on a missed weekday and keeps the longest run', () => {
    const result = computeStreak({
      activeDates: ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-28'],
      graceDates: [],
      today: '2026-10-01',
    });
    expect(result).toEqual({ current: 0, longest: 3, activeToday: false });
  });

  it('returns zeros when there is no activity', () => {
    expect(computeStreak({ activeDates: [], graceDates: [], today: '2026-10-05' })).toEqual(noStreak);
  });
});

describe('computeLevel', () => {
  it('maps xp to growth stages with inclusive lower bounds', () => {
    expect(computeLevel(0)).toEqual({ code: 'SEED', number: 1, currentLevelXp: 0, nextLevelXp: 100 });
    expect(computeLevel(100).code).toBe('SPROUT');
    expect(computeLevel(999).code).toBe('SAPLING');
  });

  it('has no next level at the top stage', () => {
    expect(computeLevel(99_999)).toEqual({ code: 'MIGHTY_OAK', number: 8, currentLevelXp: 4000, nextLevelXp: null });
  });
});

describe('isBadgeEarned', () => {
  const firstStep = BADGE_CATALOG.find((badge) => badge.code === 'FIRST_STEP')!;
  it('compares the badge metric with its threshold', () => {
    expect(isBadgeEarned(firstStep, stats())).toBe(false);
    expect(isBadgeEarned(firstStep, stats({ LEARNING_DAYS: 1 }))).toBe(true);
  });
});

describe('buildSummary', () => {
  it('marks awarded badges, flags unacknowledged ones as new and adds tier xp', () => {
    const awardedAt = new Date('2026-10-05T12:00:00.000Z');
    const summary = buildSummary({
      learnerId: LEARNER_ID,
      stats: stats({ LEARNING_DAYS: 2, LEARNING_RECORDS: 3 }),
      streak: { current: 2, longest: 2, activeToday: true },
      awards: [{ badgeCode: 'FIRST_STEP', awardedAt, acknowledgedAt: null }],
    });

    const firstStep = summary.badges.find((badge) => badge.code === 'FIRST_STEP')!;
    expect(firstStep).toMatchObject({ earned: true, isNew: true, awardedAt: awardedAt.toISOString() });
    expect(summary.badges.find((badge) => badge.code === 'LESSONS_10')).toMatchObject({
      earned: false,
      current: 3,
      threshold: 10,
    });
    // 2 days * 5 + 3 records * 10 + bronze 20
    expect(summary.xp).toBe(60);
    expect(summary.earnedCount).toBe(1);
    expect(summary.totalCount).toBe(BADGE_CATALOG.length);
  });

  it('keeps an award earned even if its metric later dropped', () => {
    const summary = buildSummary({
      learnerId: LEARNER_ID,
      stats: stats(),
      streak: noStreak,
      awards: [{ badgeCode: 'FIRST_EVIDENCE', awardedAt: new Date(), acknowledgedAt: new Date() }],
    });
    expect(summary.badges.find((badge) => badge.code === 'FIRST_EVIDENCE')).toMatchObject({
      earned: true,
      isNew: false,
      current: 0,
    });
  });

  it('ignores persisted awards whose code is no longer in the catalog', () => {
    const summary = buildSummary({
      learnerId: LEARNER_ID,
      stats: stats(),
      streak: noStreak,
      awards: [{ badgeCode: 'RETIRED_BADGE', awardedAt: new Date(), acknowledgedAt: null }],
    });
    expect(summary.earnedCount).toBe(0);
    expect(summary.xp).toBe(0);
  });
});
