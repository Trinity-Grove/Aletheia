import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type {
  DailyAgendaDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  ScheduleSlotResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { DailyAgendaView } from '../src/components/lessons/daily-agenda-view';
import { LessonFormModal } from '../src/components/lessons/lesson-form-modal';
import { RescheduleModal } from '../src/components/lessons/reschedule-modal';
import { WeeklyRoutineGrid } from '../src/components/lessons/weekly-routine-grid';

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
  {
    id: '33333333-3333-3333-3333-333333333332',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    subjectId: '11111111-1111-1111-1111-111111111111',
    academicYearId: 'year-2026',
    title: 'Dominar 20 vocábulos da família das palavras latinas',
    description: null,
    status: 'ACHIEVED',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockDailyAgenda: DailyAgendaDto = {
  date: '2026-08-26',
  dayOfWeek: 3,
  items: [
    {
      type: 'LESSON',
      id: 'aaaa1111-1111-1111-1111-111111111111',
      title: 'Declinação de Substantivos Latinos',
      startTime: '08:30',
      endTime: '09:30',
      subjectId: '11111111-1111-1111-1111-111111111111',
      subjectName: 'Latim & Gramática Clássica',
      subjectColor: '#7C3AED',
      status: 'COMPLETED',
      isCompleted: true,
      learnerIds: ['00000000-0000-0000-0000-000000000001'],
    },
    {
      type: 'LESSON',
      id: 'aaaa2222-2222-2222-2222-222222222222',
      title: 'Reis de Judá e Israel - Narração Oral',
      startTime: '10:00',
      endTime: '11:00',
      subjectId: '22222222-2222-2222-2222-222222222222',
      subjectName: 'História Bíblica & Geral',
      subjectColor: '#D97706',
      status: 'PLANNED',
      isCompleted: false,
      learnerIds: [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      ],
    },
    {
      type: 'ROUTINE_SLOT',
      id: 'bbbb1111-1111-1111-1111-111111111111',
      title: 'Devocional e Leitura em Família',
      startTime: '08:00',
      endTime: '08:30',
      isCompleted: false,
      learnerIds: [],
    },
  ],
};

const mockRoutineSlots: ScheduleSlotResponseDto[] = [
  {
    id: 'slot-mon-1',
    familyId: 'fam-1',
    dayOfWeek: 1, // Segunda
    startTime: '08:00',
    endTime: '09:00',
    title: 'Devocional & Canto',
    subjectId: null,
    learnerId: null,
    location: 'Sala de Estar',
    color: '#3B82F6',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'slot-wed-1',
    familyId: 'fam-1',
    dayOfWeek: 3, // Quarta
    startTime: '09:30',
    endTime: '10:30',
    title: 'Estudo de Latim Clássico',
    subjectId: '11111111-1111-1111-1111-111111111111',
    subjectName: 'Latim & Gramática Clássica',
    learnerId: '00000000-0000-0000-0000-000000000001',
    learnerName: 'Samuca',
    location: 'Mesa de Estudos',
    color: '#7C3AED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('Lessons and Schedule Web Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('DailyAgendaView', () => {
    it('renders scheduled lessons and routine slots, duration pills, and calculates completed totals', () => {
      const openCreateLessonMock = vi.fn();
      const openCreateSlotMock = vi.fn();
      const openCompleteMock = vi.fn();
      const openRescheduleMock = vi.fn();
      const onDateChangeMock = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DailyAgendaView
            agenda={mockDailyAgenda}
            selectedDate="2026-08-26"
            learners={mockLearners}
            onDateChange={onDateChangeMock}
            onOpenCreateLesson={openCreateLessonMock}
            onOpenCreateSlot={openCreateSlotMock}
            onOpenCompleteLesson={openCompleteMock}
            onOpenRescheduleLesson={openRescheduleMock}
          />
        </AuthProvider>
      );

      // Verify progress totals (1 of 3 items completed = 33%)
      const totalsText = screen.getByTestId('completed-totals-text');
      expect(totalsText.textContent).toContain('1 de 3 concluídos (33%)');

      // Verify scheduled lessons rendered
      expect(screen.getByText('Declinação de Substantivos Latinos')).toBeDefined();
      expect(screen.getByText('Reis de Judá e Israel - Narração Oral')).toBeDefined();

      // Verify routine slot rendered
      expect(screen.getByText('Devocional e Leitura em Família')).toBeDefined();

      // Verify type badges
      const firstItem = mockDailyAgenda.items[0]!;
      const thirdItem = mockDailyAgenda.items[2]!;
      expect(
        screen.getByTestId(`item-type-badge-${firstItem.id}`).textContent
      ).toContain('Lição');
      expect(
        screen.getByTestId(`item-type-badge-${thirdItem.id}`).textContent
      ).toContain('Rotina');

      // Test reschedule button click
      const secondItem = mockDailyAgenda.items[1]!;
      const rescheduleBtn = screen.getByTestId(`reschedule-btn-${secondItem.id}`);
      fireEvent.click(rescheduleBtn);
      expect(openRescheduleMock).toHaveBeenCalledWith(secondItem);

      // Test complete button click
      const completeBtn = screen.getByTestId(`complete-lesson-btn-${secondItem.id}`);
      fireEvent.click(completeBtn);
      expect(openCompleteMock).toHaveBeenCalledWith(secondItem);
    });

    it('renders empty state when there are no agenda items', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DailyAgendaView
            agenda={{ date: '2026-08-26', dayOfWeek: 3, items: [] }}
            selectedDate="2026-08-26"
            learners={mockLearners}
            onDateChange={vi.fn()}
            onOpenCreateLesson={vi.fn()}
            onOpenCreateSlot={vi.fn()}
            onOpenCompleteLesson={vi.fn()}
            onOpenRescheduleLesson={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByTestId('agenda-empty-state')).toBeDefined();
      expect(screen.getByTestId('completed-totals-text').textContent).toContain(
        '0 de 0 concluídos (0%)'
      );
    });
  });

  describe('LessonFormModal', () => {
    it('creates lesson plan with subject, multi-learner selection, and objective linkages', async () => {
      const saveMock = vi.fn().mockResolvedValue(undefined);
      const closeMock = vi.fn();

      render(
        <LessonFormModal
          isOpen={true}
          onClose={closeMock}
          onSave={saveMock}
          learners={mockLearners}
          subjects={mockSubjects}
          objectives={mockObjectives}
          initialDate="2026-08-26"
        />
      );

      // Fill title
      const titleInput = screen.getByTestId('lesson-title-input');
      fireEvent.change(titleInput, {
        target: { value: 'Introdução ao Latim e Alfabeto' },
      });

      // Select subject
      const firstSub = mockSubjects[0]!;
      const subjectSelect = screen.getByTestId('lesson-subject-select');
      fireEvent.change(subjectSelect, {
        target: { value: firstSub.id },
      });

      // Select both learners (first is selected by default, click second)
      const secondLearner = mockLearners[1]!;
      const secondLearnerCheckbox = screen.getByTestId(
        `learner-checkbox-${secondLearner.id}`
      );
      fireEvent.click(secondLearnerCheckbox);

      // Link objective
      const firstObj = mockObjectives[0]!;
      const objectiveCheckbox = screen.getByTestId(
        `objective-checkbox-${firstObj.id}`
      );
      fireEvent.click(objectiveCheckbox);

      // Fill materials and homework
      fireEvent.change(screen.getByTestId('lesson-materials-input'), {
        target: { value: 'Gramática Latina Básica, pág. 12' },
      });
      fireEvent.change(screen.getByTestId('lesson-homework-input'), {
        target: { value: 'Copiar quadro de declinações 1 vez' },
      });

      // Submit
      const submitBtn = screen.getByTestId('save-lesson-btn');
      fireEvent.click(submitBtn);

      const firstLearner = mockLearners[0]!;
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Introdução ao Latim e Alfabeto',
          subjectId: firstSub.id,
          date: '2026-08-26',
          learnerIds: [firstLearner.id, secondLearner.id],
          objectiveIds: [firstObj.id],
          materials: 'Gramática Latina Básica, pág. 12',
          homework: 'Copiar quadro de declinações 1 vez',
        })
      );
    });
  });

  describe('RescheduleModal', () => {
    it('updates scheduled date and notes', async () => {
      const rescheduleMock = vi.fn().mockResolvedValue(undefined);
      const closeMock = vi.fn();

      render(
        <RescheduleModal
          isOpen={true}
          lesson={{
            id: 'lesson-123',
            title: 'Lição de História',
            date: '2026-08-26',
            startTime: '09:00',
            endTime: '10:00',
          }}
          onClose={closeMock}
          onReschedule={rescheduleMock}
        />
      );

      expect(screen.getByText('Lição de História')).toBeDefined();

      // Change date
      const dateInput = screen.getByTestId('reschedule-date-input');
      fireEvent.change(dateInput, { target: { value: '2026-08-28' } });

      // Change time
      const startTimeInput = screen.getByTestId('reschedule-start-time-input');
      fireEvent.change(startTimeInput, { target: { value: '14:00' } });

      // Enter reason / notes
      const reasonInput = screen.getByTestId('reschedule-reason-input');
      fireEvent.change(reasonInput, {
        target: { value: 'Reagendado devido a consulta médica' },
      });

      // Submit
      const submitBtn = screen.getByTestId('save-reschedule-btn');
      fireEvent.click(submitBtn);

      expect(rescheduleMock).toHaveBeenCalledWith('lesson-123', {
        newDate: '2026-08-28',
        startTime: '14:00',
        endTime: '10:00',
        reason: 'Reagendado devido a consulta médica',
      });
    });
  });

  describe('WeeklyRoutineGrid', () => {
    it('displays days of week and recurring time slots with RBAC actions', () => {
      const addSlotMock = vi.fn();
      const deleteSlotMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <WeeklyRoutineGrid
            slots={mockRoutineSlots}
            learners={mockLearners}
            subjects={mockSubjects}
            onAddSlot={addSlotMock}
            onDeleteSlot={deleteSlotMock}
          />
        </AuthProvider>
      );

      // Verify day headers
      expect(screen.getByText('Segunda-feira')).toBeDefined();
      expect(screen.getByText('Quarta-feira')).toBeDefined();
      expect(screen.getByText('Sexta-feira')).toBeDefined();

      // Verify routine slot content
      expect(screen.getByText('Devocional & Canto')).toBeDefined();
      expect(screen.getByText('Estudo de Latim Clássico')).toBeDefined();
      expect(screen.getByText('📍 Sala de Estar')).toBeDefined();

      // Test delete slot button
      const firstSlot = mockRoutineSlots[0]!;
      const deleteBtn = screen.getByTestId(`delete-slot-btn-${firstSlot.id}`);
      fireEvent.click(deleteBtn);
      expect(deleteSlotMock).toHaveBeenCalledWith('slot-mon-1');

      // Test add slot button
      const addBtn = screen.getByTestId('add-routine-slot-btn');
      fireEvent.click(addBtn);
      expect(addSlotMock).toHaveBeenCalledWith(1);
    });
  });
});

