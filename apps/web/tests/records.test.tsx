import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type {
  LearnerProgressSummaryDto,
  LearnerSummaryDto,
  LearningRecordResponseDto,
  ObjectiveResponseDto,
  PortfolioItemResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { RecordCard } from '../src/components/records/record-card';
import { RecordFormModal } from '../src/components/records/record-form-modal';
import { RecordsJournalView } from '../src/components/records/records-journal-view';
import { PortfolioGalleryView } from '../src/components/records/portfolio-gallery-view';

const mockLearners: LearnerSummaryDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    firstName: 'Samuel',
    lastName: 'Silva',
    preferredName: 'Samuca',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#3B82F6',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    firstName: 'Ester',
    lastName: 'Silva',
    preferredName: 'Teca',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#EC4899',
  },
];

const mockSubjects: SubjectResponseDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    familyId: 'fam-1',
    name: 'Latim & Gramática Clássica',
    color: '#7C3AED',
    icon: 'scroll',
    description: 'Declinações e vocabulário',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    familyId: 'fam-1',
    name: 'História Bíblica & Geral',
    color: '#D97706',
    icon: 'book',
    description: 'Linha do tempo da Criação aos Apóstolos',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockObjectives: ObjectiveResponseDto[] = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    subjectId: '11111111-1111-1111-1111-111111111111',
    academicYearId: 'year-2026',
    title: 'Recitar a 1ª declinação latina com pronúncia correta',
    description: null,
    status: 'IN_PROGRESS',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockRecords: LearningRecordResponseDto[] = [
  {
    id: 'rec-1',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    learnerName: 'Samuca',
    subjectId: '11111111-1111-1111-1111-111111111111',
    subjectName: 'Latim & Gramática Clássica',
    subjectColor: '#7C3AED',
    academicYearId: 'year-2026',
    lessonPlanId: null,
    type: 'PLANNED_LESSON',
    title: 'Estudo da Primeira Declinação',
    description: 'Exercícios de tradução e declinação de nomes femininos em -a.',
    date: '2026-08-26',
    durationMinutes: 45,
    masteryLevel: 'MASTERED',
    assessmentMethod: 'NARRATION',
    strengths: 'Excelente retenção e pronúncia clara das terminações.',
    areasForGrowth: 'Revisar vocativo singular.',
    characterHabitGrowth: 'Demonstrou diligência e calma durante a repetição.',
    notes: 'Completou sem consultar o manual na segunda tentativa.',
    objectives: [
      {
        id: 'obj-link-1',
        learningRecordId: 'rec-1',
        objectiveId: '33333333-3333-3333-3333-333333333331',
        objectiveTitle: 'Recitar a 1ª declinação latina com pronúncia correta',
        createdAt: '2026-08-26T00:00:00.000Z',
      },
    ],
    portfolioItemIds: ['port-1'],
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
  {
    id: 'rec-2',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000002',
    learnerName: 'Teca',
    subjectId: '22222222-2222-2222-2222-222222222222',
    subjectName: 'História Bíblica & Geral',
    subjectColor: '#D97706',
    academicYearId: 'year-2026',
    lessonPlanId: null,
    type: 'SPONTANEOUS_EXPERIENCE',
    title: 'Visita ao Museu de História e Narração Espontânea',
    description: 'Observação de artefatos antigos e relato das diferenças para a vida moderna.',
    date: '2026-08-25',
    durationMinutes: 60,
    masteryLevel: 'AUTONOMOUS',
    assessmentMethod: 'OBSERVATION',
    strengths: 'Curiosidade aguçada e excelentes perguntas reflexivas.',
    areasForGrowth: null,
    characterHabitGrowth: 'Atenção sustentada por mais de uma hora.',
    notes: null,
    objectives: [],
    portfolioItemIds: [],
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
  },
];

const mockProgressSummary: LearnerProgressSummaryDto = {
  learnerId: '00000000-0000-0000-0000-000000000001',
  learnerName: 'Samuca',
  totalRecordsCount: 1,
  totalMinutesSpent: 45,
  masteryDistribution: {
    NOT_STARTED: 0,
    EXPOSURE: 0,
    DEVELOPING: 0,
    WITH_ASSISTANCE: 0,
    AUTONOMOUS: 0,
    MASTERED: 1,
  },
  recordsByType: {
    PLANNED_LESSON: 1,
    SPONTANEOUS_EXPERIENCE: 0,
    PROJECT_WORK: 0,
    READING_LOG: 0,
    HABIT_PRACTICE: 0,
  },
  recentMilestones: [mockRecords[0]!],
};

const mockPortfolioItems: PortfolioItemResponseDto[] = [
  {
    id: 'port-1',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    learnerName: 'Samuca',
    learningRecordId: 'rec-1',
    academicYearId: 'year-2026',
    subjectId: '11111111-1111-1111-1111-111111111111',
    subjectName: 'Latim & Gramática Clássica',
    title: 'Caderno de Caligrafia e Tabela de Declinações',
    description: 'Página manuscrita com iluminuras simples e as 5 declinações latinas.',
    type: 'IMAGE',
    fileUrl: 'https://example.com/port1.jpg',
    textContent: null,
    mimeType: 'image/jpeg',
    fileSizeBytes: 2048,
    capturedAt: '2026-08-26',
    isHighlight: true,
    tags: ['caligrafia', 'latim', 'arte'],
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
  {
    id: 'port-2',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000002',
    learnerName: 'Teca',
    learningRecordId: null,
    academicYearId: 'year-2026',
    subjectId: '22222222-2222-2222-2222-222222222222',
    subjectName: 'História Bíblica & Geral',
    title: 'Poema Memorizado: O Cântico de Débora',
    description: 'Transcrição e áudio da recitação completa do cântico bíblico.',
    type: 'TEXT',
    fileUrl: null,
    textContent: 'Ouvi, ó reis; inclinai os ouvidos, ó príncipes...',
    mimeType: 'text/plain',
    fileSizeBytes: null,
    capturedAt: '2026-08-25',
    isHighlight: false,
    tags: ['poesia', 'memoria'],
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
  },
];

describe('Learning Journal, Mastery & Portfolio Web Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('RecordCard', () => {
    it('renders mastery badges, assessment method, character habit growth, and attached objectives', () => {
      const editMock = vi.fn();
      const deleteMock = vi.fn();
      const addEvidenceMock = vi.fn();

      render(
        <RecordCard
          record={mockRecords[0]!}
          onEdit={editMock}
          onDelete={deleteMock}
          onAddEvidence={addEvidenceMock}
        />
      );

      // Verify title & description
      expect(screen.getByText('Estudo da Primeira Declinação')).toBeDefined();
      expect(
        screen.getByText(
          'Exercícios de tradução e declinação de nomes femininos em -a.'
        )
      ).toBeDefined();

      // Verify mastery badge (MASTERED -> 'Dominado')
      const masteryBadge = screen.getByTestId('mastery-badge-rec-1');
      expect(masteryBadge.textContent).toContain('Dominado');

      // Verify assessment method badge (NARRATION -> 'Narração Oral')
      const assessmentBadge = screen.getByTestId('assessment-method-badge-rec-1');
      expect(assessmentBadge.textContent).toContain('Narração Oral');

      // Verify character habit growth
      const habitContainer = screen.getByTestId('character-habit-growth-rec-1');
      expect(habitContainer.textContent).toContain(
        'Demonstrou diligência e calma durante a repetição.'
      );

      // Verify attached objective
      const objectiveBadge = screen.getByTestId(
        'attached-objective-obj-link-1'
      );
      expect(objectiveBadge.textContent).toContain(
        'Recitar a 1ª declinação latina com pronúncia correta'
      );

      // Test Edit button
      fireEvent.click(screen.getByTestId('edit-record-btn-rec-1'));
      expect(editMock).toHaveBeenCalledWith(mockRecords[0]);

      // Test Add Evidence button
      fireEvent.click(screen.getByTestId('add-evidence-btn-rec-1'));
      expect(addEvidenceMock).toHaveBeenCalledWith(mockRecords[0]);

      // Test Delete button
      fireEvent.click(screen.getByTestId('delete-record-btn-rec-1'));
      expect(deleteMock).toHaveBeenCalledWith('rec-1');
    });
  });

  describe('RecordsJournalView', () => {
    it('displays summary metrics, filters, and list of records', () => {
      const openCreateMock = vi.fn();
      const editMock = vi.fn();
      const deleteMock = vi.fn();
      const addEvidenceMock = vi.fn();

      render(
        <RecordsJournalView
          records={mockRecords}
          progressSummary={mockProgressSummary}
          learners={mockLearners}
          subjects={mockSubjects}
          activeLearnerId="00000000-0000-0000-0000-000000000001"
          onOpenCreateRecord={openCreateMock}
          onEditRecord={editMock}
          onDeleteRecord={deleteMock}
          onAddEvidence={addEvidenceMock}
        />
      );

      // Check summary metrics rendered
      expect(screen.getByTestId('records-metrics-summary')).toBeDefined();
      expect(screen.getByTestId('metric-total-records').textContent).toContain('1');
      expect(screen.getByTestId('metric-total-hours').textContent).toContain('45 min');
      expect(screen.getByTestId('metric-mastered-autonomous').textContent).toContain('1');

      // Filtered to learner 1, only rec-1 should appear
      expect(screen.getByText('Estudo da Primeira Declinação')).toBeDefined();
      expect(
        screen.queryByText('Visita ao Museu de História e Narração Espontânea')
      ).toBeNull();

      // Test create new record button
      fireEvent.click(screen.getByTestId('open-create-record-btn'));
      expect(openCreateMock).toHaveBeenCalled();
    });

    it('renders empty state when there are no matching records', () => {
      render(
        <RecordsJournalView
          records={[]}
          progressSummary={null}
          learners={mockLearners}
          subjects={mockSubjects}
          activeLearnerId={null}
          onOpenCreateRecord={vi.fn()}
          onEditRecord={vi.fn()}
          onDeleteRecord={vi.fn()}
          onAddEvidence={vi.fn()}
        />
      );

      expect(screen.getByTestId('records-empty-state')).toBeDefined();
      expect(screen.getByTestId('metric-total-records').textContent).toContain('0');
    });
  });

  describe('RecordFormModal', () => {
    it('allows creating spontaneous and planned learning records with mastery and character reflection', async () => {
      const saveMock = vi.fn().mockResolvedValue(undefined);
      const closeMock = vi.fn();

      render(
        <RecordFormModal
          isOpen={true}
          onClose={closeMock}
          onSave={saveMock}
          learners={mockLearners}
          subjects={mockSubjects}
          objectives={mockObjectives}
          initialDate="2026-08-26"
        />
      );

      // Fill learner
      fireEvent.change(screen.getByTestId('record-learner-select'), {
        target: { value: mockLearners[0]!.id },
      });

      // Fill type as SPONTANEOUS_EXPERIENCE
      fireEvent.change(screen.getByTestId('record-type-select'), {
        target: { value: 'SPONTANEOUS_EXPERIENCE' },
      });

      // Fill title
      fireEvent.change(screen.getByTestId('record-title-input'), {
        target: { value: 'Observação Astronômica das Constelações' },
      });

      // Fill subject
      fireEvent.change(screen.getByTestId('record-subject-select'), {
        target: { value: mockSubjects[0]!.id },
      });

      // Fill duration
      fireEvent.change(screen.getByTestId('record-duration-input'), {
        target: { value: '90' },
      });

      // Fill mastery level
      fireEvent.change(screen.getByTestId('record-mastery-select'), {
        target: { value: 'AUTONOMOUS' },
      });

      // Fill assessment method
      fireEvent.change(screen.getByTestId('record-assessment-select'), {
        target: { value: 'OBSERVATION' },
      });

      // Fill strengths
      fireEvent.change(screen.getByTestId('record-strengths-input'), {
        target: { value: 'Identificou o Cruzeiro do Sul e Orion sem ajuda.' },
      });

      // Fill character habit growth
      fireEvent.change(screen.getByTestId('record-habit-input'), {
        target: { value: 'Paciência na observação noturna e reverência ao Criador.' },
      });

      // Submit
      fireEvent.click(screen.getByTestId('save-record-btn'));

      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          learnerId: mockLearners[0]!.id,
          type: 'SPONTANEOUS_EXPERIENCE',
          title: 'Observação Astronômica das Constelações',
          durationMinutes: 90,
          masteryLevel: 'AUTONOMOUS',
          assessmentMethod: 'OBSERVATION',
          strengths: 'Identificou o Cruzeiro do Sul e Orion sem ajuda.',
          characterHabitGrowth:
            'Paciência na observação noturna e reverência ao Criador.',
        })
      );
    });
  });

  describe('PortfolioGalleryView', () => {
    it('displays evidence items, highlights, and tag filters', () => {
      const openAddMock = vi.fn();
      const editMock = vi.fn();
      const deleteMock = vi.fn();

      render(
        <PortfolioGalleryView
          items={mockPortfolioItems}
          learners={mockLearners}
          subjects={mockSubjects}
          activeLearnerId={null}
          onOpenAddItem={openAddMock}
          onEditItem={editMock}
          onDeleteItem={deleteMock}
        />
      );

      // Verify items rendered
      expect(
        screen.getByText('Caderno de Caligrafia e Tabela de Declinações')
      ).toBeDefined();
      expect(
        screen.getByText('Poema Memorizado: O Cântico de Débora')
      ).toBeDefined();

      // Verify highlight badge
      expect(screen.getByTestId('portfolio-highlight-badge-port-1')).toBeDefined();

      // Verify stats
      const stats = screen.getByTestId('portfolio-count-stats');
      expect(stats.textContent).toContain('2 obra(s)');
      expect(stats.textContent).toContain('1 destaque(s)');

      // Verify tag chips rendered
      expect(screen.getByTestId('tag-filter-btn-caligrafia')).toBeDefined();
      expect(screen.getByTestId('tag-filter-btn-poesia')).toBeDefined();

      // Filter by tag 'poesia'
      fireEvent.click(screen.getByTestId('tag-filter-btn-poesia'));
      expect(
        screen.queryByText('Caderno de Caligrafia e Tabela de Declinações')
      ).toBeNull();
      expect(
        screen.getByText('Poema Memorizado: O Cântico de Débora')
      ).toBeDefined();

      // Test Edit button
      fireEvent.click(screen.getByTestId('edit-portfolio-btn-port-2'));
      expect(editMock).toHaveBeenCalledWith(mockPortfolioItems[1]);

      // Test Delete button
      fireEvent.click(screen.getByTestId('delete-portfolio-btn-port-2'));
      expect(deleteMock).toHaveBeenCalledWith('port-2');
    });
  });
});

