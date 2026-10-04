import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LearnerSummaryDto, SubjectResponseDto } from '@aletheia/contracts';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { AiConsentNoticeModal } from '../src/components/lessons/ai-consent-notice-modal';
import { AiLessonDraftModal } from '../src/components/lessons/ai-lesson-draft-modal';

const mockLearners: LearnerSummaryDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    firstName: 'Samuel',
    lastName: 'Silva',
    preferredName: 'Samuca',
    stage: 'PRIMARY',
    avatarColor: '#3B82F6',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    firstName: 'Ester',
    lastName: 'Silva',
    preferredName: 'Teca',
    stage: 'PRIMARY',
    avatarColor: '#EC4899',
  },
];

const mockSubjects: SubjectResponseDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    familyId: 'fam-1',
    name: 'Ciências Naturais',
    color: '#10B981',
    icon: 'leaf',
    description: 'Estudo da natureza e criação',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    familyId: 'fam-1',
    name: 'História Geral',
    color: '#D97706',
    icon: 'book',
    description: 'História e civilizações',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockQuota = {
  familyId: 'fam-1',
  period: '2026-10',
  tokensUsed: 5000,
  tokensLimit: 50000,
  requestsUsed: 2,
  requestsLimit: 20,
  resetAt: '2026-11-01T00:00:00.000Z',
};

const mockDraftResponse = {
  suggestionId: '99999999-9999-9999-9999-999999999999',
  status: 'PENDING_REVIEW',
  draft: {
    title: 'Fotossíntese: As Plantas e a Luz Solar',
    summary: 'Exploração prática de como as plantas produzem seu próprio alimento através da luz.',
    materials: ['Folhas verdes', 'Álcool 70%', 'Recipiente de vidro'],
    steps: [
      {
        order: 1,
        title: 'Observação das Folhas',
        durationMinutes: 15,
        instructions: 'Coletar 3 folhas diferentes no jardim e examinar as nervuras.',
        narrationPrompt: 'Como você descreveria a cor e textura das folhas?',
      },
      {
        order: 2,
        title: 'Explicação da Clorofila',
        durationMinutes: 20,
        instructions: 'Ler o trecho da enciclopédia sobre os pigmentos verdes.',
        narrationPrompt: 'Por que a luz do sol é necessária para a planta?',
      },
    ],
    assessmentObservations: 'Avaliar a capacidade de narrar oralmente a importância do sol.',
  },
  metadata: {
    provider: 'MOCK',
    model: 'mock-pedagogical-v1',
    promptTokens: 450,
    completionTokens: 380,
    estimatedCostMicrosUsd: 120,
  },
};

