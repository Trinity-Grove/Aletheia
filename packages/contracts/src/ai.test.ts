import { describe, expect, it } from 'vitest';
import {
  aiSuggestionStatusSchema,
  aiFeatureTypeSchema,
  aiProviderNameSchema,
  generateLessonPlanDraftRequestSchema,
  lessonPlanDraftStepSchema,
  lessonPlanDraftContentSchema,
  aiLessonPlanDraftResponseSchema,
  reviewAiSuggestionRequestSchema,
  aiUsageQuotaResponseSchema,
} from './ai.js';

describe('AI Contracts Zod Schemas', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  describe('aiSuggestionStatusSchema', () => {
    it('should accept valid statuses', () => {
      const validStatuses = ['PENDING_REVIEW', 'ACCEPTED', 'MODIFIED', 'REJECTED'] as const;
      for (const status of validStatuses) {
        expect(aiSuggestionStatusSchema.parse(status)).toBe(status);
      }
    });

    it('should reject invalid statuses', () => {
      expect(() => aiSuggestionStatusSchema.parse('APPROVED')).toThrow();
      expect(() => aiSuggestionStatusSchema.parse('')).toThrow();
    });
  });

  describe('aiFeatureTypeSchema', () => {
    it('should accept valid feature types', () => {
      const validTypes = ['LESSON_PLAN_DRAFT', 'ACTIVITY_ADAPTATION'] as const;
      for (const featureType of validTypes) {
        expect(aiFeatureTypeSchema.parse(featureType)).toBe(featureType);
      }
    });

    it('should reject invalid feature types', () => {
      expect(() => aiFeatureTypeSchema.parse('QUIZ_GENERATOR')).toThrow();
    });
  });

  describe('aiProviderNameSchema', () => {
    it('should accept valid provider names', () => {
      const validProviders = ['MOCK', 'OPENAI', 'ANTHROPIC', 'GEMINI'] as const;
      for (const provider of validProviders) {
        expect(aiProviderNameSchema.parse(provider)).toBe(provider);
      }
    });

    it('should reject invalid provider names', () => {
      expect(() => aiProviderNameSchema.parse('LLAMA')).toThrow();
    });
  });

  describe('generateLessonPlanDraftRequestSchema', () => {
    it('should validate complete valid request', () => {
      const parsed = generateLessonPlanDraftRequestSchema.safeParse({
        learnerId: validUuid,
        subject: 'História',
        topic: 'Civilização Grega',
        targetAge: 10,
        gradeLevel: '5º Ano',
        durationMinutes: 45,
        objectives: ['Compreender a pólis'],
        additionalInstructions: 'Focar em Atenas',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.learnerId).toBe(validUuid);
        expect(parsed.data.durationMinutes).toBe(45);
      }
    });

    it('should default durationMinutes to 45 when omitted', () => {
      const parsed = generateLessonPlanDraftRequestSchema.safeParse({
        learnerId: validUuid,
        subject: 'Matemática',
        topic: 'Frações Equivalentes',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.durationMinutes).toBe(45);
      }
    });

    it('should reject duration under 5 minutes or over 240 minutes', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          durationMinutes: 3,
        }).success,
      ).toBe(false);

      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          durationMinutes: 300,
        }).success,
      ).toBe(false);
    });

    it('should reject invalid learner UUID', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: 'not-a-uuid',
          subject: 'História',
          topic: 'Civilização Grega',
        }).success,
      ).toBe(false);
    });

    it('should reject targetAge outside [3, 25]', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          targetAge: 2,
        }).success,
      ).toBe(false);

      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          targetAge: 26,
        }).success,
      ).toBe(false);
    });

    it('should reject subject or topic with invalid length', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'H',
          topic: 'Civilização Grega',
        }).success,
      ).toBe(false);

      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Ci',
        }).success,
      ).toBe(false);
    });

    it('should reject objectives array with more than 10 items', () => {
      const items = Array.from({ length: 11 }, (_, i) => `Objetivo ${i + 1}`);
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          objectives: items,
        }).success,
      ).toBe(false);
    });
  });

  describe('lessonPlanDraftStepSchema', () => {
    it('should validate valid step', () => {
      const parsed = lessonPlanDraftStepSchema.safeParse({
        order: 1,
        title: 'Introdução ao Tema',
        durationMinutes: 10,
        instructions: 'Apresentar o mapa da Grécia Antiga aos alunos.',
        narrationPrompt: 'O que chama sua atenção no mapa?',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject step with invalid duration or order', () => {
      expect(
        lessonPlanDraftStepSchema.safeParse({
          order: 0,
          title: 'Introdução',
          durationMinutes: 10,
          instructions: 'Apresentar o mapa da Grécia.',
        }).success,
      ).toBe(false);

      expect(
        lessonPlanDraftStepSchema.safeParse({
          order: 1,
          title: 'Introdução',
          durationMinutes: 0,
          instructions: 'Apresentar o mapa da Grécia.',
        }).success,
      ).toBe(false);
    });
  });

  describe('lessonPlanDraftContentSchema', () => {
    it('should default materials to empty array when omitted', () => {
      const parsed = lessonPlanDraftContentSchema.safeParse({
        title: 'Aula de História',
        summary: 'Visão geral da Grécia antiga',
        steps: [
          {
            order: 1,
            title: 'Introdução',
            durationMinutes: 10,
            instructions: 'Apresentar o mapa',
          },
        ],
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.materials).toEqual([]);
      }
    });

    it('should reject content with empty steps array', () => {
      expect(
        lessonPlanDraftContentSchema.safeParse({
          title: 'Aula de História',
          summary: 'Visão geral da Grécia antiga',
          steps: [],
        }).success,
      ).toBe(false);
    });
  });

  describe('aiLessonPlanDraftResponseSchema', () => {
    it('should validate draft response payload', () => {
      const parsed = aiLessonPlanDraftResponseSchema.safeParse({
        suggestionId: validUuid,
        status: 'PENDING_REVIEW',
        draft: {
          title: 'Aula de História',
          summary: 'Visão geral da Grécia antiga',
          materials: ['Mapas', 'Caderno'],
          steps: [
            {
              order: 1,
              title: 'Introdução',
              durationMinutes: 10,
              instructions: 'Apresentar o mapa',
              narrationPrompt: 'O que você notou no relevo grego?',
            },
          ],
          assessmentObservations: 'Verificar interesse e compreensão oral.',
        },
        metadata: {
          provider: 'MOCK',
          model: 'mock-deterministic',
          promptTokens: 120,
          completionTokens: 250,
          estimatedCostMicrosUsd: 0,
        },
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject status other than PENDING_REVIEW', () => {
      const parsed = aiLessonPlanDraftResponseSchema.safeParse({
        suggestionId: validUuid,
        status: 'ACCEPTED',
        draft: {
          title: 'Aula de História',
          summary: 'Visão geral da Grécia antiga',
          steps: [
            {
              order: 1,
              title: 'Introdução',
              durationMinutes: 10,
              instructions: 'Apresentar o mapa',
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
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('reviewAiSuggestionRequestSchema', () => {
    it('should validate ACCEPT action', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'ACCEPT',
      });
      expect(parsed.success).toBe(true);
    });

    it('should validate ACCEPT action with scheduledDate', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'ACCEPT',
        scheduledDate: '2026-10-15T09:00:00.000Z',
      });
      expect(parsed.success).toBe(true);
    });

    it('should validate MODIFY action with finalContent', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'MODIFY',
        finalContent: {
          title: 'História Ajustada',
          summary: 'Resumo editado e enriquecido',
          materials: ['Livro'],
          steps: [{ order: 1, title: 'Início', durationMinutes: 15, instructions: 'Ler o capítulo 1' }],
        },
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject MODIFY action without finalContent with exact message and path', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'MODIFY',
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toBe('finalContent is required when action is MODIFY');
        expect(parsed.error.issues[0]?.path).toEqual(['finalContent']);
      }
    });

    it('should validate REJECT action with optional reason', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'REJECT',
        rejectionReason: 'Muito complexo para a idade',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject rejectionReason longer than 500 chars', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'REJECT',
        rejectionReason: 'x'.repeat(501),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('aiUsageQuotaResponseSchema', () => {
    it('should validate quota response', () => {
      const parsed = aiUsageQuotaResponseSchema.safeParse({
        familyId: validUuid,
        period: '2026-10',
        tokensUsed: 15000,
        tokensLimit: 100000,
        requestsUsed: 12,
        requestsLimit: 200,
        resetAt: new Date().toISOString(),
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid period format', () => {
      expect(
        aiUsageQuotaResponseSchema.safeParse({
          familyId: validUuid,
          period: '2026-1',
          tokensUsed: 0,
          tokensLimit: 100000,
          requestsUsed: 0,
          requestsLimit: 200,
          resetAt: new Date().toISOString(),
        }).success,
      ).toBe(false);
    });

    it('should reject non-positive limits or negative used counters', () => {
      expect(
        aiUsageQuotaResponseSchema.safeParse({
          familyId: validUuid,
          period: '2026-10',
          tokensUsed: -1,
          tokensLimit: 100000,
          requestsUsed: 0,
          requestsLimit: 200,
          resetAt: new Date().toISOString(),
        }).success,
      ).toBe(false);

      expect(
        aiUsageQuotaResponseSchema.safeParse({
          familyId: validUuid,
          period: '2026-10',
          tokensUsed: 0,
          tokensLimit: 0,
          requestsUsed: 0,
          requestsLimit: 200,
          resetAt: new Date().toISOString(),
        }).success,
      ).toBe(false);
    });
  });
});
