import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

function Probe({ translationKey, vars }: { translationKey: string; vars?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey, vars)}</span>;
}

describe('Wave 3: Curriculum & Lessons i18n parity', () => {
  describe('Dicionários e Paridade Estrutural (lessons & curriculum)', () => {
    it('possui namespace lessons registrado em ptBR, enUS e esES com status de lição', () => {
      expect((ptBR as any).lessons).toBeDefined();
      expect((enUS as any).lessons).toBeDefined();
      expect((esES as any).lessons).toBeDefined();

      expect((ptBR as any).lessons.statusPlanned).toBe('Planejada');
      expect((enUS as any).lessons.statusPlanned).toBe('Planned');
      expect((esES as any).lessons.statusPlanned).toBe('Planificada');
    });

    it('possui namespace curriculum registrado com seções de páginas e wizard', () => {
      expect((ptBR as any).curriculum).toBeDefined();
      expect((enUS as any).curriculum).toBeDefined();
      expect((esES as any).curriculum).toBeDefined();

      expect((ptBR as any).curriculum.pages.curriculum.title).toBe('Planejamento Curricular');
      expect((enUS as any).curriculum.pages.curriculum.title).toBe('Curriculum Planning');
      expect((esES as any).curriculum.pages.curriculum.title).toBe('Planificación Curricular');
    });

    it('possui chaves de modais de lição em ptBR, enUS e esES', () => {
      expect((ptBR as any).lessons.formModal.newTitle).toBe('Planejar Nova Lição');
      expect((enUS as any).lessons.formModal.newTitle).toBe('Plan New Lesson');
      expect((esES as any).lessons.formModal.newTitle).toBe('Planificar Nueva Lección');

      expect((ptBR as any).lessons.completeModal.title).toBe('Concluir Lição');
      expect((enUS as any).lessons.completeModal.title).toBe('Complete Lesson');
      expect((esES as any).lessons.completeModal.title).toBe('Completar Lección');

      expect((ptBR as any).lessons.rescheduleModal.title).toBe('Reagendar Lição');
      expect((enUS as any).lessons.rescheduleModal.title).toBe('Reschedule Lesson');
      expect((esES as any).lessons.rescheduleModal.title).toBe('Reprogramar Lección');
    });

    it('possui chaves de rotina semanal e blocos', () => {
      expect((ptBR as any).lessons.routineModal.titleNew).toBe('Novo Bloco de Rotina');
      expect((enUS as any).lessons.routineModal.titleNew).toBe('New Routine Block');
      expect((esES as any).lessons.routineModal.titleNew).toBe('Nuevo Bloque de Rutina');
    });

    it('traduz chaves via useLocale() dinamicamente', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <Probe translationKey="curriculum.pages.curriculum.title" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Curriculum Planning');
    });
  });
});
