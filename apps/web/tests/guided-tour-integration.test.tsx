import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { DashboardResponseDto } from '@aletheia/contracts';
import type { DashboardController } from '../src/components/dashboard/use-dashboard';
import HomePage from '../app/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} data-next-link="true" />
  ),
}));

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
const LEARNER_A = '22222222-2222-4222-8222-222222222222';
const LEARNER_B = '33333333-3333-4333-8333-333333333333';

function buildDashboard(overrides: Partial<DashboardResponseDto> = {}): DashboardResponseDto {
  return {
    date: '2026-10-10',
    family: { id: FAMILY_ID, name: 'Família Trinity Grove' },
    learners: [
      { id: LEARNER_A, displayName: 'Ana' },
      { id: LEARNER_B, displayName: 'Mateus' },
    ],
    activeLearnerId: LEARNER_A,
    journey: {
      completedMinutes: 60,
      targetMinutes: 240,
      completedLessons: 1,
      totalLessons: 3,
      daySequence: 7,
    },
    activities: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        title: 'Devocional Matinal',
        scheduledTime: '08:00',
        completed: true,
        type: 'devotional',
      },
    ],
    onboarding: {
      dismissed: false,
      completedCount: 1,
      totalCount: 4,
      steps: [
        { id: 'create_learner', completed: true, actionUrl: '/learners' },
        { id: 'choose_curriculum', completed: false, actionUrl: '/curriculum' },
        { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
        { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
      ],
    },
    ...overrides,
  };
}

const mockController = vi.hoisted(() => ({
  useDashboard: vi.fn(),
}));

vi.mock('../src/components/dashboard/use-dashboard', () => mockController);

