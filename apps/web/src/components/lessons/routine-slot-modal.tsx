'use client';

import React, { useState } from 'react';
import type {
  CreateScheduleSlotDto,
  DayOfWeek,
  LearnerSummaryDto,
  SubjectResponseDto,
} from '@aletheia/contracts';

export interface RoutineSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateScheduleSlotDto) => Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  initialDayOfWeek?: DayOfWeek;
  academicYearId?: string;
}

export const DAYS_OF_WEEK: Array<{ value: DayOfWeek; label: string }> = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export function RoutineSlotModal({
  isOpen,
  onClose,
  onSave,
  learners,
  subjects,
  initialDayOfWeek = 1,
  academicYearId,
}: RoutineSlotModalProps) {
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDayOfWeek);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [subjectId, setSubjectId] = useState('');
  const [learnerId, setLearnerId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título do bloco de rotina.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Por favor, informe os horários de início e término.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        dayOfWeek: Number(dayOfWeek) as DayOfWeek,
        startTime,
        endTime,
        subjectId: subjectId || undefined,
        learnerId: learnerId || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        color: color || undefined,
        academicYearId: academicYearId || undefined,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setSubjectId('');
      setLearnerId('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar bloco de rotina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="routine-slot-modal-overlay"
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
            Novo Bloco de Rotina Semanal
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

        {error && (
          <div
            data-testid="slot-form-error"
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
              htmlFor="slot-title"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Título da Atividade / Bloco *
            </label>
            <input
              id="slot-title"
              data-testid="slot-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Devocional Matinal, Leitura Clássica, Matemática"
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
                htmlFor="slot-day"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Dia da Semana *
              </label>
              <select
                id="slot-day"
                data-testid="slot-day-select"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="slot-color"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Cor de Destaque
              </label>
              <input
                id="slot-color"
                data-testid="slot-color-input"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0.25rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                htmlFor="slot-start-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Horário Início *
              </label>
              <input
                id="slot-start-time"
                data-testid="slot-start-time-input"
                type="time"
                required
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
                htmlFor="slot-end-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Horário Término *
              </label>
              <input
                id="slot-end-time"
                data-testid="slot-end-time-input"
                type="time"
                required
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                htmlFor="slot-subject"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Disciplina (Opcional)
              </label>
              <select
                id="slot-subject"
                data-testid="slot-subject-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Nenhuma / Geral</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="slot-learner"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Educando (Opcional)
              </label>
              <select
                id="slot-learner"
                data-testid="slot-learner-select"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Toda a Família</option>
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.preferredName || l.firstName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="slot-location"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Local / Espaço (Opcional)
            </label>
            <input
              id="slot-location"
              data-testid="slot-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sala de Leitura, Mesa de Estudos, Ar Livre"
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
              data-testid="save-slot-btn"
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
              {loading ? 'Salvando...' : 'Salvar Bloco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
