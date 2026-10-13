import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import {
  GuidedTour,
  DEFAULT_TOUR_STEPS,
  type TourStep,
} from '../src/components/dashboard/guided-tour';

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';

describe('GuidedTour', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retorna null e não renderiza nada se isOpen = false', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={false}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    expect(screen.queryByTestId('guided-tour')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza o primeiro passo com título, descrição e indicador Passo 1 de 5 (pt-BR)', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    expect(screen.getByTestId('guided-tour')).toBeInTheDocument();
    expect(screen.getByText('Passo 1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Navegação & Módulos')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Acesse Educandos, Currículo, Agenda semanal, Diário de Aprendizagem, Portfólio fotográfico e Relatórios estruturados.'
      )
    ).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).toBeDisabled();

    expect(screen.getByRole('button', { name: /próximo/i })).toBeInTheDocument();
    expect(screen.getByTestId('tour-skip-btn')).toHaveTextContent('Pular e sair');
  });

  it('avança para o próximo passo ao clicar em "Próximo"', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const nextButton = screen.getByRole('button', { name: /próximo/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('Passo 2 de 5')).toBeInTheDocument();
    expect(screen.getByText('Foco do Educando')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Alterne facilmente entre o acompanhamento de cada filho individualmente ou veja a visão consolidada de toda a família.'
      )
    ).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /anterior/i });
    expect(prevButton).not.toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();
  });

  it('volta para o passo anterior ao clicar em "Anterior"', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const nextButton = screen.getByRole('button', { name: /próximo/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('Passo 2 de 5')).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /anterior/i });
    fireEvent.click(prevButton);

    expect(screen.getByText('Passo 1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Navegação & Módulos')).toBeInTheDocument();
    expect(prevButton).toBeDisabled();
  });

  it('botão "Pular e sair" invoca onSkip', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const skipButton = screen.getByTestId('tour-skip-btn');
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('botão de fechar (X) também invoca onSkip', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const closeButton = screen.getByTestId('tour-close-btn');
    fireEvent.click(closeButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('no último passo (passo 5), exibe botão "Concluir Tour" (não "Próximo") e clicar nele invoca onComplete', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    // Passo 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    // Passo 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    // Passo 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
    // Passo 4 -> 5
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    expect(screen.getByText('Passo 5 de 5')).toBeInTheDocument();
    expect(screen.getByText('Tudo Pronto para Começar!')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Você conheceu os principais pontos do Aletheia. Parabéns pelo início desta jornada educativa!'
      )
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /próximo/i })).not.toBeInTheDocument();

    const finishButton = screen.getByRole('button', { name: /concluir tour/i });
    expect(finishButton).toBeInTheDocument();
    fireEvent.click(finishButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it('trata ausência do seletor no DOM graciosamente com fallback centralizado', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    const customSteps: TourStep[] = [
      {
        targetSelector: '#element-does-not-exist',
        titleKey: 'dashboard.tour.steps.step1.title',
        descriptionKey: 'dashboard.tour.steps.step1.description',
      },
    ];

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          steps={customSteps}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const tourCard = screen.getByTestId('tour-card');
    expect(tourCard).toBeInTheDocument();
    expect(tourCard).toHaveAttribute('data-fallback', 'true');
    expect(screen.queryByTestId('tour-spotlight-highlight')).not.toBeInTheDocument();

    expect(screen.getByText('Navegação & Módulos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concluir tour/i })).toBeInTheDocument();
  });

  it('encontra o elemento no DOM e projeta o spotlight highlight', () => {
    const targetNav = document.createElement('nav');
    targetNav.setAttribute('data-testid', 'appshell-nav');
    document.body.appendChild(targetNav);

    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    const highlight = screen.getByTestId('tour-spotlight-highlight');
    expect(highlight).toBeInTheDocument();

    const tourCard = screen.getByTestId('tour-card');
    expect(tourCard).toHaveAttribute('data-fallback', 'false');

    targetNav.remove();
  });

  it('aceita lista customizada de passos e adapta o indicador', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    const customSteps: TourStep[] = [
      {
        titleKey: 'dashboard.tour.steps.step1.title',
        descriptionKey: 'dashboard.tour.steps.step1.description',
      },
      {
        titleKey: 'dashboard.tour.steps.step2.title',
        descriptionKey: 'dashboard.tour.steps.step2.description',
      },
    ];

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          steps={customSteps}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Passo 1 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    expect(screen.getByText('Passo 2 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concluir tour/i })).toBeInTheDocument();
  });

  it('permite fechar via tecla Escape disparando onSkip', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('exporta DEFAULT_TOUR_STEPS com 5 passos configurados', () => {
    expect(DEFAULT_TOUR_STEPS).toHaveLength(5);
    expect(DEFAULT_TOUR_STEPS[0]?.targetSelector).toBe('[data-testid="appshell-nav"]');
    expect(DEFAULT_TOUR_STEPS[1]?.targetSelector).toBe('[data-testid="learner-focus-container"]');
    expect(DEFAULT_TOUR_STEPS[2]?.targetSelector).toBe('[data-testid="scripture-card"]');
    expect(DEFAULT_TOUR_STEPS[3]?.targetSelector).toBe('[data-testid="dashboard-content"]');
    expect(DEFAULT_TOUR_STEPS[4]?.targetSelector).toBeUndefined();
  });

  it('renderiza textos traduzidos sob LocaleProvider em en-US e es-ES', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    // en-US
    localStorage.setItem('aletheia_locale', 'en-US');
    const { unmount: unmountEn } = render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Navigation & Modules')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByTestId('tour-skip-btn')).toHaveTextContent('Skip and exit');
    unmountEn();

    // es-ES
    localStorage.setItem('aletheia_locale', 'es-ES');
    render(
      <LocaleProvider>
        <GuidedTour
          isOpen={true}
          familyId={FAMILY_ID}
          onComplete={onComplete}
          onSkip={onSkip}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Navegación y Módulos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    expect(screen.getByTestId('tour-skip-btn')).toHaveTextContent('Saltar y salir');
  });
});
