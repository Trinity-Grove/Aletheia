import { z } from 'zod';

// Learner gamification (badges, growth level, streak). Strictly
// self-referential: every number here describes one learner's own journey
// and is never compared against another learner (README guardrail "No
// Sibling Ranking / Comparisons").

export const learnerBadgeCategorySchema = z.enum([
  'CONSISTENCY',
  'LEARNING',
  'EVIDENCE',
  'MASTERY',
  'EXPLORATION',
  'CHARACTER',
]);
export type LearnerBadgeCategory = z.infer<typeof learnerBadgeCategorySchema>;

export const learnerBadgeTierSchema = z.enum(['BRONZE', 'SILVER', 'GOLD']);
export type LearnerBadgeTier = z.infer<typeof learnerBadgeTierSchema>;

export const learnerBadgeMetricSchema = z.enum([
  'LEARNING_DAYS',
  'LONGEST_STREAK',
  'LEARNING_RECORDS',
  'LEARNING_MINUTES',
  'READING_LOGS',
  'EVIDENCE_SUBMITTED',
  'EVIDENCE_VALIDATED',
  'PORTFOLIO_HIGHLIGHTS',
  'PROJECTS',
  'COMPETENCIES_ACHIEVED',
  'SUBJECTS_EXPLORED',
  'HABIT_PRACTICES',
  'PRAYERS_ANSWERED',
]);
export type LearnerBadgeMetric = z.infer<typeof learnerBadgeMetricSchema>;

export const learnerGrowthLevelSchema = z.enum([
  'SEED',
  'SPROUT',
  'SEEDLING',
  'SAPLING',
  'YOUNG_TREE',
  'FLOURISHING_TREE',
  'FRUITFUL_TREE',
  'MIGHTY_OAK',
]);
export type LearnerGrowthLevel = z.infer<typeof learnerGrowthLevelSchema>;

export const learnerBadgeSchema = z.object({
  code: z.string().min(1),
  category: learnerBadgeCategorySchema,
  tier: learnerBadgeTierSchema,
  icon: z.string().min(1),
  metric: learnerBadgeMetricSchema,
  threshold: z.number().int().positive(),
  current: z.number().int().nonnegative(),
  earned: z.boolean(),
  awardedAt: z.string().datetime().nullable(),
  // Earned but not yet acknowledged by the learner in the portal.
  isNew: z.boolean(),
});
export type LearnerBadgeDto = z.infer<typeof learnerBadgeSchema>;

export const learnerGamificationStatsSchema = z.record(
  learnerBadgeMetricSchema,
  z.number().int().nonnegative(),
);
export type LearnerGamificationStatsDto = z.infer<typeof learnerGamificationStatsSchema>;

export const learnerGamificationSummarySchema = z.object({
  learnerId: z.string().uuid(),
  xp: z.number().int().nonnegative(),
  level: z.object({
    code: learnerGrowthLevelSchema,
    number: z.number().int().positive(),
    currentLevelXp: z.number().int().nonnegative(),
    nextLevelXp: z.number().int().positive().nullable(),
  }),
  streak: z.object({
    current: z.number().int().nonnegative(),
    longest: z.number().int().nonnegative(),
    activeToday: z.boolean(),
  }),
  stats: learnerGamificationStatsSchema,
  badges: z.array(learnerBadgeSchema),
  earnedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});
export type LearnerGamificationSummaryDto = z.infer<typeof learnerGamificationSummarySchema>;

export const acknowledgeLearnerBadgesSchema = z.object({
  badgeCodes: z.array(z.string().min(1).max(64)).max(100).optional(),
});
export type AcknowledgeLearnerBadgesDto = z.input<typeof acknowledgeLearnerBadgesSchema>;
export type AcknowledgeLearnerBadgesOutput = z.output<typeof acknowledgeLearnerBadgesSchema>;

export const acknowledgeLearnerBadgesResponseSchema = z.object({
  acknowledged: z.number().int().nonnegative(),
});
export type AcknowledgeLearnerBadgesResponseDto = z.infer<typeof acknowledgeLearnerBadgesResponseSchema>;