describe('AI Lesson Assistant Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('AiConsentNoticeModal', () => {
    it('renders consent warning, settings redirect, and close action', () => {
      const handleClose = vi.fn();
      const handleSettings = vi.fn();

      render(
        <LocaleProvider>
          <AiConsentNoticeModal
            isOpen={true}
            onClose={handleClose}
            onGoToSettings={handleSettings}
          />
        </LocaleProvider>,
      );

      expect(screen.getByTestId('ai-consent-notice-modal')).toBeInTheDocument();
      expect(screen.getByTestId('ai-consent-settings-link')).toBeInTheDocument();
      expect(screen.getByTestId('ai-consent-close-btn')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('ai-consent-close-btn'));
      expect(handleClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('ai-consent-settings-link'));
      expect(handleSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('AiLessonDraftModal', () => {
    it('fetches quota and renders configuration form with prefilled values', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return {
            ok: true,
            json: async () => mockQuota,
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={vi.fn()}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialLearnerId={mockLearners[0]!.id}
            initialSubjectId={mockSubjects[0]!.id}
            initialDate="2026-10-15"
          />
        </LocaleProvider>,
      );

      expect(screen.getByTestId('ai-learner-select')).toBeInTheDocument();
      expect(screen.getByTestId('ai-subject-select')).toBeInTheDocument();
      expect(screen.getByTestId('ai-topic-input')).toBeInTheDocument();
      expect(screen.getByTestId('ai-duration-input')).toBeInTheDocument();
      expect(screen.getByTestId('ai-instructions-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('ai-generate-draft-btn')).toBeInTheDocument();

      await waitFor(() => {
        const quotaIndicator = screen.getByTestId('ai-quota-indicator');
        expect(quotaIndicator).toBeInTheDocument();
        expect(quotaIndicator.textContent).toContain('45000');
        expect(quotaIndicator.textContent).toContain('18');
      });
    });

    it('submits config, transitions to review phase, and displays draft content', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return {
            ok: true,
            json: async () => mockQuota,
          } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return {
            ok: true,
            json: async () => mockDraftResponse,
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={vi.fn()}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
          />
        </LocaleProvider>,
      );

      // Fill topic
      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese e Clorofila' },
      });

      // Click generate
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/families/fam-1/ai/lesson-plan-draft',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Fotossíntese e Clorofila'),
          }),
        );
      });

      // Verify review elements are rendered
      await waitFor(() => {
        expect(screen.getByTestId('ai-draft-title')).toHaveValue(
          'Fotossíntese: As Plantas e a Luz Solar',
        );
        expect(screen.getByTestId('ai-draft-summary')).toHaveValue(
          'Exploração prática de como as plantas produzem seu próprio alimento através da luz.',
        );
        expect(screen.getByTestId('ai-draft-materials')).toHaveValue(
          'Folhas verdes, Álcool 70%, Recipiente de vidro',
        );
        expect(screen.getByTestId('ai-draft-date')).toHaveValue('2026-10-15');
        expect(screen.getByTestId('ai-draft-step-0')).toBeInTheDocument();
        expect(screen.getByTestId('ai-draft-step-1')).toBeInTheDocument();
        expect(screen.getByTestId('ai-draft-assessment')).toHaveValue(
          'Avaliar a capacidade de narrar oralmente a importância do sol.',
        );
        expect(screen.getByTestId('ai-approve-schedule-btn')).toBeInTheDocument();
        expect(screen.getByTestId('ai-reject-draft-btn')).toBeInTheDocument();
        expect(screen.getByTestId('ai-back-config-btn')).toBeInTheDocument();
      });
    });

    it('approves draft, calls review endpoint, triggers onLessonCreated, and closes modal', async () => {
      const handleLessonCreated = vi.fn();
      const handleClose = vi.fn();

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return { ok: true, json: async () => mockQuota } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return { ok: true, json: async () => mockDraftResponse } as Response;
        }
        if (u.includes('/review')) {
          return {
            ok: true,
            json: async () => ({
              suggestionId: mockDraftResponse.suggestionId,
              status: 'ACCEPTED',
              lessonPlan: { id: 'plan-xyz-123' },
            }),
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={handleClose}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
            onLessonCreated={handleLessonCreated}
          />
        </LocaleProvider>,
      );

      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese' },
      });
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-approve-schedule-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('ai-approve-schedule-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          `/api/v1/families/fam-1/ai/suggestions/${mockDraftResponse.suggestionId}/review`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"action":"ACCEPT"'),
          }),
        );
        expect(handleLessonCreated).toHaveBeenCalledWith('plan-xyz-123');
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('modifies draft, sends action MODIFY with finalContent to review endpoint', async () => {
      const handleLessonCreated = vi.fn();
      const handleClose = vi.fn();

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return { ok: true, json: async () => mockQuota } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return { ok: true, json: async () => mockDraftResponse } as Response;
        }
        if (u.includes('/review')) {
          return {
            ok: true,
            json: async () => ({
              suggestionId: mockDraftResponse.suggestionId,
              status: 'MODIFIED',
              lessonPlan: { id: 'plan-modified-456' },
            }),
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={handleClose}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
            onLessonCreated={handleLessonCreated}
          />
        </LocaleProvider>,
      );

      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese' },
      });
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-draft-title')).toBeInTheDocument();
      });

      // Modify the title
      fireEvent.change(screen.getByTestId('ai-draft-title'), {
        target: { value: 'Fotossíntese e Folhas Modificado pelo Professor' },
      });

      fireEvent.click(screen.getByTestId('ai-approve-schedule-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          `/api/v1/families/fam-1/ai/suggestions/${mockDraftResponse.suggestionId}/review`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"action":"MODIFY"'),
          }),
        );
        expect(handleLessonCreated).toHaveBeenCalledWith('plan-modified-456');
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('discards draft, sends action REJECT, closes modal without calling onLessonCreated', async () => {
      const handleLessonCreated = vi.fn();
      const handleClose = vi.fn();

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return { ok: true, json: async () => mockQuota } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return { ok: true, json: async () => mockDraftResponse } as Response;
        }
        if (u.includes('/review')) {
          return {
            ok: true,
            json: async () => ({
              suggestionId: mockDraftResponse.suggestionId,
              status: 'REJECTED',
            }),
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={handleClose}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
            onLessonCreated={handleLessonCreated}
          />
        </LocaleProvider>,
      );

      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese' },
      });
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-reject-draft-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('ai-reject-draft-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          `/api/v1/families/fam-1/ai/suggestions/${mockDraftResponse.suggestionId}/review`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"action":"REJECT"'),
          }),
        );
        expect(handleLessonCreated).not.toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('navigates back to config when clicking back button', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return { ok: true, json: async () => mockQuota } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return { ok: true, json: async () => mockDraftResponse } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={vi.fn()}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
          />
        </LocaleProvider>,
      );

      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese' },
      });
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-back-config-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('ai-back-config-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-generate-draft-btn')).toBeInTheDocument();
      });
    });

    it('opens AiConsentNoticeModal when generating draft returns 403 / CONSENT_REQUIRED', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL) => {
        const u = url.toString();
        if (u.includes('/ai/quota')) {
          return { ok: true, json: async () => mockQuota } as Response;
        }
        if (u.includes('/ai/lesson-plan-draft')) {
          return {
            ok: false,
            status: 403,
            json: async () => ({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Parental consent required for AI processing under COPPA/LGPD',
              code: 'CONSENT_REQUIRED',
            }),
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <LocaleProvider>
          <AiLessonDraftModal
            isOpen={true}
            onClose={vi.fn()}
            familyId="fam-1"
            learners={mockLearners}
            subjects={mockSubjects}
            initialDate="2026-10-15"
          />
        </LocaleProvider>,
      );

      fireEvent.change(screen.getByTestId('ai-topic-input'), {
        target: { value: 'Fotossíntese' },
      });
      fireEvent.click(screen.getByTestId('ai-generate-draft-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-consent-notice-modal')).toBeInTheDocument();
      });
    });
  });
});
