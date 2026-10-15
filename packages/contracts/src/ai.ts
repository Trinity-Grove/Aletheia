import { z } from 'zod';

export const aiSuggestionStatusSchema = z.enum([
  'PENDING_REVIEW',
  'ACCEPTED',
  'MODIFIED',
  'REJECTED',
]);
export type AiSuggestionStatus = z.infer<typeof aiSuggestionStatusSchema>;

export const aiFeatureTypeSchema = z.enum([
  'LESSON_PLAN_DRAFT',
  'ACTIVITY_ADAPTATION',
]);
export type AiFeatureType = z.infer<typeof aiFeatureTypeSchema>;

export const aiProviderNameSchema = z.enum(['MOCK', 'OPENAI', 'ANTHROPIC', 'GEMINI']);
export type AiProviderName = z.infer<typeof aiProviderNameSchema>;

export const aiCatalogContextSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  version: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().nullable(),
});
export type AiCatalogContextDto = z.infer<typeof aiCatalogContextSchema>;

export const aiGroundingSourceTypeSchema = z.enum([
  'LEARNING_DOMAIN',
  'PEDAGOGICAL_PROFILE',
  'THEOLOGICAL_PROFILE',
  'ACTIVITY_DEFINITION',
]);
export type AiGroundingSourceType = z.infer<typeof aiGroundingSourceTypeSchema>;

export const aiGroundingSourceSchema = z.object({
  type: aiGroundingSourceTypeSchema,
  code: z.string().min(1),
  version: z.number().int().positive(),
  label: z.string().min(1),
});
export type AiGroundingSourceDto = z.infer<typeof aiGroundingSourceSchema>;

export const aiGroundingContextSchema = z.object({
  sources: z.array(aiGroundingSourceSchema),
});
export type AiGroundingContextDto = z.infer<typeof aiGroundingContextSchema>;

export const generateLessonPlanDraftRequestSchema = z.object({
  learnerId: z.string().uuid(),
  activityDefinitionId: z.string().uuid().optional(),
  learningDomainCode: z.string().trim().min(1).max(150).optional(),
  subject: z.string().min(2).max(80),
  topic: z.string().min(3).max(200),
  targetAge: z.number().int().min(3).max(25).optional(),
  gradeLevel: z.string().max(60).optional(),
  durationMinutes: z.number().int().min(5).max(240).default(45),
  objectives: z.array(z.string().min(2).max(200)).max(10).optional(),
  additionalInstructions: z.string().max(1000).optional(),
});
export type GenerateLessonPlanDraftRequestDto = z.infer<
  typeof generateLessonPlanDraftRequestSchema
>;

export const lessonPlanDraftStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(2).max(120),
  durationMinutes: z.number().int().min(1).max(240),
  instructions: z.string().min(5),
  narrationPrompt: z.string().max(300).optional(),
});
export type LessonPlanDraftStep = z.infer<typeof lessonPlanDraftStepSchema>;

export const lessonPlanDraftContentSchema = z.object({
  title: z.string().min(3).max(150),
  summary: z.string().min(10),
  materials: z.array(z.string().min(1)).default([]),
  steps: z.array(lessonPlanDraftStepSchema).min(1),
  assessmentObservations: z.string().optional(),
});
export type LessonPlanDraftContent = z.infer<typeof lessonPlanDraftContentSchema>;

export const aiLessonPlanDraftResponseSchema = z.object({
  suggestionId: z.string().uuid(),
  status: z.literal('PENDING_REVIEW'),
  draft: lessonPlanDraftContentSchema,
  catalogContext: aiCatalogContextSchema.optional(),
  groundingContext: aiGroundingContextSchema.optional(),
  metadata: z.object({
    provider: z.string(),
    model: z.string(),
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    estimatedCostMicrosUsd: z.number().int().nonnegative(),
  }),
});
export type AiLessonPlanDraftResponseDto = z.infer<
  typeof aiLessonPlanDraftResponseSchema
>;

export const reviewAiSuggestionRequestSchema = z
  .object({
    action: z.enum(['ACCEPT', 'MODIFY', 'REJECT']),
    scheduledDate: z.string().datetime().optional(),
    subjectId: z.string().uuid().optional(),
    finalContent: lessonPlanDraftContentSchema.optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'MODIFY' && !data.finalContent) {
        return false;
      }
      return true;
    },
    {
      message: 'finalContent is required when action is MODIFY',
      path: ['finalContent'],
    },
  );
export type ReviewAiSuggestionRequestDto = z.infer<
  typeof reviewAiSuggestionRequestSchema
>;

export const aiUsageQuotaResponseSchema = z.object({
  familyId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  tokensUsed: z.number().int().nonnegative(),
  tokensLimit: z.number().int().positive(),
  requestsUsed: z.number().int().nonnegative(),
  requestsLimit: z.number().int().positive(),
  resetAt: z.string().datetime(),
});
export type AiUsageQuotaResponseDto = z.infer<typeof aiUsageQuotaResponseSchema>;
