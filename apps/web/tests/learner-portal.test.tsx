import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LearnerLoginPage from '../app/aluno/login/page';
import LearnerAgendaPage from '../app/aluno/agenda/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('familyId=f0000000-0000-0000-0000-000000000001'),
}));

describe('Learner Portal (Modo Educando)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
  });
});
