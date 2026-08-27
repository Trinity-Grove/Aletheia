import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type {
  AcademicYearResponseDto,
  LearnerPlanResponseDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { CurriculumView } from '../src/components/curriculum/curriculum-view';
import { TemplateModal } from '../src/components/curriculum/template-modal';
import { SubjectCard } from '../src/components/curriculum/subject-card';

const mockYear: AcademicYearResponseDto = {
  id: 'year-2026',
  familyId: 'fam-1',
  year: 2026,
  title: 'Ano Letivo 2026',
  isCurrent: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockLearner: LearnerSummaryDto = {
  id: '00000000-0000-0000-0000-000000000001',
  firstName: 'Samuel',
  lastName: 'Silva',
  preferredName: 'Samuca',
  stage: 'PRIMARY_GRAMMAR',
  avatarColor: '#3B82F6',
};

const mockPlan: LearnerPlanResponseDto = {
  id: 'plan-1',
  familyId: 'fam-1',
  learnerId: 'learner-1',
  academicYearId: 'year-2026',
  pedagogicalFramework: 'CLASSICAL_TRIVIUM',
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockSubject: SubjectResponseDto = {
  id: 'sub-1',
  familyId: 'fam-1',
  name: 'Latim & Línguas Clássicas',
  color: '#7C3AED',
  icon: 'scroll',
  description: 'Vocabulário latino e raízes',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockObjectives: ObjectiveResponseDto[] = [
  {
    id: 'obj-1',
    familyId: 'fam-1',
    learnerId: 'learner-1',
    subjectId: 'sub-1',
    academicYearId: 'year-2026',
    title: 'Memorizar 1ª declinação latina',
    description: null,
    status: 'ACHIEVED',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'obj-2',
    familyId: 'fam-1',
    learnerId: 'learner-1',
    subjectId: 'sub-1',
    academicYearId: 'year-2026',
    title: 'Aprender 50 palavras raízes latinas',
    description: null,
    status: 'IN_PROGRESS',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('Curriculum Web Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('CurriculumView', () => {
    it('renders header, pedagogical framework badge and subjects grid with RBAC permissions', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <CurriculumView
            years={[mockYear]}
            activeYearId={mockYear.id}
            onSelectYear={vi.fn()}
            subjects={[mockSubject]}
            objectives={mockObjectives}
            activeLearner={mockLearner}
            learnerPlan={mockPlan}
            onApplyTemplate={vi.fn()}
            onCreateSubject={vi.fn()}
            onCreateObjective={vi.fn()}
            onToggleObjectiveStatus={vi.fn()}
            onDeleteObjective={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Currículo de Samuca')).toBeDefined();
      expect(screen.getByTestId('pedagogical-framework-badge').textContent).toContain('Clássica (Trívio)');
      expect(screen.getByTestId('overall-progress-text').textContent).toContain('1 de 2 objetivos concluídos (50%)');
      expect(screen.getByTestId(`subject-card-${mockSubject.id}`)).toBeDefined();
      expect(screen.getByTestId('open-template-modal-btn')).toBeDefined();
      expect(screen.getByTestId('open-subject-modal-btn')).toBeDefined();
    });

    it('renders empty state when no subjects exist', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <CurriculumView
            years={[mockYear]}
            activeYearId={mockYear.id}
            onSelectYear={vi.fn()}
            subjects={[]}
            objectives={[]}
            activeLearner={mockLearner}
            learnerPlan={null}
            onApplyTemplate={vi.fn()}
            onCreateSubject={vi.fn()}
            onCreateObjective={vi.fn()}
            onToggleObjectiveStatus={vi.fn()}
            onDeleteObjective={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByTestId('curriculum-empty-state')).toBeDefined();
    });
  });

  describe('SubjectCard', () => {
    it('calculates progress percentage, mastery dots, and toggles objective status', () => {
      const toggleMock = vi.fn();
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <SubjectCard
            subject={mockSubject}
            objectives={mockObjectives}
            onAddObjective={vi.fn()}
            onToggleStatus={toggleMock}
            onDeleteObjective={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Latim & Línguas Clássicas')).toBeDefined();
      expect(screen.getByText('1/2 (50%)')).toBeDefined();

      const toggleBtn = screen.getByTestId('status-toggle-btn-obj-2');
      fireEvent.click(toggleBtn);
      expect(toggleMock).toHaveBeenCalledWith('obj-2', 'ACHIEVED');
    });
  });

  describe('TemplateModal', () => {
    it('allows selecting and applying a pedagogical framework', async () => {
      const applyMock = vi.fn().mockResolvedValue(undefined);
      const closeMock = vi.fn();

      render(
        <TemplateModal
          isOpen={true}
          onClose={closeMock}
          onApply={applyMock}
        />
      );

      const charlotteOption = screen.getByTestId('template-option-CHARLOTTE_MASON');
      fireEvent.click(charlotteOption);

      const submitBtn = screen.getByTestId('apply-template-btn');
      fireEvent.click(submitBtn);

      expect(applyMock).toHaveBeenCalledWith('CHARLOTTE_MASON');
    });
  });
});

