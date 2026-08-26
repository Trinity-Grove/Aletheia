'use client';

import React, { useEffect, useState } from 'react';
import type { CompleteLessonDto } from '@aletheia/contracts';

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
  onComplete: (lessonId: string, dto: CompleteLessonDto, learnerId?: string) => Promise<void>;
}

export function CompleteLessonModal({
  isOpen,
  lesson,
  onClose,
  onComplete,
}: CompleteLessonModalProps) {
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
      setError(err instanceof Error ? err.message : 'Erro ao concluir lição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="complete-lesson-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '32rem',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Concluir Lição
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>
          Lição: <strong>{lesson.title}</strong>
        </div>

        {error && (
          <div
            data-testid="complete-error"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="actual-duration"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Tempo Real de Execução (minutos)
            </label>
            <input
              id="actual-duration"
              data-testid="actual-duration-input"
              type="number"
              min={1}
              max={1440}
              value={actualDurationMinutes}
              onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="complete-notes"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Notas de Avaliação e Desempenho Geral
            </label>
            <textarea
              id="complete-notes"
              data-testid="complete-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como foi a compreensão do tema, engajamento e retenção..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {lesson.learners && lesson.learners.length > 1 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Observações Individuais por Educando (Opcional)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lesson.learners.map((l) => (
                  <div key={l.learnerId}>
                    <label
                      htmlFor={`learner-note-${l.learnerId}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '0.125rem' }}
                    >
                      {l.learnerName || 'Educando'}
                    </label>
                    <input
                      id={`learner-note-${l.learnerId}`}
                      data-testid={`learner-note-input-${l.learnerId}`}
                      type="text"
                      value={learnerNotes[l.learnerId] || ''}
                      onChange={(e) => handleLearnerNoteChange(l.learnerId, e.target.value)}
                      placeholder="Feedback específico..."
                      style={{
                        width: '100%',
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="confirm-complete-btn"
              disabled={loading}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Concluindo...' : 'Concluir Lição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
