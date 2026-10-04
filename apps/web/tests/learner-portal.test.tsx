import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LearnerLoginPage from '../app/aluno/login/page';
import LearnerAgendaPage from '../app/aluno/agenda/page';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('familyId=f0000000-0000-0000-0000-000000000001');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

describe('Learner Portal (Modo Educando)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockSearchParams = new URLSearchParams('familyId=f0000000-0000-0000-0000-000000000001');
  });

  describe('LearnerLoginPage', () => {
    it('renders learner login view, loads available learners, and handles login', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { learnerId: 'l-1', displayName: 'Clarinha' },
            { learnerId: 'l-2', displayName: 'Pedro' },
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            learnerId: 'l-1',
            familyId: 'f-1',
            displayName: 'Clarinha',
            expiresAt: '2026-09-18T00:00:00.000Z',
          }),
        } as Response);

      render(<LearnerLoginPage />);

      expect(screen.getByTestId('learner-login-page')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Clarinha')).toBeInTheDocument();
        expect(screen.getByText('Pedro')).toBeInTheDocument();
      });

      // Click on learner avatar
      fireEvent.click(screen.getByText('Clarinha'));

      // Enter PIN code
      const pinInput = screen.getByTestId('learner-pin-input');
      fireEvent.change(pinInput, { target: { value: '123456' } });

      fireEvent.click(screen.getByTestId('learner-submit-login-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ learnerId: 'l-1', code: '123456' }),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/aluno/agenda');
      });
    });

    it('displays error message on invalid PIN code', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ learnerId: 'l-1', displayName: 'Clarinha' }],
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Código de acesso incorreto.' }),
        } as Response);

      render(<LearnerLoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Clarinha')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clarinha'));
      fireEvent.change(screen.getByTestId('learner-pin-input'), { target: { value: '000000' } });
      fireEvent.click(screen.getByTestId('learner-submit-login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('learner-login-error')).toHaveTextContent(/Código de acesso incorreto/i);
      });
    });

    it('authenticates learner automatically and redirects to agenda when token param is present', async () => {
      mockSearchParams = new URLSearchParams('token=sample-direct-access-token');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          learnerId: 'l-token-1',
          familyId: 'f-1',
          displayName: 'Joãozinho',
          expiresAt: '2026-09-18T00:00:00.000Z',
        }),
      } as Response);

      render(<LearnerLoginPage />);

      expect(screen.getByTestId('learner-login-page')).toBeInTheDocument();

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/token-login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token: 'sample-direct-access-token' }),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/aluno/agenda');
      });

      const storedSession = JSON.parse(localStorage.getItem('learner_session') || '{}');
      expect(storedSession).toEqual({
        learnerId: 'l-token-1',
        familyId: 'f-1',
        displayName: 'Joãozinho',
      });
    });

    it('authenticates learner automatically using short t query parameter', async () => {
      mockSearchParams = new URLSearchParams('t=sample-compact-token-35chars');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          learnerId: 'l-token-2',
          familyId: 'f-1',
          displayName: 'Mariazinha',
          expiresAt: '2026-09-18T00:00:00.000Z',
        }),
      } as Response);

      render(<LearnerLoginPage />);

      expect(screen.getByTestId('learner-login-page')).toBeInTheDocument();

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/token-login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token: 'sample-compact-token-35chars' }),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/aluno/agenda');
      });
    });

    it('displays error message when token login fails or access was revoked', async () => {
      mockSearchParams = new URLSearchParams('token=expired-or-revoked-token');

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Acesso desativado' }),
      } as Response);

      render(<LearnerLoginPage />);

      await waitFor(() => {
        expect(screen.getByTestId('learner-login-error')).toHaveTextContent(
          /Acesso desativado pelo responsável/i
        );
      });
    });
  });

  describe('LearnerAgendaPage', () => {
    it('loads and renders daily agenda with complete lesson action', async () => {
      localStorage.setItem('learner_session', JSON.stringify({
        learnerId: 'l-1',
        displayName: 'Clarinha',
      }));

      const fetchSpy = vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            date: '2026-09-17',
            items: [
              {
                id: 'item-1',
                lessonPlanId: 'lesson-1',
                title: 'História das Civilizações',
                subjectName: 'História',
                isCompleted: false,
              },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'lesson-1', status: 'COMPLETED' }),
        } as Response);

      render(<LearnerAgendaPage />);

      expect(screen.getByTestId('learner-agenda-page')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('História das Civilizações')).toBeInTheDocument();
      });

      const completeBtn = screen.getByTestId('complete-lesson-btn-lesson-1');
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/lessons/lesson-1/complete',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('switches to progress tab and displays learner tracked competencies', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({
          learnerId: 'l-1',
          displayName: 'Clarinha',
        })
      );

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return {
            ok: true,
            json: async () => ({
              date: '2026-09-17',
              items: [],
            }),
          } as Response;
        }
        if (url.includes('/progress')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'track-1',
                familyId: 'f-1',
                learnerId: 'l-1',
                competencyDefinitionId: 'comp-def-1',
                competencyVersion: 1,
                status: 'ACTIVE',
                activatedAt: '2026-09-01T00:00:00.000Z',
                createdAt: '2026-09-01T00:00:00.000Z',
                evidenceCount: 2,
                competency: {
                  code: 'HIST-01',
                  title: 'História Antiga e Civilizações',
                  domainId: 'dom-1',
                  domainTitle: 'História',
                },
              },
              {
                id: 'track-2',
                familyId: 'f-1',
                learnerId: 'l-1',
                competencyDefinitionId: 'comp-def-2',
                competencyVersion: 1,
                status: 'ACTIVE',
                achievedAt: '2026-09-15T00:00:00.000Z',
                activatedAt: '2026-09-01T00:00:00.000Z',
                createdAt: '2026-09-01T00:00:00.000Z',
                evidenceCount: 3,
                competency: {
                  code: 'MAT-01',
                  title: 'Geometria Espacial',
                  domainId: 'dom-2',
                  domainTitle: 'Matemática',
                },
              },
            ],
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      expect(screen.getByTestId('tab-agenda')).toBeInTheDocument();
      expect(screen.getByTestId('tab-progress')).toBeInTheDocument();

      // Switch tab to Meu Progresso
      fireEvent.click(screen.getByTestId('tab-progress'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/progress?status=ACTIVE',
          expect.objectContaining({ credentials: 'include' })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('História Antiga e Civilizações')).toBeInTheDocument();
        expect(screen.getByText('Geometria Espacial')).toBeInTheDocument();
        expect(screen.getByText('HIST-01')).toBeInTheDocument();
        expect(screen.getByText('MAT-01')).toBeInTheDocument();
        expect(screen.getByTestId('competency-status-track-1')).toHaveTextContent(/Em Andamento/i);
        expect(screen.getByTestId('competency-status-track-2')).toHaveTextContent(/Conquistada/i);
      });
    });

    it('submits evidence from learner progress view and shows celebration message', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({
          learnerId: 'l-1',
          displayName: 'Clarinha',
        })
      );

      let submittedBody: Record<string, unknown> | null = null;

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return {
            ok: true,
            json: async () => ({ date: '2026-09-17', items: [] }),
          } as Response;
        }
        if (url.includes('/progress')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'track-1',
                familyId: 'f-1',
                learnerId: 'l-1',
                competencyDefinitionId: 'comp-def-1',
                competencyVersion: 1,
                status: 'ACTIVE',
                activatedAt: '2026-09-01T00:00:00.000Z',
                createdAt: '2026-09-01T00:00:00.000Z',
                evidenceCount: 1,
                competency: {
                  code: 'HIST-01',
                  title: 'História Antiga e Civilizações',
                  domainId: 'dom-1',
                  domainTitle: 'História',
                },
              },
            ],
          } as Response;
        }
        if (url.includes('/evidence-submissions') && init?.method === 'POST') {
          submittedBody = JSON.parse(String(init.body));
          return {
            ok: true,
            status: 201,
            json: async () => ({
              id: 'ev-1',
              familyId: 'f-1',
              learnerId: 'l-1',
              evidenceTypeId: '00000000-0000-0000-0000-000000000001',
              authorId: 'user-guardian-1',
              validationStatus: 'UNVALIDATED',
              createdAt: '2026-09-17T12:00:00.000Z',
              competencies: [
                {
                  id: 'link-1',
                  evidenceSubmissionId: 'ev-1',
                  competencyDefinitionId: 'comp-def-1',
                  competencyVersion: 1,
                  createdAt: '2026-09-17T12:00:00.000Z',
                },
              ],
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      // Switch to progress tab
      fireEvent.click(screen.getByTestId('tab-progress'));

      await waitFor(() => {
        expect(screen.getByText('História Antiga e Civilizações')).toBeInTheDocument();
      });

      // Click Enviar Trabalho button on competency card
      fireEvent.click(screen.getByTestId('submit-evidence-btn-track-1'));

      expect(screen.getByTestId('learner-evidence-modal')).toBeInTheDocument();

      // Fill in fields
      fireEvent.change(screen.getByTestId('evidence-title-input'), {
        target: { value: 'Meu Resumo sobre o Império Romano' },
      });
      fireEvent.change(screen.getByTestId('evidence-type-select'), {
        target: { value: 'WORK_SAMPLE' },
      });
      fireEvent.change(screen.getByTestId('evidence-description-input'), {
        target: { value: 'Li o capítulo 3 e fiz um mapa conceitual das estradas romanas.' },
      });
      fireEvent.change(screen.getByTestId('evidence-url-input'), {
        target: { value: 'https://exemplo.com/resumo.pdf' },
      });
      fireEvent.change(screen.getByTestId('evidence-notes-input'), {
        target: { value: 'Demorei 2 dias para concluir.' },
      });

      // Submit
      fireEvent.click(screen.getByTestId('submit-evidence-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/evidence-submissions',
          expect.objectContaining({ method: 'POST' })
        );
      });

      // Verify payload matches expected fields
      expect(submittedBody).toMatchObject({
        trackingId: 'track-1',
        evidenceTypeCode: 'WORK_SAMPLE',
        title: 'Meu Resumo sobre o Império Romano',
        description: 'Li o capítulo 3 e fiz um mapa conceitual das estradas romanas.',
        url: 'https://exemplo.com/resumo.pdf',
        notes: 'Demorei 2 dias para concluir.',
        competencies: [{ competencyDefinitionId: 'comp-def-1' }],
      });

      // Verify encouraging celebration message
      await waitFor(() => {
        expect(screen.getByTestId('celebration-alert')).toHaveTextContent(
          /Parabéns! Sua evidência foi enviada aos seus responsáveis para validação!/i
        );
      });
    });

    it('validates evidence submission form and rejects title with fewer than 3 characters', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({
          learnerId: 'l-1',
          displayName: 'Clarinha',
        })
      );

      vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return { ok: true, json: async () => ({ date: '2026-09-17', items: [] }) } as Response;
        }
        if (url.includes('/progress')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'track-1',
                competency: { code: 'HIST-01', title: 'História Antiga' },
              },
            ],
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      fireEvent.click(screen.getByTestId('tab-progress'));

      await waitFor(() => {
        expect(screen.getByText('História Antiga')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('open-evidence-modal-btn'));

      fireEvent.change(screen.getByTestId('evidence-title-input'), {
        target: { value: 'Oi' },
      });

      fireEvent.click(screen.getByTestId('submit-evidence-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('evidence-form-error')).toHaveTextContent(
          /O título deve ter no mínimo 3 caracteres/i
        );
      });
    });

    it('navigates previous day, next day, and specific week day, fetching agenda for target date', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' })
      );

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          const urlObj = new URL(url, 'http://localhost');
          const dateParam = urlObj.searchParams.get('date') || '2026-09-17';
          return {
            ok: true,
            json: async () => ({
              date: dateParam,
              items: [
                {
                  id: `item-${dateParam}`,
                  lessonPlanId: `lesson-${dateParam}`,
                  title: `Atividade do dia ${dateParam}`,
                  isCompleted: false,
                },
              ],
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      await waitFor(() => {
        expect(screen.getByText('Atividade do dia 2026-09-17')).toBeInTheDocument();
      });

      // Navigate to next day
      const nextBtn = screen.getByTestId('next-day-btn');
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/agenda?date=2026-09-18',
          expect.objectContaining({ credentials: 'include' })
        );
      });

      // Navigate to previous day
      const prevBtn = screen.getByTestId('prev-day-btn');
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/agenda?date=2026-09-17',
          expect.objectContaining({ credentials: 'include' })
        );
      });

      // Navigate via weekday pill
      const pillBtn = screen.getByTestId('agenda-day-2026-09-15');
      fireEvent.click(pillBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/agenda?date=2026-09-15',
          expect.objectContaining({ credentials: 'include' })
        );
      });
    });

    it('renders friendly status badge, duration, and character habits tags on lesson cards', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' })
      );

      vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return {
            ok: true,
            json: async () => ({
              date: '2026-09-17',
              items: [
                {
                  id: 'item-1',
                  lessonPlanId: 'lesson-1',
                  title: 'Leitura Guiada e Narração',
                  subjectName: 'Literatura',
                  durationMinutes: 45,
                  characterHabits: ['Atenção', 'Diligência'],
                  isCompleted: false,
                },
                {
                  id: 'item-2',
                  lessonPlanId: 'lesson-2',
                  title: 'Cálculo Mental',
                  subjectName: 'Matemática',
                  durationMinutes: 30,
                  isCompleted: true,
                },
              ],
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      await waitFor(() => {
        expect(screen.getByText('Leitura Guiada e Narração')).toBeInTheDocument();
      });

      // Verify friendly status badges
      expect(screen.getByTestId('lesson-status-pending-lesson-1')).toHaveTextContent(/A Fazer/i);
      expect(screen.getByTestId('lesson-status-completed-lesson-2')).toHaveTextContent(/Concluída/i);

      // Verify duration
      expect(screen.getByTestId('lesson-duration-lesson-1')).toHaveTextContent(/45 min/i);
      expect(screen.getByTestId('lesson-duration-lesson-2')).toHaveTextContent(/30 min/i);

      // Verify character habits
      const habitsContainer = screen.getByTestId('lesson-habits-lesson-1');
      expect(habitsContainer).toHaveTextContent(/Atenção/i);
      expect(habitsContainer).toHaveTextContent(/Diligência/i);
    });

    it('completes lesson with oral narration and reflection via reflection modal', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' })
      );

      let completeBody: Record<string, unknown> | null = null;

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return {
            ok: true,
            json: async () => ({
              date: '2026-09-17',
              items: [
                {
                  id: 'item-1',
                  lessonPlanId: 'lesson-1',
                  title: 'História Medieval',
                  isCompleted: false,
                  characterHabits: ['Atenção'],
                },
              ],
            }),
          } as Response;
        }
        if (url.includes('/lessons/lesson-1/complete') && init?.method === 'POST') {
          completeBody = JSON.parse(String(init.body));
          return {
            ok: true,
            json: async () => ({ id: 'lesson-1', status: 'COMPLETED' }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      await waitFor(() => {
        expect(screen.getByText('História Medieval')).toBeInTheDocument();
      });

      // Open reflection modal
      fireEvent.click(screen.getByTestId('reflect-lesson-btn-lesson-1'));

      expect(screen.getByTestId('learner-reflection-modal')).toBeInTheDocument();

      // Check oral narration checkbox
      fireEvent.click(screen.getByTestId('oral-narration-checkbox'));

      // Enter written reflection
      fireEvent.change(screen.getByTestId('written-narration-textarea'), {
        target: { value: 'Contei oralmente para mamãe sobre os castelos medievais.' },
      });

      // Submit reflection
      fireEvent.click(screen.getByTestId('submit-reflection-btn'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/learner-access/learners/l-1/lessons/lesson-1/complete',
          expect.objectContaining({ method: 'POST' })
        );
      });

      expect((completeBody as Record<string, unknown> | null)?.notes).toMatch(/Narração Oral/i);
      expect((completeBody as Record<string, unknown> | null)?.notes).toMatch(
        /Contei oralmente para mamãe sobre os castelos medievais/i
      );

      // Verify completed status and reflection note displayed on card
      await waitFor(() => {
        expect(screen.getByTestId('lesson-status-completed-lesson-1')).toBeInTheDocument();
        expect(screen.getByTestId('lesson-reflection-note-lesson-1')).toHaveTextContent(
          /Contei oralmente para mamãe sobre os castelos medievais/i
        );
      });
    });

    it('filters competencies by All, In Progress, and Achieved with character habit badges in progress view', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' })
      );

      vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return { ok: true, json: async () => ({ date: '2026-09-17', items: [] }) } as Response;
        }
        if (url.includes('/progress')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'track-1',
                competency: { code: 'HIST-01', title: 'Civilizações Antigas', domainTitle: 'História' },
                characterHabits: ['Atenção e Concentração'],
                status: 'ACTIVE',
              },
              {
                id: 'track-2',
                competency: { code: 'MAT-01', title: 'Frações e Decimais', domainTitle: 'Matemática' },
                characterHabits: ['Diligência e Esforço'],
                achievedAt: '2026-09-10T00:00:00.000Z',
                status: 'ACTIVE',
              },
            ],
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      fireEvent.click(screen.getByTestId('tab-progress'));

      await waitFor(() => {
        expect(screen.getByText('Civilizações Antigas')).toBeInTheDocument();
        expect(screen.getByText('Frações e Decimais')).toBeInTheDocument();
      });

      // Verify character habit badges rendered
      expect(screen.getByTestId('competency-habits-track-1')).toHaveTextContent(/Atenção e Concentração/i);
      expect(screen.getByTestId('competency-habits-track-2')).toHaveTextContent(/Diligência e Esforço/i);

      // Filter by In Progress
      fireEvent.click(screen.getByTestId('filter-in-progress-btn'));
      expect(screen.getByText('Civilizações Antigas')).toBeInTheDocument();
      expect(screen.queryByText('Frações e Decimais')).not.toBeInTheDocument();

      // Filter by Achieved
      fireEvent.click(screen.getByTestId('filter-achieved-btn'));
      expect(screen.queryByText('Civilizações Antigas')).not.toBeInTheDocument();
      expect(screen.getByText('Frações e Decimais')).toBeInTheDocument();

      // Filter by All
      fireEvent.click(screen.getByTestId('filter-all-btn'));
      expect(screen.getByText('Civilizações Antigas')).toBeInTheDocument();
      expect(screen.getByText('Frações e Decimais')).toBeInTheDocument();
    });

    it('submits audio recording evidence and supports closing modal', async () => {
      localStorage.setItem(
        'learner_session',
        JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' })
      );

      let submittedBody: Record<string, unknown> | null = null;

      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/agenda')) {
          return { ok: true, json: async () => ({ date: '2026-09-17', items: [] }) } as Response;
        }
        if (url.includes('/progress')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'track-1',
                competency: { code: 'MUS-01', title: 'Canto e Recitação' },
              },
            ],
          } as Response;
        }
        if (url.includes('/evidence-submissions') && init?.method === 'POST') {
          submittedBody = JSON.parse(String(init.body));
          return {
            ok: true,
            status: 201,
            json: async () => ({ id: 'ev-audio-1' }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<LearnerAgendaPage />);

      fireEvent.click(screen.getByTestId('tab-progress'));

      await waitFor(() => {
        expect(screen.getByText('Canto e Recitação')).toBeInTheDocument();
      });

      // Open modal from header button
      fireEvent.click(screen.getByTestId('header-open-evidence-btn'));
      expect(screen.getByTestId('learner-evidence-modal')).toBeInTheDocument();

      // Cancel button test
      fireEvent.click(screen.getByTestId('cancel-evidence-btn'));
      await waitFor(() => {
        expect(screen.queryByTestId('learner-evidence-modal')).not.toBeInTheDocument();
      });

      // Reopen and submit AUDIO type
      fireEvent.click(screen.getByTestId('open-evidence-modal-btn'));
      expect(screen.getByTestId('learner-evidence-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('evidence-type-select'), {
        target: { value: 'AUDIO' },
      });
      fireEvent.change(screen.getByTestId('evidence-title-input'), {
        target: { value: 'Gravação da Recitação do Salmo 23' },
      });
      fireEvent.change(screen.getByTestId('evidence-url-input'), {
        target: { value: 'https://exemplo.com/audio-salmo23.mp3' },
      });

      fireEvent.click(screen.getByTestId('submit-evidence-btn'));

      await waitFor(() => {
        expect(submittedBody).toMatchObject({
          evidenceTypeCode: 'AUDIO',
          title: 'Gravação da Recitação do Salmo 23',
          url: 'https://exemplo.com/audio-salmo23.mp3',
        });
      });
    });
  });
});
