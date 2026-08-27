import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { AuthProvider } from '../src/lib/auth/rbac-context';
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
    it('renders active learner details, avatar, stage chip, and age pill properly for Guardian', () => {
      const onEdit = vi.fn();
      const onToggleArchive = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LearnerCard
            learner={mockLearner}
            onEdit={onEdit}
            onToggleArchive={onToggleArchive}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Clarinha')).toBeInTheDocument();
      expect(screen.getByText(/3º Ano/i)).toBeInTheDocument();
      expect(screen.getByText(/Grammar/i)).toBeInTheDocument();
      expect(screen.getByText(/Dislexia leve/i)).toBeInTheDocument();
      expect(screen.getByText(/Gosta muito de leitura/i)).toBeInTheDocument();
      expect(screen.getByTestId('learner-avatar')).toHaveTextContent('C');
      expect(screen.getByTestId('learner-stage-chip')).toBeInTheDocument();
      expect(screen.getByTestId('learner-age-pill')).toBeInTheDocument();

      const editBtn = screen.getByRole('button', { name: /editar/i });
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockLearner);

      const archiveBtn = screen.getByRole('button', { name: /arquivar/i });
      fireEvent.click(archiveBtn);
      expect(onToggleArchive).toHaveBeenCalledWith(mockLearner);
    });

    it('renders archived learner with reativar button for Guardian', () => {
      const onEdit = vi.fn();
      const onToggleArchive = vi.fn();

      render(
        <AuthProvider initialRole="GUARDIAN">
          <LearnerCard
            learner={mockArchivedLearner}
            onEdit={onEdit}
            onToggleArchive={onToggleArchive}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Pedro')).toBeInTheDocument();
      const reactivateBtn = screen.getByRole('button', { name: /reativar/i });
      fireEvent.click(reactivateBtn);
      expect(onToggleArchive).toHaveBeenCalledWith(mockArchivedLearner);
    });

    it('hides edit and archive buttons for EDUCATOR role (RBAC Gated)', () => {
      render(
        <AuthProvider initialRole="EDUCATOR">
          <LearnerCard
            learner={mockLearner}
            onEdit={vi.fn()}
            onToggleArchive={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Clarinha')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /arquivar/i })).not.toBeInTheDocument();
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
    it('renders active and archived learners with modern tab switcher and count badges', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LearnersList
            learners={[mockLearner, mockArchivedLearner]}
            onEdit={vi.fn()}
            onToggleArchive={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByTestId('active-learners-count-badge')).toHaveTextContent('1');
      expect(screen.getByTestId('archived-learners-count-badge')).toHaveTextContent('1');

      // By default shows active learners
      expect(screen.getByText('Clarinha')).toBeInTheDocument();
      expect(screen.queryByText('Pedro')).not.toBeInTheDocument();

      // Switch tab to show archived
      const archivedTab = screen.getByRole('button', { name: /arquivados/i });
      fireEvent.click(archivedTab);

      expect(screen.getByText('Pedro')).toBeInTheDocument();
      expect(screen.queryByText('Clarinha')).not.toBeInTheDocument();
    });

    it('renders empty state illustration when list is empty', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LearnersList
            learners={[]}
            onEdit={vi.fn()}
            onToggleArchive={vi.fn()}
            onAddLearner={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByTestId('learners-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Nenhum educando ativo cadastrado/i)).toBeInTheDocument();
      expect(screen.getByTestId('add-learner-empty-btn')).toBeInTheDocument();
    });
  });

  describe('LearnersPage', () => {
    it('renders page layout with add button for OWNER_GUARDIAN', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LearnersPage initialLearners={[mockLearner]} />
        </AuthProvider>
      );

      expect(screen.getByTestId('add-learner-btn')).toBeInTheDocument();
      expect(screen.getByText('Clarinha')).toBeInTheDocument();

      // Clicking add button opens modal
      fireEvent.click(screen.getByTestId('add-learner-btn'));
      expect(screen.getByTestId('learner-first-name-input')).toBeInTheDocument();
    });

    it('hides add-learner-btn for EDUCATOR role (RBAC Gated)', () => {
      render(
        <AuthProvider initialRole="EDUCATOR">
          <LearnersPage initialLearners={[mockLearner]} />
        </AuthProvider>
      );

      expect(screen.queryByTestId('add-learner-btn')).not.toBeInTheDocument();
      expect(screen.getByText('Clarinha')).toBeInTheDocument();
    });
  });
});

