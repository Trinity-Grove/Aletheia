import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FamilyJurisdictionResponseDto } from '@aletheia/contracts';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import {
  LegalFrameworkCard,
  EvidenceProtectionGuide,
  First30DaysChecklistCard,
  LegalFaqAccordion,
  LegalGuideView,
} from '../src/components/legal-guide';

const mockJurisdiction: FamilyJurisdictionResponseDto = {
  code: 'BR',
  name: 'Brasil (Diretriz Federal)',
  version: 1,
  confidenceLevel: 'ESTABLISHED',
  minInstructionalDays: 200,
  minInstructionalHours: 800,
  officialSource: 'CF/88 art. 226/229; LDB art. 24, I; STF RE 888.815',
  legalBasisSummary: 'Jurisprudência do STF e primazia da família na educação.',
};

function renderWithLocale(ui: React.ReactElement, locale: 'pt-BR' | 'en-US' | 'es-ES' = 'pt-BR') {
  localStorage.setItem('aletheia_locale', locale);
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe('Legal Guide Hub Components', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJurisdiction,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('LegalFrameworkCard', () => {
    it('renderiza metas de dias letivos e carga horária a partir do DTO da jurisdição', () => {
      renderWithLocale(<LegalFrameworkCard jurisdiction={mockJurisdiction} />);

      expect(screen.getByText('Seus Direitos e Amparo Constitucional')).toBeInTheDocument();
      expect(screen.getByText('Meta Mínima de Dias Letivos')).toBeInTheDocument();
      expect(screen.getByText('200 dias')).toBeInTheDocument();
      expect(screen.getByText('Carga Horária Anual Mínima')).toBeInTheDocument();
      expect(screen.getByText('800 horas')).toBeInTheDocument();
      expect(screen.getByText('CF/88 art. 226/229; LDB art. 24, I; STF RE 888.815')).toBeInTheDocument();
      expect(
        screen.getByText('Jurisprudência do STF e primazia da família na educação.')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'O Aletheia apoia o registro rigoroso e a conformidade da sua família, mas este guia possui finalidade educativa e não substitui assessoria jurídica individual.'
        )
      ).toBeInTheDocument();
    });

    it('renderiza estado de carregamento quando isLoading for true', () => {
      renderWithLocale(<LegalFrameworkCard isLoading={true} />);

      expect(screen.getByTestId('legal-framework-loading')).toBeInTheDocument();
    });
  });

  describe('EvidenceProtectionGuide', () => {
    it('renderiza o guia de evidências com link apontando para /reports', () => {
      renderWithLocale(<EvidenceProtectionGuide />);

      expect(screen.getByText('Como se Proteger com Evidências de Aprendizagem')).toBeInTheDocument();
      const actionLink = screen.getByRole('link', { name: /Emitir Dossiê de Conformidade Anual/i });
      expect(actionLink).toBeInTheDocument();
      expect(actionLink).toHaveAttribute('href', '/reports');
      expect(
        screen.getByText('Gere o relatório consolidado com hash verificável na aba de Relatórios.')
      ).toBeInTheDocument();
    });
  });

  describe('First30DaysChecklistCard', () => {
    it('alterna etapas no checklist, atualiza barra de progresso e persiste no localStorage', () => {
      const onToggle = vi.fn();
      renderWithLocale(
        <First30DaysChecklistCard
          familyId="fam-1"
          learnersCount={0}
          onStepToggle={onToggle}
        />
      );

      expect(screen.getByText('0 de 6 etapas concluídas (0%)')).toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(6);
      const step1Checkbox = checkboxes[0]!;

      // Clica na primeira etapa (step1)
      fireEvent.click(step1Checkbox);

      expect(onToggle).toHaveBeenCalledWith('step1', true);
      expect(screen.getByText('1 de 6 etapas concluídas (17%)')).toBeInTheDocument();
      expect(localStorage.getItem('aletheia_checklist_30days_fam-1')).toBe(
        JSON.stringify(['step1'])
      );

      // Desmarca a primeira etapa
      fireEvent.click(step1Checkbox);
      expect(onToggle).toHaveBeenCalledWith('step1', false);
      expect(screen.getByText('0 de 6 etapas concluídas (0%)')).toBeInTheDocument();
      expect(localStorage.getItem('aletheia_checklist_30days_fam-1')).toBe(
        JSON.stringify([])
      );
    });

    it('auto-detecta e marca step1 como concluído quando learnersCount > 0 e sem localStorage prévio', () => {
      renderWithLocale(
        <First30DaysChecklistCard
          familyId="fam-2"
          learnersCount={2}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      const first = checkboxes[0]!;
      const second = checkboxes[1]!;
      expect(first.checked).toBe(true);
      expect(second.checked).toBe(false);
      expect(screen.getByText('1 de 6 etapas concluídas (17%)')).toBeInTheDocument();
    });

    it('respeita estado persistido existente no localStorage sobrepondo learnersCount', () => {
      localStorage.setItem(
        'aletheia_checklist_30days_fam-3',
        JSON.stringify(['step2', 'step3'])
      );

      renderWithLocale(
        <First30DaysChecklistCard
          familyId="fam-3"
          learnersCount={1}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      const first = checkboxes[0]!;
      const second = checkboxes[1]!;
      const third = checkboxes[2]!;
      expect(first.checked).toBe(false);
      expect(second.checked).toBe(true);
      expect(third.checked).toBe(true);
      expect(screen.getByText('2 de 6 etapas concluídas (33%)')).toBeInTheDocument();
    });

    it('exibe links de ação para cada etapa do checklist', () => {
      renderWithLocale(
        <First30DaysChecklistCard
          familyId="fam-links"
          learnersCount={0}
        />
      );

      expect(screen.getByRole('link', { name: /Ir para Educandos/i })).toHaveAttribute('href', '/learners');
      expect(screen.getByRole('link', { name: /Explorar Currículos/i })).toHaveAttribute('href', '/curriculum');
      expect(screen.getByRole('link', { name: /Configurar Agenda/i })).toHaveAttribute('href', '/schedule');
      expect(screen.getByRole('link', { name: /Abrir Diário/i })).toHaveAttribute('href', '/records');
      expect(screen.getByRole('link', { name: /Acessar Devocional/i })).toHaveAttribute('href', '/devotional');
      expect(screen.getByRole('link', { name: /Ver Relatórios/i })).toHaveAttribute('href', '/reports');
    });

    it('retorna lista vazia e não acessa localStorage quando familyId for vazio', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      renderWithLocale(
        <First30DaysChecklistCard
          familyId=""
          learnersCount={2}
        />
      );

      expect(getItemSpy).not.toHaveBeenCalledWith('aletheia_checklist_30days_');
      expect(screen.getByText('0 de 6 etapas concluídas (0%)')).toBeInTheDocument();
      getItemSpy.mockRestore();
    });
  });

  describe('LegalFaqAccordion', () => {
    it('expande e recolhe respostas ao clicar nas perguntas', () => {
      renderWithLocale(<LegalFaqAccordion />);

      expect(screen.getByText('Perguntas Frequentes (FAQ Jurídico)')).toBeInTheDocument();

      const q1Button = screen.getByRole('button', {
        name: /O ensino domiciliar é crime no Brasil\?/i,
      });

      // Inicialmente a resposta não está visível
      expect(
        screen.queryByText(/O Supremo Tribunal Federal \(STF\), no julgamento do Recurso Extraordinário 888\.815/i)
      ).not.toBeInTheDocument();

      // Clica para expandir
      fireEvent.click(q1Button);
      expect(
        screen.getByText(/O Supremo Tribunal Federal \(STF\), no julgamento do Recurso Extraordinário 888\.815/i)
      ).toBeInTheDocument();

      // Clica novamente para recolher
      fireEvent.click(q1Button);
      expect(
        screen.queryByText(/O Supremo Tribunal Federal \(STF\), no julgamento do Recurso Extraordinário 888\.815/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('LegalGuideView', () => {
    it('busca jurisdição da família e renderiza todos os cartões com badge ativo', async () => {
      renderWithLocale(<LegalGuideView familyId="fam-view" learnersCount={1} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/families/fam-view/jurisdiction',
          expect.objectContaining({ credentials: 'include' })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Jurisdição Ativa: Brasil (Diretriz Federal)')).toBeInTheDocument();
      });

      expect(screen.getByText('Amparo Legal & Primeiros Passos')).toBeInTheDocument();
      expect(screen.getByText('Checklist dos Primeiros 30 Dias')).toBeInTheDocument();
      expect(screen.getByText('Seus Direitos e Amparo Constitucional')).toBeInTheDocument();
      expect(screen.getByText('Como se Proteger com Evidências de Aprendizagem')).toBeInTheDocument();
      expect(screen.getByText('Perguntas Frequentes (FAQ Jurídico)')).toBeInTheDocument();
    });
  });
});