function buildController(overrides: Partial<DashboardController> = {}): DashboardController {
  return {
    data: null,
    status: 'success',
    errorMessage: null,
    activeLearnerId: LEARNER_A,
    setActiveLearnerId: vi.fn(),
    retry: vi.fn(),
    completeActivity: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Dashboard Guided Tour & Onboarding Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
    mockController.useDashboard.mockReset();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('não renderiza o card estático GettingStartedCard no dashboard mesmo com onboarding pendente', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard({
          onboarding: {
            dismissed: false,
            completedCount: 0,
            totalCount: 4,
            steps: [
              { id: 'create_learner', completed: false, actionUrl: '/learners' },
              { id: 'choose_curriculum', completed: false, actionUrl: '/curriculum' },
              { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
              { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
            ],
          },
        }),
      }),
    );

    render(<HomePage />);

    expect(screen.queryByTestId('getting-started-card')).not.toBeInTheDocument();
  });

  it('exibe o diálogo WelcomeTourDialog quando onboarding.dismissed é false', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard(),
      }),
    );

    render(<HomePage />);

    expect(screen.getByTestId('welcome-tour-dialog')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao Aletheia!')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-tour-start-btn')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-tour-dismiss-btn')).toBeInTheDocument();
  });

  it('não exibe o diálogo WelcomeTourDialog quando onboarding.dismissed é true', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard({
          onboarding: {
            dismissed: true,
            completedCount: 2,
            totalCount: 4,
            steps: [
              { id: 'create_learner', completed: true, actionUrl: '/learners' },
              { id: 'choose_curriculum', completed: true, actionUrl: '/curriculum' },
              { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
              { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
            ],
          },
        }),
      }),
    );

    render(<HomePage />);

    expect(screen.queryByTestId('welcome-tour-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();
  });

  it('ao clicar em "Pular e não ver mais", fecha o diálogo de boas-vindas e não exibe o tour', async () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard(),
      }),
    );

    render(<HomePage />);

    const dismissBtn = screen.getByTestId('welcome-tour-dismiss-btn');
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('welcome-tour-dialog')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/v1/families/${encodeURIComponent(FAMILY_ID)}/settings`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ onboardingDismissed: true }),
      }),
    );
  });

  it('ao clicar em "Iniciar Tour Guiado" no diálogo de boas-vindas, fecha o diálogo e abre o GuidedTour', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard(),
      }),
    );

    render(<HomePage />);

    const startBtn = screen.getByTestId('welcome-tour-start-btn');
    fireEvent.click(startBtn);

    expect(screen.queryByTestId('welcome-tour-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('guided-tour')).toBeInTheDocument();
    expect(screen.getByText('Passo 1 de 5')).toBeInTheDocument();
  });

  it('oculta o botão da barra superior quando o onboarding já foi dispensado', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard({
          onboarding: {
            dismissed: true,
            completedCount: 4,
            totalCount: 4,
            steps: [
              { id: 'create_learner', completed: true, actionUrl: '/learners' },
              { id: 'choose_curriculum', completed: true, actionUrl: '/curriculum' },
              { id: 'schedule_lesson', completed: true, actionUrl: '/schedule' },
              { id: 'complete_first_activity', completed: true, actionUrl: '/aluno/agenda' },
            ],
          },
        }),
      }),
    );

    render(<HomePage />);

    expect(screen.queryByTestId('welcome-tour-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();

    expect(screen.queryByTestId('start-tour-btn')).not.toBeInTheDocument();
  });

  it('concluir o tour dispara PATCH de dispensa e POST de gamificação para o educando ativo', async () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard(),
      }),
    );

    render(<HomePage />);

    // Iniciar pelo diálogo
    fireEvent.click(screen.getByTestId('welcome-tour-start-btn'));
    expect(screen.getByTestId('guided-tour')).toBeInTheDocument();

    // Avançar do passo 1 ao 5
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })); // 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })); // 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })); // 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /próximo/i })); // 4 -> 5

    expect(screen.getByText('Passo 5 de 5')).toBeInTheDocument();
    expect(screen.getByText('Tudo Pronto para Começar!')).toBeInTheDocument();

    const finishBtn = screen.getByTestId('tour-finish-btn');
    fireEvent.click(finishBtn);

    await waitFor(() => {
      // Verifica PATCH de dispensa nas configurações da família
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/families/${encodeURIComponent(FAMILY_ID)}/settings`,
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ onboardingDismissed: true }),
        }),
      );
    });

    await waitFor(() => {
      // Verifica POST de reconhecimento do badge de gamificação FIRST_STEP
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/gamification/families/${encodeURIComponent(FAMILY_ID)}/learners/${encodeURIComponent(LEARNER_A)}/badges/acknowledge`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ badgeCodes: ['FIRST_STEP'] }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('start-tour-btn')).not.toBeInTheDocument();
  });

  it('pular o tour via botão "Pular e sair" fecha o tour sem acionar a API de gamificação', async () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard(),
      }),
    );

    render(<HomePage />);

    fireEvent.click(screen.getByTestId('welcome-tour-start-btn'));
    expect(screen.getByTestId('guided-tour')).toBeInTheDocument();

    const skipBtn = screen.getByTestId('tour-skip-btn');
    fireEvent.click(skipBtn);

    expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();

    // Gamification acknowledge NÃO deve ter sido chamado
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/badges/acknowledge'),
      expect.anything(),
    );
  });

  it('conclui o tour graciosamente quando a família não possui educandos cadastrados', async () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: buildDashboard({
          learners: [],
          activeLearnerId: null,
        }),
      }),
    );

    render(<HomePage />);

    fireEvent.click(screen.getByTestId('welcome-tour-start-btn'));
    expect(screen.getByTestId('guided-tour')).toBeInTheDocument();

    // 1 -> 5
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    const finishBtn = screen.getByTestId('tour-finish-btn');
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/families/${encodeURIComponent(FAMILY_ID)}/settings`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ onboardingDismissed: true }),
        }),
      );
    });

    // Gamification não chamada
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/badges/acknowledge'),
      expect.anything(),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();
    });
  });
});
