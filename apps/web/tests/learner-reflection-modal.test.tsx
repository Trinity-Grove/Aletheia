import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { LearnerReflectionModal } from '../src/components/learner-portal/learner-reflection-modal';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

describe('LearnerReflectionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    lessonTitle: 'Introdução à Botânica e Fotossíntese',
    lessonId: 'lesson-101',
    learnerName: 'Samuel Silva',
    initialHabits: ['Atenção', 'Diligência'],
    onConfirm: vi.fn().mockResolvedValue(undefined),
  };

  it('renderiza o modal quando aberto com os dados da lição', () => {
    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} />
      </LocaleProvider>
    );

    expect(screen.getByTestId('learner-reflection-modal')).toBeInTheDocument();
    expect(screen.getByText('Introdução à Botânica e Fotossíntese')).toBeInTheDocument();
    expect(screen.getByTestId('submit-reflection-btn')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-reflection-btn')).toBeInTheDocument();
  });

  it('não renderiza o corpo do modal quando isOpen é false', () => {
    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} isOpen={false} />
      </LocaleProvider>
    );

    expect(screen.queryByTestId('learner-reflection-modal')).not.toBeInTheDocument();
  });

  it('exibe o aviso visual de auto-frequência (auto-attendance-notice) com texto traduzido', () => {
    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} />
      </LocaleProvider>
    );

    const notice = screen.getByTestId('auto-attendance-notice');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent('Presença registrada automaticamente pela conclusão desta lição.');
  });

  it('exibe o aviso de auto-frequência traduzido em en-US e es-ES', () => {
    localStorage.setItem('aletheia_locale', 'en-US');
    const { unmount } = render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} />
      </LocaleProvider>
    );

    expect(screen.getByTestId('auto-attendance-notice')).toHaveTextContent(
      'Attendance automatically logged upon completion of this lesson.'
    );
    unmount();

    localStorage.setItem('aletheia_locale', 'es-ES');
    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} />
      </LocaleProvider>
    );

    expect(screen.getByTestId('auto-attendance-notice')).toHaveTextContent(
      'Asistencia registrada automáticamente al completar esta lección.'
    );
  });

  it('permite interação com hábitos de caráter, notas escritas e narração oral e dispara onConfirm', async () => {
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);

    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} onConfirm={onConfirmMock} />
      </LocaleProvider>
    );

    const oralCheckbox = screen.getByTestId('oral-narration-checkbox');
    const writtenTextarea = screen.getByTestId('written-narration-textarea');
    const habitSelect = screen.getByTestId('character-habit-select');

    fireEvent.click(oralCheckbox);
    fireEvent.change(writtenTextarea, {
      target: { value: 'Compreendi como a clorofila absorve a luz solar.' },
    });
    fireEvent.change(habitSelect, {
      target: { value: 'Diligência e Esforço' },
    });

    const submitBtn = screen.getByTestId('submit-reflection-btn');
    fireEvent.click(submitBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      notes: 'Compreendi como a clorofila absorve a luz solar.',
      isOralNarration: true,
      characterHabit: 'Diligência e Esforço',
    });
  });

  it('dispara onClose ao clicar no botão Cancelar', () => {
    const onCloseMock = vi.fn();

    render(
      <LocaleProvider>
        <LearnerReflectionModal {...defaultProps} onClose={onCloseMock} />
      </LocaleProvider>
    );

    const cancelBtn = screen.getByTestId('cancel-reflection-btn');
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
