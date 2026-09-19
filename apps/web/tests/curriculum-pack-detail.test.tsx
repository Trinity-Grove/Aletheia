import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumPackDetailModal } from '../src/components/curriculum/curriculum-pack-detail-modal';
import { CurriculumPacksGallery } from '../src/components/curriculum/curriculum-packs-gallery';
import { TemplateModal } from '../src/components/curriculum/template-modal';
import type { CurriculumPackResponseDto, PedagogicalModelCatalogEntryDto } from '@aletheia/contracts';

const mockPack: CurriculumPackResponseDto = {
  id: 'pack-detailed-1',
  code: 'CHARLOTTE_MASON_EARLY',
  name: 'Fundamentos Charlotte Mason: Primeiros Anos',
  description:
    'Um currículo completo baseado em livros vivos, narração oral diária, estudos da natureza e formação de hábitos de atenção e obediência alegre.',
  version: 1,
  status: 'PUBLISHED',
  schemaVersion: '1.0.0',
  metadata: {
    category: 'Formação por Hábitos',
    targetStages: ['EARLY_YEARS', 'GRAMMAR'],
    estimatedLessons: 60,
    pillars: [
      'Narração Oral Imediata',
      'Caderno da Natureza Semanal',
      'Leitura de Livros Vivos (Living Books)',
      'Lições Curtas de Alta Concentração (15-20 min)',
    ],
  },
  manifest: {
    subjects: ['História Viva', 'Estudo da Natureza', 'Literatura & Poesia'],
    activitiesCount: 24,
    skillsCount: 12,
  },
  createdAt: '2026-09-18T00:00:00.000Z',
};

const mockCatalogWithSubjects: PedagogicalModelCatalogEntryDto[] = [
  {
    code: 'CHARLOTTE_MASON',
    name: 'Charlotte Mason',
    description: 'Educação baseada em hábitos, livros vivos e narração.',
    subjects: [
      {
        name: 'História Viva',
        color: '#D97706',
        description: 'Biografias e narrativas históricas.',
        starterObjectives: [
          'Narrar oralmente um episódio histórico ouvido em leitura em voz alta',
          'Identificar personagens e motivações éticas principais',
        ],
      },
      {
        name: 'Estudo da Natureza',
        color: '#059669',
        description: 'Observação científica ao ar livre.',
        starterObjectives: ['Manter registro desenhado semanal no caderno de campo'],
      },
    ],
  },
];

describe('CurriculumPackDetailModal & Template Preview Transparency', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('CurriculumPackDetailModal', () => {
    it('renders full pack details, pillars, estimated lessons, and target stages', () => {
      const handleClose = vi.fn();
      const handleInstall = vi.fn();

      render(
        <CurriculumPackDetailModal
          isOpen={true}
          pack={mockPack}
          isInstalled={false}
          onClose={handleClose}
          onInstall={handleInstall}
        />,
      );

      expect(screen.getByText('Fundamentos Charlotte Mason: Primeiros Anos')).toBeInTheDocument();
      expect(screen.getByText(/Um currículo completo baseado em livros vivos/i)).toBeInTheDocument();
      expect(screen.getByText('Formação por Hábitos')).toBeInTheDocument();
      expect(screen.getByText(/60 lições estimadas/i)).toBeInTheDocument();

      // Check pillars
      expect(screen.getByText('Narração Oral Imediata')).toBeInTheDocument();
      expect(screen.getByText('Caderno da Natureza Semanal')).toBeInTheDocument();
      expect(screen.getByText(/Lições Curtas de Alta Concentração/i)).toBeInTheDocument();

      // Check manifest contents
      expect(screen.getByText('História Viva')).toBeInTheDocument();
      expect(screen.getByText('Estudo da Natureza')).toBeInTheDocument();

      // Install button works
      const installBtn = screen.getByTestId('detail-install-pack-btn');
      expect(installBtn).toBeInTheDocument();
      fireEvent.click(installBtn);
      expect(handleInstall).toHaveBeenCalledWith(mockPack);
    });

    it('displays already-installed indicator when isInstalled is true', () => {
      render(
        <CurriculumPackDetailModal
          isOpen={true}
          pack={mockPack}
          isInstalled={true}
          onClose={vi.fn()}
          onInstall={vi.fn()}
        />,
      );

      expect(screen.getByText(/Pacote já instalado nesta família/i)).toBeInTheDocument();
      expect(screen.queryByTestId('detail-install-pack-btn')).not.toBeInTheDocument();
    });
  });

  describe('CurriculumPacksGallery integration', () => {
    it('opens detail modal when clicking "Conhecer Pacote 🔍"', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockPack],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

      render(<CurriculumPacksGallery familyId="fam-1" />);

      await waitFor(() => {
        expect(screen.getByText('Fundamentos Charlotte Mason: Primeiros Anos')).toBeInTheDocument();
      });

      const detailBtn = screen.getByTestId(`view-pack-detail-btn-${mockPack.id}`);
      expect(detailBtn).toBeInTheDocument();
      fireEvent.click(detailBtn);

      await waitFor(() => {
        expect(screen.getByTestId('curriculum-pack-detail-modal')).toBeInTheDocument();
      });
    });
  });

  describe('TemplateModal expandable subjects preview', () => {
    it('renders expandable preview of subjects and starter objectives', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalogWithSubjects,
      } as Response);

      render(
        <TemplateModal
          isOpen={true}
          familyId="fam-1"
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Charlotte Mason')).toBeInTheDocument();
      });

      // Expandable preview button exists
      const toggleBtn = screen.getByTestId('toggle-subjects-preview-CHARLOTTE_MASON');
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);

      // Subjects and starter objectives become visible
      await waitFor(() => {
        expect(screen.getByText('História Viva')).toBeInTheDocument();
        expect(
          screen.getByText(/Narrar oralmente um episódio histórico ouvido em leitura em voz alta/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Manter registro desenhado semanal no caderno de campo/i),
        ).toBeInTheDocument();
      });
    });
  });
});
