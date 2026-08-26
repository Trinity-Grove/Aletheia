'use client';

import React, { useEffect, useState } from 'react';
import type {
  CreateLessonPlanDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';

export interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateLessonPlanDto) => Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  objectives?: ObjectiveResponseDto[];
  initialDate?: string;
  initialAcademicYearId?: string;
}

export function LessonFormModal({
  isOpen,
  onClose,
  onSave,
  learners,
  subjects,
  objectives = [],
  initialDate,
  initialAcademicYearId,
}: LessonFormModalProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split('T')[0] || ''
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>(() => {
    const first = learners[0];
    return first ? [first.id] : [];
  });
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [homework, setHomework] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const first = subjects[0];
    if (first && !subjectId) {
      setSubjectId(first.id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    const first = learners[0];
    if (first && selectedLearnerIds.length === 0) {
      setSelectedLearnerIds([first.id]);
    }
  }, [learners, selectedLearnerIds]);

  if (!isOpen) return null;

  const toggleLearner = (learnerId: string) => {
    setSelectedLearnerIds((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    );
  };

  const toggleObjective = (objectiveId: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(objectiveId) ? prev.filter((id) => id !== objectiveId) : [...prev, objectiveId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título da lição.');
      return;
    }
    if (!subjectId) {
      setError('Por favor, selecione uma disciplina.');
      return;
    }
    if (selectedLearnerIds.length === 0) {
      setError('Selecione pelo menos um educando.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        subjectId,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        learnerIds: selectedLearnerIds,
        objectiveIds: selectedObjectiveIds,
        academicYearId: initialAcademicYearId || undefined,
        description: description.trim() || undefined,
        materials: materials.trim() || undefined,
        homework: homework.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset
      setTitle('');
      setDescription('');
      setMaterials('');
      setHomework('');
      setNotes('');
      setSelectedObjectiveIds([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar lição');
    } finally {
      setLoading(false);
    }
  };

  // Filter objectives matching selected subject (or show all available)
  const availableObjectives = objectives.filter(
    (obj) => !subjectId || obj.subjectId === subjectId
  );

  return (
    <div
      data-testid="lesson-form-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          padding: '1.75rem',
          maxWidth: '42rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Planejar Nova Lição
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
            data-testid="lesson-form-error"
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
          {/* Title & Subject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                htmlFor="lesson-title"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Título da Lição *
              </label>
              <input
                id="lesson-title"
                data-testid="lesson-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Leitura Narrativa e Vocabulário"
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
                htmlFor="lesson-subject"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Disciplina *
              </label>
              <select
                id="lesson-subject"
                data-testid="lesson-subject-select"
                required
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
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Start Time, End Time, Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                htmlFor="lesson-date"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Data *
              </label>
              <input
                id="lesson-date"
                data-testid="lesson-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                htmlFor="lesson-start-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Início
              </label>
              <input
                id="lesson-start-time"
                data-testid="lesson-start-time-input"
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
                htmlFor="lesson-end-time"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Término
              </label>
              <input
                id="lesson-end-time"
                data-testid="lesson-end-time-input"
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

            <div>
              <label
                htmlFor="lesson-duration"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Duração (min)
              </label>
              <input
                id="lesson-duration"
                data-testid="lesson-duration-input"
                type="number"
                min={1}
                max={1440}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
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

          {/* Multi-Learner Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
              Educandos Participantes *
            </span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {learners.map((learner) => {
                const checked = selectedLearnerIds.includes(learner.id);
                return (
                  <label
                    key={learner.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: checked ? '1px solid #2563EB' : '1px solid #D1D5DB',
                      backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`learner-checkbox-${learner.id}`}
                      checked={checked}
                      onChange={() => toggleLearner(learner.id)}
                      style={{ accentColor: '#2563EB' }}
                    />
                    <span>{learner.preferredName || learner.firstName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Objectives Linkage */}
          {availableObjectives.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Vincular Objetivos de Aprendizagem
              </span>
              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                }}
              >
                {availableObjectives.map((obj) => {
                  const checked = selectedObjectiveIds.includes(obj.id);
                  return (
                    <label
                      key={obj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        color: '#374151',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`objective-checkbox-${obj.id}`}
                        checked={checked}
                        onChange={() => toggleObjective(obj.id)}
                        style={{ accentColor: '#2563EB' }}
                      />
                      <span>{obj.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description / Content */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="lesson-description"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Descrição & Plano da Aula
            </label>
            <textarea
              id="lesson-description"
              data-testid="lesson-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que será ensinado e praticado hoje..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Materials & Homework */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <div>
              <label
                htmlFor="lesson-materials"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Materiais / Livros
              </label>
              <input
                id="lesson-materials"
                data-testid="lesson-materials-input"
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Ex: Livro Cap. 4, Caderno, Lápis"
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
                htmlFor="lesson-homework"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Tarefa / Prática
              </label>
              <input
                id="lesson-homework"
                data-testid="lesson-homework-input"
                type="text"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="Ex: Exercícios 1 ao 5 na pág 42"
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

          {/* Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="lesson-notes"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Observações Pedagógicas (Opcional)
            </label>
            <textarea
              id="lesson-notes"
              data-testid="lesson-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adaptações, dicas para o educador..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Actions */}
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
              data-testid="save-lesson-btn"
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
              {loading ? 'Salvando...' : 'Salvar Lição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
