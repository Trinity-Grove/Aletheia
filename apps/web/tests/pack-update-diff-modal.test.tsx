import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackUpdateDiffModal } from '../src/components/curriculum/pack-update-diff-modal';
import type { PackDiffReport } from '@aletheia/contracts';

const mockDiffReport: PackDiffReport = {
  hasUpdate: true,
  currentVersion: 1,
  latestVersion: 2,
  sourcePackCode: 'TRIVIUM',
  items: [
    {
      definitionType: 'SkillDefinition',
      code: 'LOGIC.SYLLOGISM',
      name: 'Silogismos Categóricos',
      action: 'ADDED_BY_AUTHOR',
      description: 'Nova habilidade incluída pelo autor.',
    },
    {
      definitionType: 'CompetencyDefinition',
      code: 'GRAMMAR.PARSING',
      name: 'Análise Morfossintática',
      action: 'PRESERVED_FAMILY_EDIT',
      description: 'Modificações da família mantidas.',
    },
    {
      definitionType: 'CompetencyDefinition',
      code: 'RHETORIC.ORATORY',
      name: 'Discurso Clássico',
      action: 'CONFLICT_PRESERVED_FAMILY',
      description: 'Conflito resolvido em favor da família.',
    },
  ],
  summary: {
    addedCount: 1,
    updatedCount: 0,
    preservedFamilyEditsCount: 1,
    conflictsCount: 1,
  },
};

describe('PackUpdateDiffModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders diff report summary and items with badges', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();

    render(
      <PackUpdateDiffModal
        isOpen={true}
        packName="Trivium Clássico"
        diffReport={mockDiffReport}
        onClose={onClose}
        onApplyUpdate={onApply}
        isApplying={false}
      />,
    );

    expect(screen.getByText(/Atualização Segura de Pacote/i)).toBeInTheDocument();
    expect(screen.getByText('Silogismos Categóricos')).toBeInTheDocument();
    expect(screen.getByText('Análise Morfossintática')).toBeInTheDocument();
    expect(screen.getByText(/Novidades do Autor/i)).toBeInTheDocument();
    expect(screen.getByText(/Adaptações da Família Preservadas/i)).toBeInTheDocument();
  });

  it('triggers onApplyUpdate callback when user confirms merge', async () => {
    const onClose = vi.fn();
    const onApply = vi.fn();

    render(
      <PackUpdateDiffModal
        isOpen={true}
        packName="Trivium Clássico"
        diffReport={mockDiffReport}
        onClose={onClose}
        onApplyUpdate={onApply}
        isApplying={false}
      />,
    );

    const applyBtn = screen.getByRole('button', { name: /Aplicar Atualização com Segurança/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
  });
});
