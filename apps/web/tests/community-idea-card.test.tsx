import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CommunityActivityResponseDto } from '@aletheia/contracts';
import { CommunityIdeaCard } from '../src/components/community/community-idea-card';
import { SEED_IDEAS } from '../src/components/community/seed-ideas-data';

const mockSeedIdea: CommunityActivityResponseDto = {
  id: 'a0000000-0000-4000-8000-000000000001',
  name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono',
  description: 'Passeio ao ar livre para observar mudanças de estação, coletar folhas secas e fazer impressões botânicas.',
  ageMin: 5,
  ageMax: 12,
  estimatedDurationMinutes: 45,
  supervisionRequired: true,
  riskLevel: 'LOW',
  evidenceRequirementMode: 'ANY',
  metadata: {
    theme: 'NATURE_STUDY',
    materials: ['Caderno sem pauta', 'Lápis de cera', 'Lupa de mão'],
    isSeed: true,
  },
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
};

const mockCommunityIdea: CommunityActivityResponseDto = {
  id: 'b0000000-0000-4000-8000-000000000002',
  name: 'Teatro de Fantoches Bíblico',
  description: 'Criação de fantoches com meias para encenar histórias com as crianças.',
  ageMin: 4,
  ageMax: 10,
  estimatedDurationMinutes: 60,
  supervisionRequired: false,
  riskLevel: 'LOW',
  evidenceRequirementMode: 'ANY',
  metadata: {
    theme: 'LIVING_BOOKS',
    materials: ['Meias velhas', 'Botões', 'Lã'],
    isSeed: false,
  },
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
};

describe('CommunityIdeaCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders title, description, duration and age range', () => {
    render(<CommunityIdeaCard idea={mockSeedIdea} />);

    expect(
      screen.getByRole('heading', { name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Passeio ao ar livre para observar mudanças de estação, coletar folhas secas e fazer impressões botânicas.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('5-12 anos')).toBeInTheDocument();
    expect(screen.getByText('Com supervisão')).toBeInTheDocument();
  });

  it('renders theme badge with corresponding icon and translated label', () => {
    render(<CommunityIdeaCard idea={mockSeedIdea} />);

    const themeBadge = screen.getByTestId('community-idea-theme-badge');
    expect(themeBadge).toBeInTheDocument();
    expect(themeBadge).toHaveTextContent('🌿 Estudos da Natureza');
  });

  it('renders materials list when present in metadata', () => {
    render(<CommunityIdeaCard idea={mockSeedIdea} />);

    expect(screen.getByText('Materiais necessários:')).toBeInTheDocument();
    expect(screen.getByText('Caderno sem pauta')).toBeInTheDocument();
    expect(screen.getByText('Lápis de cera')).toBeInTheDocument();
    expect(screen.getByText('Lupa de mão')).toBeInTheDocument();
  });

  it('does not render materials section when empty or absent in metadata', () => {
    const ideaWithoutMaterials: CommunityActivityResponseDto = {
      ...mockSeedIdea,
      metadata: { theme: 'NATURE_STUDY', isSeed: true },
    };
    render(<CommunityIdeaCard idea={ideaWithoutMaterials} />);

    expect(screen.queryByText('Materiais necessários:')).not.toBeInTheDocument();
  });

  it('renders seed curation badge when metadata.isSeed is true and community badge when false', () => {
    const { unmount } = render(<CommunityIdeaCard idea={mockSeedIdea} />);
    expect(screen.getByText('Curadoria Aletheia')).toBeInTheDocument();
    expect(screen.queryByText('Ideia da Comunidade')).not.toBeInTheDocument();

    unmount();

    render(<CommunityIdeaCard idea={mockCommunityIdea} />);
    expect(screen.getByText('Ideia da Comunidade')).toBeInTheDocument();
    expect(screen.queryByText('Curadoria Aletheia')).not.toBeInTheDocument();
  });

  it('triggers onAdopt callback when clicking adopt button', () => {
    const onAdopt = vi.fn();
    render(<CommunityIdeaCard idea={mockSeedIdea} onAdopt={onAdopt} />);

    const adoptBtn = screen.getByRole('button', { name: 'Adotar para a Nossa Família' });
    fireEvent.click(adoptBtn);

    expect(onAdopt).toHaveBeenCalledTimes(1);
    expect(onAdopt).toHaveBeenCalledWith(mockSeedIdea);
  });

  it('disables button when disabled prop is true or isAdopting is true', () => {
    const onAdopt = vi.fn();
    const { rerender } = render(<CommunityIdeaCard idea={mockSeedIdea} onAdopt={onAdopt} disabled />);

    const adoptBtn = screen.getByRole('button', { name: 'Adotar para a Nossa Família' });
    expect(adoptBtn).toBeDisabled();

    fireEvent.click(adoptBtn);
    expect(onAdopt).not.toHaveBeenCalled();

    rerender(<CommunityIdeaCard idea={mockSeedIdea} onAdopt={onAdopt} isAdopting />);
    const adoptingBtn = screen.getByRole('button', { name: 'Adotando...' });
    expect(adoptingBtn).toBeDisabled();
  });
});

describe('SEED_IDEAS catalog', () => {
  it('contains at least 5 pedagogical seed ideas covering each core theme', () => {
    expect(SEED_IDEAS.length).toBeGreaterThanOrEqual(5);

    const themes = SEED_IDEAS.map((idea) => idea.metadata.theme);
    expect(themes).toContain('NATURE_STUDY');
    expect(themes).toContain('LIVING_BOOKS');
    expect(themes).toContain('HANDICRAFT');
    expect(themes).toContain('SEASONAL_HISTORY');
    expect(themes).toContain('FAMILY_PROJECTS');

    for (const idea of SEED_IDEAS) {
      expect(idea.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(idea.name.length).toBeGreaterThan(5);
      expect(idea.description && idea.description.length).toBeGreaterThan(10);
      expect(idea.ageMin).toBeDefined();
      expect(idea.ageMax).toBeDefined();
      expect(idea.estimatedDurationMinutes).toBeGreaterThan(0);
      expect(idea.metadata.isSeed).toBe(true);
      expect(Array.isArray(idea.metadata.materials)).toBe(true);
    }
  });
});
