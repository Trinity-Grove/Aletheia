import { z } from 'zod';

const dashboardDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format');

export const dashboardQuerySchema = z.object({
  date: dashboardDateSchema,
  learnerId: z.string().uuid().optional(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;

export const dashboardActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subjectName: z.string().optional(),
  scheduledTime: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  completed: z.boolean(),
  type: z.enum(['devotional', 'lesson', 'routine']),
});

export type DashboardActivityDto = z.infer<typeof dashboardActivitySchema>;

export const onboardingStepIdSchema = z.enum([
  'create_learner',
  'choose_curriculum',
  'schedule_lesson',
  'complete_first_activity',
]);

export type OnboardingStepId = z.infer<typeof onboardingStepIdSchema>;

export const onboardingStepSchema = z.object({
  id: onboardingStepIdSchema,
  completed: z.boolean(),
  actionUrl: z.string(),
});

export type OnboardingStepDto = z.infer<typeof onboardingStepSchema>;

export const onboardingChecklistSchema = z.object({
  dismissed: z.boolean(),
  completedCount: z.number().int().min(0).max(4),
  totalCount: z.literal(4),
  steps: z.array(onboardingStepSchema).length(4),
});

export type OnboardingChecklistDto = z.infer<typeof onboardingChecklistSchema>;

export const dashboardResponseSchema = z.object({
  date: dashboardDateSchema,
  family: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  learners: z.array(
    z.object({
      id: z.string().uuid(),
      displayName: z.string(),
    }),
  ),
  activeLearnerId: z.string().uuid().nullable(),
  journey: z.object({
    completedMinutes: z.number().int().min(0),
    targetMinutes: z.number().int().min(0),
    completedLessons: z.number().int().min(0),
    totalLessons: z.number().int().min(0),
    daySequence: z.number().int().min(0),
  }),
  activities: z.array(dashboardActivitySchema),
  onboarding: onboardingChecklistSchema.optional(),
});

export type DashboardResponseDto = z.infer<typeof dashboardResponseSchema>;
