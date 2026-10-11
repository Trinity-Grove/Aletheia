import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { OnboardingChecklistDto } from '@aletheia/contracts';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { GettingStartedCard } from '../src/components/dashboard/getting-started-card';

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';

function buildChecklist(overrides: Partial<OnboardingChecklistDto> = {}): OnboardingChecklistDto {
  return {
    dismissed: false,
    completedCount: 1,
    totalCount: 4,
    steps: [
      {
        id: 'create_learner',
        completed: true,
        actionUrl: '/learners',
      },
      {
        id: 'choose_curriculum',
        completed: false,
        actionUrl: '/curriculum',
      },
      {
        id: 'schedule_lesson',
        completed: false,
        actionUrl: '/schedule',
      },
      {
        id: 'complete_first_activity',
        completed: false,
        actionUrl: '/aluno/agenda',
      },
    ],
    ...overrides,
  };
}

describe('GettingStartedCard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renderiza os 4 passos e a barra de progresso', () => {
    const checklist = buildChecklist({
      completedCount: 1,
      totalCount: 4,
    });

    render(
      <LocaleProvider>
        <GettingStartedCard checklist={checklist} familyId={FAMILY_ID} />
      </LocaleProvider>
    );

    // Título e subtítulo
    expect(screen.getByText('Primeiros Passos no Aletheia')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Complete estes 4 marcos essenciais para estruturar a educação clássica da sua família.'
      )
    ).toBeInTheDocument();

    // Progresso textual e barra
    expect(screen.getByText('1 de 4 concluídos')).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');

    // 4 passos
    expect(screen.getByText('Cadastrar Educando')).toBeInTheDocument();
    expect(screen.getByText('Definir Currículo')).toBeInTheDocument();
    expect(screen.getByText('Agendar Primeira Lição')).toBeInTheDocument();
    expect(screen.getByText('Concluir Primeira Atividade')).toBeInTheDocument();
  });

  it('exibe links apontando para as rotas corretas', () => {
    const checklist = buildChecklist();

    render(
      <LocaleProvider>
        <GettingStartedCard checklist={checklist} familyId={FAMILY_ID} />
      </LocaleProvider>
    );

    const linkLearners = screen.getByRole('link', { name: /ir para educandos/i });
    expect(linkLearners).toHaveAttribute('href', '/learners');

    const linkCurriculum = screen.getByRole('link', { name: /explorar currículo/i });
    expect(linkCurriculum).toHaveAttribute('href', '/curriculum');

    const linkSchedule = screen.getByRole('link', { name: /abrir agenda/i });
    expect(linkSchedule).toHaveAttribute('href', '/schedule');

    const linkStudentPortal = screen.getByRole('link', { name: /portal do aluno/i });
    expect(linkStudentPortal).toHaveAttribute('href', '/aluno/agenda');
  });

  it('exibe estado de conclusão diferenciado para passos concluídos e pendentes', () => {
    const checklist = buildChecklist({
      completedCount: 2,
      steps: [
        { id: 'create_learner', completed: true, actionUrl: '/learners' },
        { id: 'choose_curriculum', completed: true, actionUrl: '/curriculum' },
        { id: 'schedule_lesson', completed: false, actionUrl: '/schedule' },
        { id: 'complete_first_activity', completed: false, actionUrl: '/aluno/agenda' },
      ],
    });

    render(
      <LocaleProvider>
        <GettingStartedCard checklist={checklist} familyId={FAMILY_ID} />
      </LocaleProvider>
    );

    const step1Status = screen.getByTestId('step-status-create_learner');
    const step2Status = screen.getByTestId('step-status-choose_curriculum');
    const step3Status = screen.getByTestId('step-status-schedule_lesson');
    const step4Status = screen.getByTestId('step-status-complete_first_activity');

    expect(step1Status).toHaveTextContent('✓');
    expect(step2Status).toHaveTextContent('✓');
    expect(step3Status).not.toHaveTextContent('✓');
    expect(step4Status).not.toHaveTextContent('✓');
  });

  it('dispara PATCH de dispensa e invoca onDismiss ao clicar em "Ocultar guia"', async () => {
    const onDismiss = vi.fn();
    const checklist = buildChecklist();

    render(
      <LocaleProvider>
        <GettingStartedCard checklist={checklist} familyId={FAMILY_ID} onDismiss={onDismiss} />
      </LocaleProvider>
    );

    const dismissButton = screen.getByRole('button', { name: /ocultar guia/i });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/families/${encodeURIComponent(FAMILY_ID)}/settings`,
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ onboardingDismissed: true }),
        })
      );
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    // O card é removido da exibição
    expect(screen.queryByTestId('getting-started-card')).not.toBeInTheDocument();
  });

  it('renderiza corretamente sob LocaleProvider em outros idiomas (en-US)', () => {
    localStorage.setItem('aletheia_locale', 'en-US');
    const checklist = buildChecklist();

    render(
      <LocaleProvider>
        <GettingStartedCard checklist={checklist} familyId={FAMILY_ID} />
      </LocaleProvider>
    );

    expect(screen.getByText('Getting Started with Aletheia')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Complete these 4 essential milestones to set up your family's classical education."
      )
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 4 completed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss guide/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to learners/i })).toHaveAttribute(
      'href',
      '/learners'
    );
  });
});
