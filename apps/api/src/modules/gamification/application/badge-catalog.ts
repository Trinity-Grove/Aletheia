import type {
  LearnerBadgeCategory,
  LearnerBadgeMetric,
  LearnerBadgeTier,
  LearnerGrowthLevel,
} from '@aletheia/contracts';

export interface BadgeDefinition {
  code: string;
  category: LearnerBadgeCategory;
  tier: LearnerBadgeTier;
  icon: string;
  metric: LearnerBadgeMetric;
  threshold: number;
}

// Display order is catalog order. Codes are stable identifiers persisted in
// learner_badge_awards -- rename the user-facing text (i18n) freely, but
// never rename or reuse a code, or already-earned awards stop resolving.
// Every badge rewards the learner's own effort and growth; none depends on
// any other learner's numbers.
export const BADGE_CATALOG: readonly BadgeDefinition[] = [
  // Consistency
  { code: 'FIRST_STEP', category: 'CONSISTENCY', tier: 'BRONZE', icon: '🌱', metric: 'LEARNING_DAYS', threshold: 1 },
  { code: 'STREAK_3', category: 'CONSISTENCY', tier: 'BRONZE', icon: '✨', metric: 'LONGEST_STREAK', threshold: 3 },
  { code: 'STREAK_7', category: 'CONSISTENCY', tier: 'SILVER', icon: '🔥', metric: 'LONGEST_STREAK', threshold: 7 },
  { code: 'STREAK_30', category: 'CONSISTENCY', tier: 'GOLD', icon: '🌟', metric: 'LONGEST_STREAK', threshold: 30 },
  { code: 'DAYS_30', category: 'CONSISTENCY', tier: 'SILVER', icon: '📅', metric: 'LEARNING_DAYS', threshold: 30 },
  { code: 'DAYS_100', category: 'CONSISTENCY', tier: 'GOLD', icon: '🗓️', metric: 'LEARNING_DAYS', threshold: 100 },

  // Learning journey
  { code: 'LESSONS_10', category: 'LEARNING', tier: 'BRONZE', icon: '📘', metric: 'LEARNING_RECORDS', threshold: 10 },
  { code: 'LESSONS_50', category: 'LEARNING', tier: 'SILVER', icon: '📚', metric: 'LEARNING_RECORDS', threshold: 50 },
  { code: 'LESSONS_150', category: 'LEARNING', tier: 'GOLD', icon: '🎓', metric: 'LEARNING_RECORDS', threshold: 150 },
  { code: 'HOURS_10', category: 'LEARNING', tier: 'BRONZE', icon: '⏳', metric: 'LEARNING_MINUTES', threshold: 600 },
  { code: 'HOURS_50', category: 'LEARNING', tier: 'SILVER', icon: '⌛', metric: 'LEARNING_MINUTES', threshold: 3000 },
  { code: 'HOURS_200', category: 'LEARNING', tier: 'GOLD', icon: '🕰️', metric: 'LEARNING_MINUTES', threshold: 12000 },
  { code: 'READER_5', category: 'LEARNING', tier: 'BRONZE', icon: '📖', metric: 'READING_LOGS', threshold: 5 },
  { code: 'READER_25', category: 'LEARNING', tier: 'SILVER', icon: '🦉', metric: 'READING_LOGS', threshold: 25 },

  // Evidence and works
  { code: 'FIRST_EVIDENCE', category: 'EVIDENCE', tier: 'BRONZE', icon: '📸', metric: 'EVIDENCE_SUBMITTED', threshold: 1 },
  { code: 'EVIDENCE_10', category: 'EVIDENCE', tier: 'SILVER', icon: '🎨', metric: 'EVIDENCE_SUBMITTED', threshold: 10 },
  { code: 'VALIDATED_10', category: 'EVIDENCE', tier: 'GOLD', icon: '✅', metric: 'EVIDENCE_VALIDATED', threshold: 10 },
  { code: 'PORTFOLIO_STAR', category: 'EVIDENCE', tier: 'SILVER', icon: '⭐', metric: 'PORTFOLIO_HIGHLIGHTS', threshold: 1 },
  { code: 'PROJECT_BUILDER', category: 'EVIDENCE', tier: 'SILVER', icon: '🛠️', metric: 'PROJECTS', threshold: 3 },

  // Mastery
  { code: 'FIRST_MASTERY', category: 'MASTERY', tier: 'BRONZE', icon: '🏅', metric: 'COMPETENCIES_ACHIEVED', threshold: 1 },
  { code: 'MASTERY_5', category: 'MASTERY', tier: 'SILVER', icon: '🏆', metric: 'COMPETENCIES_ACHIEVED', threshold: 5 },
  { code: 'MASTERY_15', category: 'MASTERY', tier: 'GOLD', icon: '👑', metric: 'COMPETENCIES_ACHIEVED', threshold: 15 },

  // Exploration
  { code: 'EXPLORER_3', category: 'EXPLORATION', tier: 'BRONZE', icon: '🧭', metric: 'SUBJECTS_EXPLORED', threshold: 3 },
  { code: 'EXPLORER_6', category: 'EXPLORATION', tier: 'SILVER', icon: '🗺️', metric: 'SUBJECTS_EXPLORED', threshold: 6 },

  // Character and faith
  { code: 'HABIT_5', category: 'CHARACTER', tier: 'BRONZE', icon: '🌿', metric: 'HABIT_PRACTICES', threshold: 5 },
  { code: 'HABIT_25', category: 'CHARACTER', tier: 'SILVER', icon: '🌳', metric: 'HABIT_PRACTICES', threshold: 25 },
  { code: 'ANSWERED_PRAYER', category: 'CHARACTER', tier: 'SILVER', icon: '🙏', metric: 'PRAYERS_ANSWERED', threshold: 1 },
];

export const BADGE_TIER_XP: Record<LearnerBadgeTier, number> = {
  BRONZE: 20,
  SILVER: 50,
  GOLD: 100,
};

// XP per unit of each activity metric. Metrics that are derived from other
// ones (streaks, minutes, subjects) are deliberately absent so the same
// effort is not counted twice.
export const METRIC_XP: Partial<Record<LearnerBadgeMetric, number>> = {
  LEARNING_DAYS: 5,
  LEARNING_RECORDS: 10,
  EVIDENCE_SUBMITTED: 15,
  EVIDENCE_VALIDATED: 10,
  COMPETENCIES_ACHIEVED: 100,
};

// Growth stages ("like a tree planted by streams of water", Psalm 1:3).
// minXp is the inclusive lower bound of each stage.
export const GROWTH_LEVELS: readonly { code: LearnerGrowthLevel; minXp: number }[] = [
  { code: 'SEED', minXp: 0 },
  { code: 'SPROUT', minXp: 100 },
  { code: 'SEEDLING', minXp: 300 },
  { code: 'SAPLING', minXp: 600 },
  { code: 'YOUNG_TREE', minXp: 1000 },
  { code: 'FLOURISHING_TREE', minXp: 1600 },
  { code: 'FRUITFUL_TREE', minXp: 2500 },
  { code: 'MIGHTY_OAK', minXp: 4000 },
];
