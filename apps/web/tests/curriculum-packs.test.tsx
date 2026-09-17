import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumPacksGallery } from '../src/components/curriculum/curriculum-packs-gallery';

const mockPublishedPacks = [
  {
    id: 'pack-1',
    code: 'CLASSICAL_TRIVIUM',
    name: 'Trivium Clássico & Artes Liberais',
    description: 'Gramática, Lógica e Retórica integrados à formação cristã com estudos clássicos.',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    metadata: {
      category: 'Metodologia Clássica',
      targetStages: ['GRAMMAR', 'LOGIC'],
      estimatedLessons: 48,
    },
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'pack-2',
    code: 'FAMILY_FINANCE_STEWARDSHIP',
    name: 'Educação Financeira & Mordomia Bíblica',
    description: 'Princípios bíblicos de finanças, orçamento doméstico, poupança e generosidade para jovens.',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    metadata: {
      category: 'Ofícios & Prática',
      targetStages: ['RHETORIC'],
      estimatedLessons: 24,
    },
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: '2026-09-12T00:00:00.000Z',
  },
];

const mockInstalledPacks = [
  {
    id: 'inst-1',
    familyId: 'fam-1',
    sourcePackId: 'pack-1',
    sourcePackCode: 'CLASSICAL_TRIVIUM',
    sourcePackVersion: 1,
    revision: 1,
    document: {
      pack: { code: 'CLASSICAL_TRIVIUM', name: 'Trivium Clássico & Artes Liberais', version: 1 },
      items: [],
    },
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
];

describe('CurriculumPacksGallery (Task 7 & 8: Plugins / Pacotes Curriculares)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders available curriculum packs gallery with installed status', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishedPacks,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInstalledPacks,
      } as Response);

    render(<CurriculumPacksGallery familyId="fam-1" />);

    expect(screen.getByTestId('curriculum-packs-gallery')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Trivium Clássico & Artes Liberais')).toBeInTheDocument();
      expect(screen.getByText('Educação Financeira & Mordomia Bíblica')).toBeInTheDocument();
    });

    // Verify correct family-scoped available endpoint was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/families/fam-1/curriculum-packs/available',
      expect.objectContaining({ credentials: 'include' })
    );

    // pack-1 is already installed
    expect(screen.getByTestId('installed-badge-pack-1')).toBeInTheDocument();

    // pack-2 is available for install
    expect(screen.getByTestId('install-pack-btn-pack-2')).toBeInTheDocument();
  });

  it('allows guardian to install an available curriculum pack into family', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishedPacks,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'inst-2',
          familyId: 'fam-1',
          sourcePackId: 'pack-2',
          sourcePackCode: 'FAMILY_FINANCE_STEWARDSHIP',
          sourcePackVersion: 1,
          revision: 1,
          document: {
            pack: { code: 'FAMILY_FINANCE_STEWARDSHIP', name: 'Educação Financeira & Mordomia Bíblica', version: 1 },
            items: [],
          },
          createdAt: '2026-09-17T00:00:00.000Z',
          updatedAt: '2026-09-17T00:00:00.000Z',
        }),
      } as Response);

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('install-pack-btn-pack-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-pack-btn-pack-2'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/curriculum-packs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sourcePackId: 'pack-2' }),
        })
      );
      expect(screen.getByTestId('installed-badge-pack-2')).toBeInTheDocument();
    });
  });
});
