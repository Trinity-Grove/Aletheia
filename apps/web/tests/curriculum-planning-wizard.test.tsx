import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumPlanningWizardModal } from '../src/components/curriculum/curriculum-planning-wizard-modal';
import { WeeklyRoutineGrid } from '../src/components/lessons/weekly-routine-grid';

const mockSuggestRoutineResponse = {
  slots: [
    {
      dayOfWeek: 1,
      startTime: '08:30',
      endTime: '08:45',
      subjectName: 'Devocional Familiar',
      subjectColor: '#4F46E5',
      slotType: 'DEVOTIONAL',
      notes: 'Oração e leitura bíblica matinal',
    },
    {
      dayOfWeek: 1,
      startTime: '08:45',
      endTime: '09:10',
      subjectName: 'Matemática',
      subjectColor: '#2563EB',
      slotType: 'INSTRUCTION',
    },
    {
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '09:45',
      subjectName: 'Estudo da Natureza & Caderno Vivo',
      subjectColor: '#16A34A',
      slotType: 'OUTDOOR_HABIT',
    },
  ],
  pedagogicalRationale: 'Rotina Charlotte Mason com lições curtas e hábitos ao ar livre.',
  totalInstructionalHoursWeekly: 14.5,
};

describe('CurriculumPlanningWizardModal & Routine Generation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('navigates through 3 steps: Philosophy Diagnosis -> Learning Blocks with Pedagogical Guide -> Smart Routine 1-click apply', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    vi.spyOn(global, 'fetch').mockImplementation((url, init) => {
      const urlStr = String(url);
      if (urlStr.includes('/schedule/suggest-routine')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSuggestRoutineResponse,
        } as Response);
      }
      if (urlStr.includes('/schedule/apply-suggested-routine')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'slot-created-1' }],
        } as Response);
      }
      if (urlStr.includes('/curriculum/templates/apply')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    render(
      <CurriculumPlanningWizardModal
        isOpen={true}
        onClose={handleClose}
        familyId="fam-1"
        learnerId="learner-1"
        academicYearId="year-1"
        onSuccess={handleSuccess}
      />,
    );

    // STEP 1: Philosophy & Diagnosis
    expect(screen.getByText('Passo 1: Filosofia & Diagnóstico Familiar')).toBeInTheDocument();
    expect(screen.getByText(/Charlotte Mason/i)).toBeInTheDocument();
    expect(screen.getByText(/Clássico \(Trívio\)/i)).toBeInTheDocument();

    // Answer optional diagnostic quiz to recommend Charlotte Mason
    const quizToggle = screen.getByTestId('toggle-diagnostic-quiz-btn');
    fireEvent.click(quizToggle);

    expect(screen.getByText(/Qual ritmo melhor descreve a dinâmica da sua família\?/i)).toBeInTheDocument();
    const cmOption = screen.getByTestId('quiz-q1-cm');
    fireEvent.click(cmOption);

    // Advance to Step 2
    const nextBtn = screen.getByTestId('wizard-next-btn');
    fireEvent.click(nextBtn);

    // STEP 2: Learning Blocks & "Como Ensinar" Guide
    await waitFor(() => {
      expect(screen.getByText('Passo 2: Blocos de Aprendizagem & Guia Didático')).toBeInTheDocument();
      expect(screen.getByText('Bloco 1: Fundamentos, Atenção & Hábitos Iniciais')).toBeInTheDocument();
      expect(screen.getByText(/Como Ensinar este Bloco/i)).toBeInTheDocument();
      expect(screen.getByText(/Narração Oral/i)).toBeInTheDocument();
    });

    // Advance to Step 3
    fireEvent.click(screen.getByTestId('wizard-next-btn'));

    // STEP 3: Smart Routine Preview
    await waitFor(() => {
      expect(screen.getByText('Passo 3: Geração Inteligente da Grade Semanal')).toBeInTheDocument();
      expect(screen.getByText(/14.5 horas de instrução semanal/i)).toBeInTheDocument();
      expect(screen.getByText('Devocional Familiar')).toBeInTheDocument();
    });

    // Approve and activate
    const approveBtn = screen.getByTestId('approve-and-activate-routine-btn');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('WeeklyRoutineGrid Empty Banner', () => {
    it('displays prompt banner with "Gerar Grade Semanal Sugerida" when slots are empty', () => {
      const handleSuggest = vi.fn();

      render(
        <WeeklyRoutineGrid
          slots={[]}
          learners={[]}
          subjects={[]}
          onAddSlot={vi.fn()}
          onDeleteSlot={vi.fn()}
          onSuggestRoutine={handleSuggest}
        />,
      );

      const banner = screen.getByTestId('empty-routine-banner');
      expect(banner).toBeInTheDocument();
      expect(screen.getByText(/Grade Semanal Vazia/i)).toBeInTheDocument();

      const generateBtn = screen.getByTestId('generate-suggested-routine-btn');
      expect(generateBtn).toBeInTheDocument();
      fireEvent.click(generateBtn);

      expect(handleSuggest).toHaveBeenCalled();
    });
  });
});
