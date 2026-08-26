'use client';

import React, { useEffect, useState } from 'react';
import type { RescheduleLessonDto } from '@aletheia/contracts';

export interface RescheduleLessonItem {
  id: string;
  title: string;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface RescheduleModalProps {
  isOpen: boolean;
  lesson: RescheduleLessonItem | null;
  onClose: () => void;
  onReschedule: (lessonId: string, dto: RescheduleLessonDto) => Promise<void>;
}

export function RescheduleModal({
  isOpen,
  lesson,
  onClose,
  onReschedule,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setNewDate(lesson.date || new Date().toISOString().split('T')[0] || '');
      setStartTime(lesson.startTime || '09:00');
      setEndTime(lesson.endTime || '10:00');
      setReason('');
      setError(null);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setError('Por favor, informe a nova data.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onReschedule(lesson.id, {
        newDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao reagendar lição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="reschedule-modal-overlay"
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
          maxWidth: '30rem',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Reagendar Lição
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
            data-testid="reschedule-error"
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
              htmlFor="reschedule-date"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Nova Data *
            </label>
            <input
              id="reschedule-date"
              data-testid="reschedule-date-input"
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                htmlFor="reschedule-start-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Início
              </label>
              <input
                id="reschedule-start-time"
                data-testid="reschedule-start-time-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="reschedule-end-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Término
              </label>
              <input
                id="reschedule-end-time"
                data-testid="reschedule-end-time-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="reschedule-reason"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Motivo / Observação
            </label>
            <textarea
              id="reschedule-reason"
              data-testid="reschedule-reason-input"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Passeio ao museu, reagendado para o período da tarde..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              data-testid="save-reschedule-btn"
              disabled={loading}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Reagendando...' : 'Confirmar Reagendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
