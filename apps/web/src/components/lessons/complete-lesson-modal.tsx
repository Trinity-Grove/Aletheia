'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CompleteLessonDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface CompleteLessonItem {
  id: string;
  title: string;
  durationMinutes?: number | null;
  learners?: Array<{ learnerId: string; learnerName?: string; id?: string }>;
}

export interface CompleteLessonModalProps {
  isOpen: boolean;
  lesson: CompleteLessonItem | null;
  onClose: () => void;
  onComplete(lessonId: string, dto: CompleteLessonDto, learnerId?: string): Promise<void>;
}

export function CompleteLessonModal({
  isOpen,
  lesson,
  onClose,
  onComplete,
}: CompleteLessonModalProps) {
  const { t } = useLocale();
  const [actualDurationMinutes, setActualDurationMinutes] = useState<number>(45);
  const [notes, setNotes] = useState('');
  const [learnerNotes, setLearnerNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setActualDurationMinutes(lesson.durationMinutes || 45);
      setNotes('');
      setLearnerNotes({});
      setError(null);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleLearnerNoteChange = (learnerId: string, value: string) => {
    setLearnerNotes((prev) => ({ ...prev, [learnerId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onComplete(lesson.id, {
        completedAt: new Date().toISOString(),
        actualDurationMinutes: actualDurationMinutes ? Number(actualDurationMinutes) : undefined,
        notes: notes.trim() || undefined,
        learnerNotes: Object.keys(learnerNotes).length > 0 ? learnerNotes : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('lessons.completeModal.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lessons.completeModal.title')}
      description={
        <>
          {t('lessons.completeModal.lessonPrefix')} <strong>{lesson.title}</strong>
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('lessons.completeModal.cancel')}
          </Button>
          <Button type="submit" form="complete-lesson-form" data-testid="confirm-complete-btn" isLoading={loading}>
            {t('lessons.completeModal.confirm')}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" data-testid="complete-error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      <form id="complete-lesson-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label={t('lessons.completeModal.executionTimeLabel')}
          type="number"
          data-testid="actual-duration-input"
          min={1}
          max={1440}
          value={actualDurationMinutes}
          onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
        />

        <Textarea
          label={t('lessons.completeModal.evaluationNotesLabel')}
          rows={3}
          data-testid="complete-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('lessons.completeModal.evaluationNotesPlaceholder')}
        />

        {lesson.learners && lesson.learners.length > 1 && (
          <div>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('lessons.completeModal.individualNotesTitle')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lesson.learners.map((l) => (
                <Input
                  key={l.learnerId}
                  label={l.learnerName || t('lessons.completeModal.learnerFallback')}
                  data-testid={`learner-note-input-${l.learnerId}`}
                  value={learnerNotes[l.learnerId] || ''}
                  onChange={(e) => handleLearnerNoteChange(l.learnerId, e.target.value)}
                  placeholder={t('lessons.completeModal.specificFeedbackPlaceholder')}
                />
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
