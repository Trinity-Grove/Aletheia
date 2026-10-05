import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';
import { RecordCard } from '../src/components/records/record-card';
import { RecordsJournalView } from '../src/components/records/records-journal-view';
import { CompetencyTrackingPanel } from '../src/components/records/competency-tracking-panel';
import { EvidenceSubmissionModal } from '../src/components/records/evidence-submission-modal';
import { PortfolioGalleryView } from '../src/components/records/portfolio-gallery-view';
import { PortfolioItemModal } from '../src/components/records/portfolio-item-modal';
import { RecordFormModal } from '../src/components/records/record-form-modal';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import type {
  LearningRecordResponseDto,
  LearnerSummaryDto,
  SubjectResponseDto,
} from '@aletheia/contracts';

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async () => {
    return {
      ok: true,
      json: async () => [],
    } as any;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

function Probe({ translationKey, vars }: { translationKey: string; vars?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey, vars)}</span>;
}

const mockLearners: LearnerSummaryDto[] = [
  {
    id: 'learner-1',
    firstName: 'Sofia',
    preferredName: 'Sofi',
    stage: 'PRIMARY',
    avatarColor: '#3B82F6',
  },
];

const mockSubjects: SubjectResponseDto[] = [
  {
    id: 'subj-1',
    familyId: 'fam-1',
    name: 'História',
    color: '#4f46e5',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockRecord: LearningRecordResponseDto = {
  id: 'rec-1',
  familyId: 'fam-1',
  learnerId: 'learner-1',
  learnerName: 'Sofia',
  subjectId: 'subj-1',
  subjectName: 'História',
  subjectColor: '#4f46e5',
  type: 'PLANNED_LESSON',
  title: 'Civilizações Antigas',
  description: 'Estudo do Egito Antigo e Mesopotâmia.',
  date: '2026-09-15',
  durationMinutes: 45,
  masteryLevel: 'DEVELOPING',
  assessmentMethod: 'OBSERVATION',
  strengths: 'Boa retenção de detalhes históricos.',
  areasForGrowth: 'Melhorar síntese cronológica.',
  characterHabitGrowth: 'Demonstrou paciência e diligência.',
  notes: 'Ótima participação.',
  objectives: [],
  portfolioItemIds: [],
  createdAt: '2026-09-15T10:00:00.000Z',
  updatedAt: '2026-09-15T10:00:00.000Z',
};

describe('Wave 1: Attendance and Records i18n', () => {
  describe('Paridade e Estrutura dos Dicionários (attendance & records)', () => {
    it('possui o namespace attendance registrado em ptBR, enUS e esES', () => {
      expect((ptBR as any).attendance).toBeDefined();
      expect((enUS as any).attendance).toBeDefined();
      expect((esES as any).attendance).toBeDefined();

      expect((ptBR as any).attendance.page.title).toBe('Controle de Frequência & Conformidade Legal');
      expect((enUS as any).attendance.page.title).toBe('Attendance & Legal Compliance Tracking');
      expect((esES as any).attendance.page.title).toBe('Control de Asistencia y Conformidad Legal');
    });

    it('possui o namespace records registrado em ptBR, enUS e esES', () => {
      expect((ptBR as any).records).toBeDefined();
      expect((enUS as any).records).toBeDefined();
      expect((esES as any).records).toBeDefined();

      expect((ptBR as any).records.page.title).toBe('Diário de Aprendizagem & Domínio');
      expect((enUS as any).records.page.title).toBe('Learning Journal & Mastery');
      expect((esES as any).records.page.title).toBe('Diario de Aprendizaje y Dominio');
    });

    it('traduz chaves de attendance e records via useLocale() em múltiplos idiomas', () => {
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="records.tabs.journal" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Diário');
      unmount();

      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="records.tabs.journal" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Journal');
      unmountEn();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="records.tabs.journal" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Diario');
    });
  });

  describe('Componentes do Módulo de Registros Localizados', () => {
    it('renderiza RecordCard com badges e textos traduzidos em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <RecordCard record={mockRecord} />
        </LocaleProvider>
      );

      // Mastery Developing -> Developing
      expect(screen.getByTestId(`mastery-badge-${mockRecord.id}`)).toHaveTextContent('Developing');
      // Assessment method
      expect(screen.getByTestId(`assessment-method-badge-${mockRecord.id}`)).toHaveTextContent('Assessment: Direct Observation');
      // Strengths & Growth headers
      expect(screen.getByTestId(`record-strengths-${mockRecord.id}`)).toHaveTextContent('Strengths:');
      expect(screen.getByTestId(`record-growth-${mockRecord.id}`)).toHaveTextContent('Areas for Growth:');
      // Character growth
      expect(screen.getByTestId(`character-habit-growth-${mockRecord.id}`)).toHaveTextContent('Character & Habit Growth:');
    });

    it('renderiza RecordCard com badges e textos traduzidos em es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <RecordCard record={mockRecord} />
        </LocaleProvider>
      );

      // Mastery Developing -> En Desarrollo
      expect(screen.getByTestId(`mastery-badge-${mockRecord.id}`)).toHaveTextContent('En Desarrollo');
      // Assessment method
      expect(screen.getByTestId(`assessment-method-badge-${mockRecord.id}`)).toHaveTextContent('Evaluación: Observación Directa');
      // Strengths & Growth headers
      expect(screen.getByTestId(`record-strengths-${mockRecord.id}`)).toHaveTextContent('Puntos Fuertes:');
      expect(screen.getByTestId(`record-growth-${mockRecord.id}`)).toHaveTextContent('Áreas de Crecimiento:');
      // Character growth
      expect(screen.getByTestId(`character-habit-growth-${mockRecord.id}`)).toHaveTextContent('Crecimiento en Carácter y Hábitos:');
    });

    it('renderiza RecordsJournalView traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <RecordsJournalView
              records={[mockRecord]}
              learners={mockLearners}
              subjects={mockSubjects}
              activeLearnerId="learner-1"
              onOpenCreateRecord={vi.fn()}
              onEditRecord={vi.fn()}
              onDeleteRecord={vi.fn()}
              onAddEvidence={vi.fn()}
            />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId('metric-total-records')).toHaveTextContent('Total Records');
      expect(screen.getByTestId('metric-total-hours')).toHaveTextContent('Learning Time');
      expect(screen.getByTestId('metric-mastered-autonomous')).toHaveTextContent('Mastery & Autonomy');
      expect(screen.getByTestId('open-create-record-btn')).toHaveTextContent('+ New Record');
      expect(screen.getByTestId('search-records-input')).toHaveAttribute('placeholder', 'Search records...');
    });

    it('renderiza CompetencyTrackingPanel traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <CompetencyTrackingPanel familyId="fam-1" learnerId={null} />
        </LocaleProvider>
      );

      expect(screen.getByText('Select a learner')).toBeInTheDocument();
      expect(screen.getByText('Choose a learner to activate curricula and track competencies.')).toBeInTheDocument();
    });

    it('renderiza EvidenceSubmissionModal traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <EvidenceSubmissionModal
            isOpen={true}
            onClose={vi.fn()}
            onSave={vi.fn()}
            evidenceTypeCatalog={[]}
            trackedCompetencies={[]}
          />
        </LocaleProvider>
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Submit Evidence');
      expect(screen.getByTestId('cancel-evidence-submission-btn')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('save-evidence-submission-btn')).toHaveTextContent('Submit Evidence');
    });

    it('renderiza PortfolioItemModal traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <PortfolioItemModal
            isOpen={true}
            onClose={vi.fn()}
            onSave={vi.fn()}
            learners={mockLearners}
            subjects={mockSubjects}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('Add Evidence to Portfolio')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-portfolio-btn')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('save-portfolio-btn')).toHaveTextContent('Save to Portfolio');
    });

    it('renderiza RecordFormModal traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <RecordFormModal
            isOpen={true}
            onClose={vi.fn()}
            onSave={vi.fn()}
            learners={mockLearners}
            subjects={mockSubjects}
            objectives={[]}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('New Learning Record')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-record-btn')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('save-record-btn')).toHaveTextContent('Save Record');
    });

    it('renderiza PortfolioGalleryView traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <PortfolioGalleryView
              items={[]}
              learners={mockLearners}
              subjects={mockSubjects}
              activeLearnerId={null}
              onOpenAddItem={vi.fn()}
              onEditItem={vi.fn()}
              onDeleteItem={vi.fn()}
            />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Living Portfolio & Evidence Gallery')).toBeInTheDocument();
      expect(screen.getByTestId('open-add-portfolio-btn')).toHaveTextContent('+ Add Evidence');
      expect(screen.getByTestId('search-portfolio-input')).toHaveAttribute('placeholder', 'Search portfolio...');
    });
  });
});
