import { describe, expect, it } from 'vitest';
import {
  acknowledgeLearnerBadgesSchema,
  learnerBadgeMetricSchema,
  learnerBadgeSchema,
  learnerGamificationSummarySchema,
} from './learner-badges.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const badge = {
  code: 'FIRST_STEP',
  category: 'CONSISTENCY',
  tier: 'BRONZE',
  icon: '🌱',
  metric: 'LEARNING_DAYS',
  threshold: 1,
  current: 1,
  earned: true,
  awardedAt: '2026-10-05T12:00:00.000Z',
  isNew: true,
} as const;

describe('learner badges contracts', () => {
  it('accepts an earned badge and a locked badge', () => {
    expect(learnerBadgeSchema.parse(badge)).toEqual(badge);
    expect(
      learnerBadgeSchema.parse({ ...badge, current: 0, earned: false, awardedAt: null, isNew: false }).earned,
    ).toBe(false);
  });

  it('rejects unknown metrics and tiers', () => {
    expect(() => learnerBadgeSchema.parse({ ...badge, metric: 'SIBLING_SCORE' })).toThrow();
    expect(() => learnerBadgeSchema.parse({ ...badge, tier: 'PLATINUM' })).toThrow();
  });

  it('validates a full summary with an open-ended top level', () => {
    const summary = learnerGamificationSummarySchema.parse({
      learnerId: LEARNER_ID,
      xp: 5000,
      level: { code: 'MIGHTY_OAK', number: 8, currentLevelXp: 4000, nextLevelXp: null },
      streak: { current: 3, longest: 10, activeToday: true },
      stats: Object.fromEntries(learnerBadgeMetricSchema.options.map((metric) => [metric, 1])),
      badges: [badge],
      earnedCount: 1,
      totalCount: 1,
    });
    expect(summary.level.nextLevelXp).toBeNull();
  });

  it('requires every metric in stats', () => {
    expect(() =>
      learnerGamificationSummarySchema.shape.stats.parse({ LEARNING_DAYS: 12 }),
    ).toThrow();
  });

  it('allows acknowledging all badges (no codes) or a bounded list', () => {
    expect(acknowledgeLearnerBadgesSchema.parse({})).toEqual({});
    expect(acknowledgeLearnerBadgesSchema.parse({ badgeCodes: ['FIRST_STEP'] }).badgeCodes).toEqual(['FIRST_STEP']);
    expect(() => acknowledgeLearnerBadgesSchema.parse({ badgeCodes: [''] })).toThrow();
  });
});
