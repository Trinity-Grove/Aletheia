import type {
  AiLessonPlanDraftResponseDto,
  AiUsageQuotaResponseDto,
  GenerateLessonPlanDraftRequestDto,
  ReviewAiSuggestionRequestDto,
} from '@aletheia/contracts';

export const AI_PUBLIC_API = Symbol('AI_PUBLIC_API');

export interface AiPublicApi {
  generateLessonPlanDraft(
    familyId: string,
    actorUserId: string,
    dto: GenerateLessonPlanDraftRequestDto,
  ): Promise<AiLessonPlanDraftResponseDto>;

  reviewSuggestion(
    familyId: string,
    actorUserId: string,
    suggestionId: string,
    dto: ReviewAiSuggestionRequestDto,
  ): Promise<{ suggestionId: string; status: string; lessonPlan?: unknown }>;

  getFamilyQuota(familyId: string): Promise<AiUsageQuotaResponseDto>;
}
