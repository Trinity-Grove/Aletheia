import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { WelcomeTourDialog } from '../src/components/dashboard/welcome-tour-dialog';

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';

describe('WelcomeTourDialog', () => {
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

  it('não renderiza nada quando isOpen é false', () => {
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={false}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Bem-vindo ao Aletheia!')).not.toBeInTheDocument();
  });

  it('renderiza modal de boas-vindas com título, subtítulo e botões traduzidos (pt-BR)', () => {
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao Aletheia!')).toBeInTheDocument();
    expect(
      screen.getByText('Gostaria de um tour guiado rápido pelas principais ferramentas do sistema?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar tour guiado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pular e não ver mais/i })).toBeInTheDocument();
  });

  it('chama onStartTour ao clicar em "Iniciar Tour Guiado"', () => {
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    const startButton = screen.getByRole('button', { name: /iniciar tour guiado/i });
    fireEvent.click(startButton);

    expect(onStartTour).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('envia PATCH e invoca onDismiss ao clicar em "Pular e não ver mais"', async () => {
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    const dismissButton = screen.getByRole('button', { name: /pular e não ver mais/i });
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
    expect(onStartTour).not.toHaveBeenCalled();
  });

  it('lida com falha de rede graciosamente sem travar a interface e ainda invoca onDismiss', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    const dismissButton = screen.getByRole('button', { name: /pular e não ver mais/i });
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
    expect(onStartTour).not.toHaveBeenCalled();
  });

  it('renderiza textos traduzidos sob LocaleProvider em en-US e es-ES', () => {
    const onStartTour = vi.fn();
    const onDismiss = vi.fn();

    // en-US
    localStorage.setItem('aletheia_locale', 'en-US');
    const { unmount: unmountEn } = render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Welcome to Aletheia!')).toBeInTheDocument();
    expect(
      screen.getByText('Would you like a quick guided tour of the system’s main features?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start guided tour/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip and don't show again/i })).toBeInTheDocument();
    unmountEn();

    // es-ES
    localStorage.setItem('aletheia_locale', 'es-ES');
    render(
      <LocaleProvider>
        <WelcomeTourDialog
          familyId={FAMILY_ID}
          isOpen={true}
          onStartTour={onStartTour}
          onDismiss={onDismiss}
        />
      </LocaleProvider>
    );

    expect(screen.getByText('¡Bienvenido a Aletheia!')).toBeInTheDocument();
    expect(
      screen.getByText(
        '¿Desea un recorrido guiado rápido por las principales herramientas del sistema?'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar tour guiado/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /omitir y no volver a mostrar/i })
    ).toBeInTheDocument();
  });
});
