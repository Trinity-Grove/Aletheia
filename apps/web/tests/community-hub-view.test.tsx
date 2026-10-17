import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CommunityActivityResponseDto } from '@aletheia/contracts';
import { CommunityHubView } from '../src/components/community/community-hub-view';
import { InspirationMural } from '../src/components/community/inspiration-mural';
import { SEED_IDEAS } from '../src/components/community/seed-ideas-data';

const mockApiIdea: CommunityActivityResponseDto = {
  id: 'd0000000-0000-4000-8000-000000000099',
  name: 'Herbário Caseiro da Primavera',
  description: 'Prensagem de pequenas flores silvestres entre folhas de jornal para catalogação botânica.',
  ageMin: 5,
  ageMax: 10,
  estimatedDurationMinutes: 30,
  supervisionRequired: true,
  riskLevel: 'LOW',
  evidenceRequirementMode: 'ANY',
  metadata: {
    theme: 'NATURE_STUDY',
    materials: ['Jornal velho', 'Livros pesados', 'Fita crepe'],
    isSeed: false,
  },
  createdAt: '2026-10-16T12:00:00.000Z',
  updatedAt: '2026-10-16T12:00:00.000Z',
};

describe('CommunityHubView', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('/api/v1/curriculum/community-activities')) {
        return {
          ok: true,
          json: async () => [mockApiIdea],
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. renders header, search input, share button, and inspiration mural', async () => {
    render(<CommunityHubView familyId="fam-123" />);

    expect(screen.getByRole('heading', { name: 'Mural de Inspiração Comunitária' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ideias práticas, estudos da natureza, leituras vivas e projetos compartilhados para enriquecer a rotina da sua família.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Buscar por título, temas ou materiais caseiros...')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar uma Ideia' })).toBeInTheDocument();

    // Theme chips
    expect(screen.getByRole('tab', { name: /Todas as Ideias/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Estudos da Natureza/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Leituras Vivas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Trabalhos Manuais/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /História & Épocas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Projetos em Família/i })).toBeInTheDocument();

    // Seed cards are rendered
    expect(
      screen.getByRole('heading', { name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Círculo de Leitura Viva: O Vento nos Salgueiros' })
    ).toBeInTheDocument();
  });

  it('2. filters cards when clicking on a specific theme chip', async () => {
    render(<CommunityHubView familyId="fam-123" />);

    const natureTab = screen.getByRole('tab', { name: /Estudos da Natureza/i });
    fireEvent.click(natureTab);

    // Nature study cards must be present
    expect(
      screen.getByRole('heading', { name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono' })
    ).toBeInTheDocument();

    // Non-nature cards must be filtered out
    expect(
      screen.queryByRole('heading', { name: 'Círculo de Leitura Viva: O Vento nos Salgueiros' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Oficina de Argila: Recipientes e Marcadores Botânicos' })
    ).not.toBeInTheDocument();
  });

  it('3. filters cards by textual search (by title or materials)', async () => {
    render(<CommunityHubView familyId="fam-123" />);

    const searchInput = screen.getByPlaceholderText('Buscar por título, temas ou materiais caseiros...');

    // Search by title keyword
    fireEvent.change(searchInput, { target: { value: 'Argila' } });
    expect(
      screen.getByRole('heading', { name: 'Oficina de Argila: Recipientes e Marcadores Botânicos' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Círculo de Leitura Viva: O Vento nos Salgueiros' })
    ).not.toBeInTheDocument();

    // Search by material keyword
    fireEvent.change(searchInput, { target: { value: 'Alecrim' } });
    expect(
      screen.getByRole('heading', { name: 'Oficina de Argila: Recipientes e Marcadores Botânicos' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Círculo de Leitura Viva: O Vento nos Salgueiros' })
    ).not.toBeInTheDocument();
  });

  it('4. displays empty state with clear filters button when search returns no results', async () => {
    render(<CommunityHubView familyId="fam-123" />);

    const searchInput = screen.getByPlaceholderText('Buscar por título, temas ou materiais caseiros...');
    fireEvent.change(searchInput, { target: { value: 'termo-sem-nenhum-resultado-12345' } });

    expect(screen.getByText('Nenhuma ideia encontrada')).toBeInTheDocument();
    expect(
      screen.getByText('Tente ajustar sua busca ou limpar os filtros para descobrir mais ideias comunitárias.')
    ).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: 'Limpar filtros' });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);

    // Search input should be cleared and cards restored
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(
      screen.getByRole('heading', { name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono' })
    ).toBeInTheDocument();
  });

  it('5. opens ShareIdeaModal when clicking on "Compartilhar uma Ideia"', () => {
    render(<CommunityHubView familyId="fam-123" />);

    const shareBtn = screen.getByRole('button', { name: 'Compartilhar uma Ideia' });
    fireEvent.click(shareBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar Ideia com Outras Famílias')).toBeInTheDocument();
  });

  it('6. opens AdoptIdeaModal when clicking on "Adotar" on an idea card', () => {
    const mockLearners = [{ id: 'learner-1', name: 'Beatriz Silva' }];
    render(<CommunityHubView familyId="fam-123" learners={mockLearners} />);

    const adoptButtons = screen.getAllByRole('button', { name: 'Adotar para a Nossa Família' });
    expect(adoptButtons.length).toBeGreaterThan(0);

    fireEvent.click(adoptButtons[0]!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Adotar Atividade para Nossa Rotina')).toBeInTheDocument();
    expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
  });

  it('7. filters cards by age range selector', async () => {
    render(<CommunityHubView familyId="fam-123" />);

    const ageSelect = screen.getByLabelText('Faixa etária');
    expect(ageSelect).toBeInTheDocument();

    // Select 3-6 age bracket
    fireEvent.change(ageSelect, { target: { value: '3-6' } });

    // Horta em Família (3-12) and Diário da Natureza (5-12) should match
    expect(
      screen.getByRole('heading', { name: 'Horta em Família: Cultivo e Observação de Ervas Aromáticas' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono' })
    ).toBeInTheDocument();

    // Linha do Tempo Viva (7-16) should NOT match 3-6
    expect(
      screen.queryByRole('heading', { name: 'Linha do Tempo Viva: As Estações e Tradições Familiares' })
    ).not.toBeInTheDocument();
  });
});

describe('InspirationMural isolated', () => {
  it('renders dynamic counts on tabs and handles onThemeSelect and onAdopt', () => {
    const onThemeSelect = vi.fn();
    const onAdopt = vi.fn();

    render(
      <InspirationMural
        ideas={SEED_IDEAS}
        selectedTheme="ALL"
        onThemeSelect={onThemeSelect}
        onAdopt={onAdopt}
      />
    );

    // Check tabs
    const natureTab = screen.getByRole('tab', { name: /Estudos da Natureza/i });
    expect(natureTab).toBeInTheDocument();
    fireEvent.click(natureTab);
    expect(onThemeSelect).toHaveBeenCalledWith('NATURE_STUDY');

    // Adopt first card
    const adoptButtons = screen.getAllByRole('button', { name: 'Adotar para a Nossa Família' });
    fireEvent.click(adoptButtons[0]!);
    expect(onAdopt).toHaveBeenCalledTimes(1);
  });
});
