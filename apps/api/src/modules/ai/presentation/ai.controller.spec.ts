import { AiController } from './ai.controller.js';
import type {
  AiLessonPlanDraftResponseDto,
  AiUsageQuotaResponseDto,
  GenerateLessonPlanDraftRequestDto,
  ReviewAiSuggestionRequestDto,
} from '@aletheia/contracts';
import type { AuthenticatedUserPayload } from '../../identity/application/public-api.js';

describe('AiController', () => {
  let controller: AiController;
  let suggestionService: any;
  let quotaService: any;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const USER_ID = '22222222-2222-4222-8222-222222222222';
  const LEARNER_ID = '33333333-3333-4333-8333-333333333333';
  const SUGGESTION_ID = '44444444-4444-4444-8444-444444444444';

  const mockUserPayload: AuthenticatedUserPayload = {
    userId: USER_ID,
    email: 'guardian@example.com',
  };

  const mockDraftResponse: AiLessonPlanDraftResponseDto = {
    suggestionId: SUGGESTION_ID,
    status: 'PENDING_REVIEW',
    draft: {
      title: 'Plano de Aula: Grécia Antiga',
      summary: 'Introdução histórica',
      materials: ['Livro'],
      steps: [
        {
          order: 1,
          title: 'Contextualização',
          durationMinutes: 15,
          instructions: 'Ler o primeiro capítulo',
        },
      ],
    },
    metadata: {
      provider: 'MOCK',
      model: 'mock-deterministic',
      promptTokens: 100,
      completionTokens: 200,
      estimatedCostMicrosUsd: 0,
    },
  };

  const mockQuotaResponse: AiUsageQuotaResponseDto = {
    familyId: FAMILY_ID,
    period: '2026-10',
    tokensUsed: 300,
    tokensLimit: 50000,
    requestsUsed: 1,
    requestsLimit: 50,
    resetAt: new Date().toISOString(),
  };

  beforeEach(() => {
    suggestionService = {
      generateLessonPlanDraft: jest.fn().mockResolvedValue(mockDraftResponse),
      reviewSuggestion: jest.fn().mockResolvedValue({
        suggestionId: SUGGESTION_ID,
        status: 'ACCEPTED',
        lessonPlan: { id: 'lesson-123' },
      }),
    };

    quotaService = {
      getFamilyQuota: jest.fn().mockResolvedValue(mockQuotaResponse),
    };

    controller = new AiController(suggestionService, quotaService);
  });

  describe('generateLessonPlanDraft', () => {
    const dto: GenerateLessonPlanDraftRequestDto = {
      learnerId: LEARNER_ID,
      subject: 'História',
      topic: 'Grécia Antiga',
      durationMinutes: 45,
    };

    it('delegates to suggestionService.generateLessonPlanDraft with actor user id from object payload', async () => {
      const result = await controller.generateLessonPlanDraft(FAMILY_ID, mockUserPayload, dto);

      expect(suggestionService.generateLessonPlanDraft).toHaveBeenCalledWith(
        FAMILY_ID,
        USER_ID,
        dto,
      );
      expect(result).toEqual(mockDraftResponse);
    });

    it('delegates to suggestionService.generateLessonPlanDraft with string user id', async () => {
      const result = await controller.generateLessonPlanDraft(FAMILY_ID, USER_ID as any, dto);

      expect(suggestionService.generateLessonPlanDraft).toHaveBeenCalledWith(
        FAMILY_ID,
        USER_ID,
        dto,
      );
      expect(result).toEqual(mockDraftResponse);
    });
  });

  describe('reviewSuggestion', () => {
    const dto: ReviewAiSuggestionRequestDto = {
      action: 'ACCEPT',
      scheduledDate: '2026-10-10T10:00:00.000Z',
    };

    it('delegates to suggestionService.reviewSuggestion with actor user id and suggestion id', async () => {
      const result = await controller.reviewSuggestion(
        FAMILY_ID,
        SUGGESTION_ID,
        mockUserPayload,
        dto,
      );

      expect(suggestionService.reviewSuggestion).toHaveBeenCalledWith(
        FAMILY_ID,
        USER_ID,
        SUGGESTION_ID,
        dto,
      );
      expect(result).toEqual({
        suggestionId: SUGGESTION_ID,
        status: 'ACCEPTED',
        lessonPlan: { id: 'lesson-123' },
      });
    });
  });

  describe('getQuota', () => {
    it('delegates to quotaService.getFamilyQuota with familyId', async () => {
      const result = await controller.getQuota(FAMILY_ID);

      expect(quotaService.getFamilyQuota).toHaveBeenCalledWith(FAMILY_ID);
      expect(result).toEqual(mockQuotaResponse);
    });
  });
});
