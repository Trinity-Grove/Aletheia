'use client';

import React, { useState, useEffect } from 'react';
import { Button, Checkbox, Modal, Select, Textarea } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';
import type { LessonReflectionData } from './types';

export interface LearnerReflectionModalProps {
  isOpen: boolean;
  onClose(): void;
  lessonTitle: string;
  lessonId: string;
  learnerName: string;
  initialHabits?: string[] | undefined;
  onConfirm(reflection: LessonReflectionData): Promise<void>;
  isSubmitting?: boolean | undefined;
}

export function LearnerReflectionModal({
  isOpen,
  onClose,
  lessonTitle,
  initialHabits,
  onConfirm,
  isSubmitting = false,
}: LearnerReflectionModalProps) {
  const { t } = useLocale();

  const [isOralNarration, setIsOralNarration] = useState(false);
  const [writtenNotes, setWrittenNotes] = useState('');
  const [selectedHabit, setSelectedHabit] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsOralNarration(false);
      setWrittenNotes('');
      setSelectedHabit(initialHabits?.[0] ?? '');
    }
  }, [isOpen, initialHabits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm?.({
      notes: writtenNotes.trim() || undefined,
      isOralNarration,
      characterHabit: selectedHabit || undefined,
    });
  };

  const habitOptions = [
    { value: '', label: t('learnerPortal.agenda.characterHabitPlaceholder') },
    { value: t('learnerPortal.agenda.habitAttention'), label: `🎯 ${t('learnerPortal.agenda.habitAttention')}` },
    { value: t('learnerPortal.agenda.habitDiligence'), label: `⚒️ ${t('learnerPortal.agenda.habitDiligence')}` },
    { value: t('learnerPortal.agenda.habitTruthfulness'), label: `💎 ${t('learnerPortal.agenda.habitTruthfulness')}` },
    { value: t('learnerPortal.agenda.habitCuriosity'), label: `🔍 ${t('learnerPortal.agenda.habitCuriosity')}` },
    { value: t('learnerPortal.agenda.habitKindness'), label: `🤝 ${t('learnerPortal.agenda.habitKindness')}` },
    { value: t('learnerPortal.agenda.habitObedience'), label: `🕊️ ${t('learnerPortal.agenda.habitObedience')}` },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('learnerPortal.agenda.reflectionModalTitle')}
      description={t('learnerPortal.agenda.reflectionModalSubtitle')}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button
            type="button"
            variant="secondary"
            data-testid="cancel-reflection-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('learnerPortal.agenda.cancelButton')}
          </Button>
          <Button
            type="submit"
            form="learner-reflection-form"
            variant="primary"
            data-testid="submit-reflection-btn"
            isLoading={isSubmitting}
          >
            {t('learnerPortal.agenda.confirmCompletionButton')}
          </Button>
        </div>
      }
    >
      <div data-testid="learner-reflection-modal">
        <div
          style={{
            backgroundColor: 'var(--sage-soft)',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-light)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase' }}>
            {t('learnerPortal.agenda.lessonLabel')}
          </span>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
            {lessonTitle}
          </p>
        </div>

        <form
          id="learner-reflection-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-canvas)',
            }}
          >
            <Checkbox
              id="oral-narration-checkbox"
              data-testid="oral-narration-checkbox"
              label={t('learnerPortal.agenda.oralNarrationOption')}
              checked={isOralNarration}
              onChange={(e) => setIsOralNarration(e.target.checked)}
            />
          </div>

          <Textarea
            id="written-narration-textarea"
            data-testid="written-narration-textarea"
            label={t('learnerPortal.agenda.writtenNarrationLabel')}
            placeholder={t('learnerPortal.agenda.writtenNarrationPlaceholder')}
            value={writtenNotes}
            onChange={(e) => setWrittenNotes(e.target.value)}
            rows={4}
          />

          <Select
            id="character-habit-select"
            data-testid="character-habit-select"
            label={t('learnerPortal.agenda.characterHabitLabel')}
            options={habitOptions}
            value={selectedHabit}
            onChange={(e) => setSelectedHabit(e.target.value)}
          />
        </form>
      </div>
    </Modal>
  );
}
