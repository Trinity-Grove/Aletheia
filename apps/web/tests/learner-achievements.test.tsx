import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { LearnerAchievementsModal } from '../src/components/learners/learner-achievements-modal';

const mockAchievements = [
  {
    id: 'ach-1',
    familyId: 'fam-1',
    learnerId: 'l-1',
    trackingId: 'track-1',
    competencyDefinitionId: 'comp-1',
    competencyCode: 'MATH_FRACTIONS_MASTERY',
    competencyVersion: 1,
    evidenceSnapshot: {
      competencyTitle: 'Domínio de Frações e Proporções',
      domainName: 'Matemática & Raciocínio Lógico',
      approvedEvidenceCount: 3,
    },
    achievedAt: '2026-09-16T14:30:00.000Z',
    createdAt: '2026-09-16T14:30:00.000Z',
    reviews: [],
  },
  {
    id: 'ach-2',
    familyId: 'fam-1',
    learnerId: 'l-1',
    trackingId: 'track-2',
    competencyDefinitionId: 'comp-2',
    competencyCode: 'BIBLICAL_NARRATIVE_RETELLING',
    competencyVersion: 1,
    evidenceSnapshot: {
      competencyTitle: 'Narração de Histórias Bíblicas do Antigo Testamento',
      domainName: 'Formação Cristã & História da Redenção',
      approvedEvidenceCount: 5,
    },
    achievedAt: '2026-09-15T10:00:00.000Z',
    createdAt: '2026-09-15T10:00:00.000Z',
    reviews: [],
  },
];

describe('LearnerAchievementsModal (Task 11: Achievement Badges Wall)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders learner achievements modal and loads unlocked badges', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockAchievements,
    } as Response);

    render(
      <LearnerAchievementsModal
        isOpen={true}
        onClose={vi.fn()}
        familyId="fam-1"
        learnerId="l-1"
        learnerName="Clarinha"
      />
    );

    expect(screen.getByTestId('learner-achievements-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Domínio de Frações e Proporções')).toBeInTheDocument();
      expect(screen.getByText('Narração de Histórias Bíblicas do Antigo Testamento')).toBeInTheDocument();
    });

    expect(screen.getByText(/Matemática & Raciocínio Lógico/i)).toBeInTheDocument();
    expect(screen.getByText(/Formação Cristã & História da Redenção/i)).toBeInTheDocument();
  });

  it('renders friendly empty state when learner has no achievements yet', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(
      <LearnerAchievementsModal
        isOpen={true}
        onClose={vi.fn()}
        familyId="fam-1"
        learnerId="l-1"
        learnerName="Clarinha"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('achievements-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Nenhuma conquista ou medalha desbloqueada ainda/i)).toBeInTheDocument();
    });
  });
});
