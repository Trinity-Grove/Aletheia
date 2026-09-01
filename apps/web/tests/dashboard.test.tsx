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
const LESSON_ID = '55555555-5555-4555-8555-555555555555';

function validDashboard(overrides: Partial<DashboardResponseDto> = {}): DashboardResponseDto {
  return {
    date: '2026-08-29',
    family: { id: FAMILY_ID, name: 'Família Teste' },
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
      {
        id: LESSON_ID,
        title: 'Lições de Latim',
        subjectName: 'Latim',
        scheduledTime: '09:00',
        durationMinutes: 45,
        completed: false,
        type: 'lesson',
      },
    ],
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
    status: 'loading',
    errorMessage: null,
    activeLearnerId: null,
    setActiveLearnerId: vi.fn(),
    retry: vi.fn(),
    completeActivity: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('HomePage dashboard states', () => {
  beforeEach(() => {
    mockController.useDashboard.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a busy loading state while the dashboard is loading', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({ data: null, status: 'loading' }),
    );

    render(<HomePage />);

    const loading = screen.getByTestId('dashboard-loading');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/carregando o painel/i)).toBeInTheDocument();
  });

  it('links to onboarding when no active family is present (idle)', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({ data: null, status: 'idle' }),
    );

    render(<HomePage />);

    const link = screen.getByRole('link', { name: /configurar família/i });
    expect(link).toHaveAttribute('href', '/onboarding');
    expect(screen.queryByText('Jornada Diária de Aprendizagem')).not.toBeInTheDocument();
  });

  it('links to learner setup when the family has no learners', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard({ learners: [], activeLearnerId: null }),
        status: 'success',
      }),
    );

    render(<HomePage />);

    const link = screen.getByRole('link', { name: /cadastrar educandos/i });
    expect(link).toHaveAttribute('href', '/learners');
    expect(screen.queryByText('Jornada Diária de Aprendizagem')).not.toBeInTheDocument();
  });

  it('offers a retry action after a request failure', () => {
    const retry = vi.fn();
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: null,
        status: 'error',
        errorMessage: 'Não foi possível carregar o painel.',
        retry,
      }),
    );

    render(<HomePage />);

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    fireEvent.click(retryButton);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders an empty-activities state without fake cards', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard({ activities: [] }),
        status: 'success',
        activeLearnerId: LEARNER_A,
      }),
    );

    render(<HomePage />);

    expect(screen.getByText(/nenhuma atividade para hoje/i)).toBeInTheDocument();
    expect(screen.queryByTestId('activity-item-999')).not.toBeInTheDocument();
  });

  it('renders the real learner and journey from the controller', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard(),
        status: 'success',
        activeLearnerId: LEARNER_A,
      }),
    );

    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('Jornada Diária de Aprendizagem')).toBeInTheDocument();
    expect(screen.getByText('Lições de Latim')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('invokes the learner selection callback from the focus header', () => {
    const setActiveLearnerId = vi.fn();
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard(),
        status: 'success',
        activeLearnerId: LEARNER_A,
        setActiveLearnerId,
      }),
    );

    render(<HomePage />);

    fireEvent.click(screen.getByTestId(`learner-pill-${LEARNER_B}`));
    expect(setActiveLearnerId).toHaveBeenCalledWith(LEARNER_B);
  });

  it('leaves rendered progress unchanged when completion fails', async () => {
    const completeActivity = vi.fn().mockRejectedValue(new Error('server error'));
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard(),
        status: 'success',
        activeLearnerId: LEARNER_A,
        completeActivity,
      }),
    );

    render(<HomePage />);

    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`toggle-activity-${LESSON_ID}`));

    await waitFor(() => expect(completeActivity).toHaveBeenCalled());

    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Lições de Latim')).toBeInTheDocument();
  });

  it('announces a failure to complete a lesson in an aria-live region and keeps progress', async () => {
    const completeActivity = vi.fn().mockRejectedValue(new Error('server error'));
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard(),
        status: 'success',
        activeLearnerId: LEARNER_A,
        completeActivity,
      }),
    );

    render(<HomePage />);

    const liveRegion = screen.getByTestId('completion-live-region');
    expect(liveRegion).toHaveAttribute('aria-live');

    fireEvent.click(screen.getByTestId(`toggle-activity-${LESSON_ID}`));

    await waitFor(() =>
      expect(screen.getByText('Não foi possível concluir a lição.')).toBeInTheDocument(),
    );

    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('keeps the dashboard content mounted and reports busy during a learner refetch', () => {
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard(),
        status: 'loading',
        activeLearnerId: LEARNER_A,
      }),
    );

    render(<HomePage />);

    expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
    expect(screen.getByText('Jornada Diária de Aprendizagem')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();

    const content = screen.getByTestId('dashboard-content');
    expect(content).toHaveAttribute('aria-busy', 'true');
  });

  it('hides completion controls for devotional/routine while exposing them for lessons', () => {
    const devotionalId = '44444444-4444-4444-8444-444444444444';
    const routineId = '66666666-6666-4666-8666-666666666666';
    mockController.useDashboard.mockReturnValue(
      buildController({
        data: validDashboard({
          activities: [
            {
              id: devotionalId,
              title: 'Devocional Matinal',
              completed: false,
              type: 'devotional',
            },
            {
              id: routineId,
              title: 'Ritual Noturno',
              completed: false,
              type: 'routine',
            },
            {
              id: LESSON_ID,
              title: 'Lições de Latim',
              subjectName: 'Latim',
              completed: false,
              type: 'lesson',
            },
          ],
        }),
        status: 'success',
        activeLearnerId: LEARNER_A,
      }),
    );

    render(<HomePage />);

    expect(screen.queryByTestId(`toggle-activity-${devotionalId}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`toggle-activity-${routineId}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`toggle-activity-${LESSON_ID}`)).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Desmarcar' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Concluir' })).toHaveLength(1);
  });
});
