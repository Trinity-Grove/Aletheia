import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AcademicYearResponseDto,
  LearnerPlanResponseDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  PedagogicalModelCatalogEntryDto,
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
  stage: 'PRIMARY',
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

const mockCatalog: PedagogicalModelCatalogEntryDto[] = [
  {
    code: 'CLASSICAL_TRIVIUM',
    name: 'Educação Clássica (Trívio)',
    description: 'Foco na fase gramatical: Português, Latim, Aritmética Lógica.',
  },
  { code: 'CHARLOTTE_MASON', name: 'Abordagem Charlotte Mason', description: 'Livros Vivos e Estudo da Natureza.' },
  { code: 'UNIT_STUDIES', name: 'Unit Studies (Estudo por Temas)', description: 'Um tema central interdisciplinar.' },
  { code: 'MONTESSORI', name: 'Montessori', description: 'Vida Prática e materiais manipuláveis.' },
  { code: 'PROJECT_BASED', name: 'Aprendizagem por Projetos', description: 'Um projeto real conduz o aprendizado.' },
  { code: 'GUIDED_UNSCHOOLING', name: 'Unschooling Guiado', description: 'Interesses do aluno conduzem o aprendizado.' },
  { code: 'ECLECTIC', name: 'Eclético', description: 'Combina métodos livremente.' },
  {
    code: 'COMMUNITY.APICULTURE_TRACK',
    name: 'Trilha de Apicultura (Catálogo)',
    description: 'Modelo publicado apenas no catálogo -- nunca existiu no enum legado.',
  },
];

function stubCatalogFetch(catalog: PedagogicalModelCatalogEntryDto[] = mockCatalog) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => catalog,
    }),
  );
}

describe('Curriculum Web Components', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('CurriculumView', () => {
    it('renders header, pedagogical framework badge and subjects grid with RBAC permissions', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <CurriculumView
            familyId="fam-1"
            years={[mockYear]}
            activeYearId={mockYear.id}
            onSelectYear={vi.fn()}
            subjects={[mockSubject]}
            objectives={mockObjectives}
            activeLearner={mockLearner}
            learnerPlan={mockPlan}
            onApplyTemplate={vi.fn()}
            onCreateSubject={vi.fn()}
            onUpdateSubject={vi.fn()}
            onArchiveSubject={vi.fn()}
            onCreateObjective={vi.fn()}
            onUpdateObjective={vi.fn()}
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
            familyId="fam-1"
            years={[mockYear]}
            activeYearId={mockYear.id}
            onSelectYear={vi.fn()}
            subjects={[]}
            objectives={[]}
            activeLearner={mockLearner}
            learnerPlan={null}
            onApplyTemplate={vi.fn()}
            onCreateSubject={vi.fn()}
            onUpdateSubject={vi.fn()}
            onArchiveSubject={vi.fn()}
            onCreateObjective={vi.fn()}
            onUpdateObjective={vi.fn()}
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
            onEditSubject={vi.fn()}
            onArchiveSubject={vi.fn()}
            onToggleStatus={toggleMock}
            onEditObjective={vi.fn()}
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
    it('shows a loading state while the catalog is being fetched', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={vi.fn()} onApply={vi.fn()} />);

      expect(screen.getByText(/carregando modelos/i)).toBeInTheDocument();
    });

    it('fetches the published catalog and renders it instead of a hardcoded list', async () => {
      stubCatalogFetch();

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={vi.fn()} onApply={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('template-option-CHARLOTTE_MASON')).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/curriculum/templates/catalog',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('allows selecting and applying a pedagogical model from the catalog', async () => {
      stubCatalogFetch();
      const applyMock = vi.fn().mockResolvedValue(undefined);
      const closeMock = vi.fn();

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={closeMock} onApply={applyMock} />);

      const charlotteOption = await screen.findByTestId('template-option-CHARLOTTE_MASON');
      fireEvent.click(charlotteOption);

      const submitBtn = screen.getByTestId('apply-template-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => expect(applyMock).toHaveBeenCalledWith('CHARLOTTE_MASON'));
    });

    it('renders every catalog entry, including the legacy 8 frameworks', async () => {
      stubCatalogFetch();

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={vi.fn()} onApply={vi.fn()} />);

      await screen.findByTestId('template-option-CHARLOTTE_MASON');
      expect(screen.getByTestId('template-option-UNIT_STUDIES')).toBeInTheDocument();
      expect(screen.getByTestId('template-option-MONTESSORI')).toBeInTheDocument();
      expect(screen.getByTestId('template-option-PROJECT_BASED')).toBeInTheDocument();
      expect(screen.getByTestId('template-option-GUIDED_UNSCHOOLING')).toBeInTheDocument();
      expect(screen.getByTestId('template-option-ECLECTIC')).toBeInTheDocument();
    });

    it('renders and allows applying a model that only exists in the catalog (never in the legacy enum)', async () => {
      stubCatalogFetch();
      const applyMock = vi.fn().mockResolvedValue(undefined);

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={vi.fn()} onApply={applyMock} />);

      const catalogOnlyOption = await screen.findByTestId('template-option-COMMUNITY.APICULTURE_TRACK');
      expect(catalogOnlyOption).toBeInTheDocument();
      expect(screen.getByText('Trilha de Apicultura (Catálogo)')).toBeInTheDocument();

      fireEvent.click(catalogOnlyOption);
      fireEvent.click(screen.getByTestId('apply-template-btn'));

      await waitFor(() => expect(applyMock).toHaveBeenCalledWith('COMMUNITY.APICULTURE_TRACK'));
    });

    it('renders an empty state when no models are published', async () => {
      stubCatalogFetch([]);

      render(<TemplateModal isOpen={true} familyId="fam-1" onClose={vi.fn()} onApply={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/nenhum modelo pedagógico publicado/i)).toBeInTheDocument();
      });
    });
  });
});

