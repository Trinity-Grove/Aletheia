import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { LearnerCard } from '../src/components/learners/learner-card';
import { LearnerFormModal } from '../src/components/learners/learner-form-modal';
import { LearnersList } from '../src/components/learners/learners-list';
import LearnersPage from '../app/(dashboard)/learners/page';

const mockLearner: LearnerResponseDto = {
  id: 'a0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  firstName: 'Clara',
  lastName: 'Silva',
  preferredName: 'Clarinha',
  birthDate: '2016-05-12',
  stage: 'PRIMARY_GRAMMAR',
  customGrade: '3º Ano',
  avatarColor: '#3B82F6',
  specialNeeds: 'Dislexia leve',
  notes: 'Gosta muito de leitura em voz alta.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
};

const mockArchivedLearner: LearnerResponseDto = {
  ...mockLearner,
  id: 'a0000000-0000-0000-0000-000000000002',
  firstName: 'Pedro',
  preferredName: null,
  archivedAt: '2026-02-01T00:00:00.000Z',
};

describe('Learner Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('LearnerCard', () => {
    it('renders active learner details properly', () => {
      const onEdit = vi.fn();
      const onToggleArchive = vi.fn();

      render(
        <LearnerCard
          learner={mockLearner}
          onEdit={onEdit}
          onToggleArchive={onToggleArchive}
        />
      );

      expect(screen.getByText('Clarinha')).toBeInTheDocument();
      expect(screen.getByText(/3º Ano/i)).toBeInTheDocument();
      expect(screen.getByText(/Grammar/i)).toBeInTheDocument();
      expect(screen.getByText(/Dislexia leve/i)).toBeInTheDocument();
      expect(screen.getByText(/Gosta muito de leitura/i)).toBeInTheDocument();

      const editBtn = screen.getByRole('button', { name: /editar/i });
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockLearner);

      const archiveBtn = screen.getByRole('button', { name: /arquivar/i });
      fireEvent.click(archiveBtn);
      expect(onToggleArchive).toHaveBeenCalledWith(mockLearner);
    });

    it('renders archived learner with reativar button', () => {
      const onEdit = vi.fn();
      const onToggleArchive = vi.fn();

      render(
        <LearnerCard
          learner={mockArchivedLearner}
          onEdit={onEdit}
          onToggleArchive={onToggleArchive}
        />
      );

      expect(screen.getByText('Pedro')).toBeInTheDocument();
      const reactivateBtn = screen.getByRole('button', { name: /reativar/i });
      fireEvent.click(reactivateBtn);
      expect(onToggleArchive).toHaveBeenCalledWith(mockArchivedLearner);
    });
  });

  describe('LearnerFormModal', () => {
    it('handles create learner form submission', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <LearnerFormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('learner-first-name-input'), {
        target: { value: 'Lucas' },
      });
      fireEvent.change(screen.getByTestId('learner-birth-date-input'), {
        target: { value: '2018-09-20' },
      });

      const submitBtn = screen.getByTestId('learner-submit-btn');
      fireEvent.click(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Lucas',
          birthDate: '2018-09-20',
          stage: 'PRIMARY_GRAMMAR',
        })
      );
    });

    it('pre-fills existing learner data for editing', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <LearnerFormModal
          isOpen={true}
          initialData={mockLearner}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      const nameInput = screen.getByTestId('learner-first-name-input') as HTMLInputElement;
      expect(nameInput.value).toBe('Clara');

      fireEvent.change(nameInput, { target: { value: 'Clara Maria' } });
      fireEvent.click(screen.getByTestId('learner-submit-btn'));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Clara Maria',
          preferredName: 'Clarinha',
        })
      );
    });
  });

  describe('LearnersList', () => {
    it('renders active and archived learners with toggle filter', () => {
      render(
        <LearnersList
          learners={[mockLearner, mockArchivedLearner]}
          onEdit={vi.fn()}
          onToggleArchive={vi.fn()}
        />
      );

      // By default shows active learners
      expect(screen.getByText('Clarinha')).toBeInTheDocument();
      expect(screen.queryByText('Pedro')).not.toBeInTheDocument();

      // Switch tab or filter to show archived
      const archivedTab = screen.getByRole('button', { name: /arquivados/i });
      fireEvent.click(archivedTab);

      expect(screen.getByText('Pedro')).toBeInTheDocument();
      expect(screen.queryByText('Clarinha')).not.toBeInTheDocument();
    });
  });

  describe('LearnersPage', () => {
    it('renders page layout with add button', () => {
      render(<LearnersPage initialLearners={[mockLearner]} />);

      expect(screen.getByTestId('add-learner-btn')).toBeInTheDocument();
      expect(screen.getByText('Clarinha')).toBeInTheDocument();

      // Clicking add button opens modal
      fireEvent.click(screen.getByTestId('add-learner-btn'));
      expect(screen.getByTestId('learner-first-name-input')).toBeInTheDocument();
    });
  });
});
