'use client';

import React, { useEffect, useState } from 'react';
import type {
  CreateLearningRecordDto,
  LearningRecordResponseDto,
  LearnerSummaryDto,
  SubjectResponseDto,
  ObjectiveResponseDto,
  LearningRecordType,
  MasteryLevel,
  AssessmentMethod,
} from '@aletheia/contracts';
import { ASSESSMENT_LABELS, MASTERY_CONFIG, RECORD_TYPE_LABELS } from './record-card';

export interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateLearningRecordDto) => Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  objectives: ObjectiveResponseDto[];
  recordToEdit?: LearningRecordResponseDto | null | undefined;
  initialDate?: string;
  defaultLearnerId?: string | null | undefined;
}

export function RecordFormModal({
  isOpen,
  onClose,
  onSave,
  learners,
  subjects,
  objectives,
  recordToEdit,
  initialDate,
  defaultLearnerId,
}: RecordFormModalProps) {
  const [learnerId, setLearnerId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [type, setType] = useState<LearningRecordType>('PLANNED_LESSON');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]!);
  const [durationMinutes, setDurationMinutes] = useState<string>('45');
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>('DEVELOPING');
  const [assessmentMethod, setAssessmentMethod] = useState<AssessmentMethod>('OBSERVATION');
  const [strengths, setStrengths] = useState('');
  const [areasForGrowth, setAreasForGrowth] = useState('');
  const [characterHabitGrowth, setCharacterHabitGrowth] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordToEdit) {
      setLearnerId(recordToEdit.learnerId);
      setSubjectId(recordToEdit.subjectId || '');
      setType(recordToEdit.type);
      setTitle(recordToEdit.title);
      setDescription(recordToEdit.description || '');
      setDate(recordToEdit.date);
      setDurationMinutes(recordToEdit.durationMinutes ? String(recordToEdit.durationMinutes) : '');
      setMasteryLevel(recordToEdit.masteryLevel);
      setAssessmentMethod(recordToEdit.assessmentMethod);
      setStrengths(recordToEdit.strengths || '');
      setAreasForGrowth(recordToEdit.areasForGrowth || '');
      setCharacterHabitGrowth(recordToEdit.characterHabitGrowth || '');
      setNotes(recordToEdit.notes || '');
      setSelectedObjectiveIds(recordToEdit.objectives?.map((o) => o.objectiveId) || []);
    } else {
      const fallbackLearnerId = defaultLearnerId || (learners.length > 0 ? learners[0]!.id : '');
      setLearnerId(fallbackLearnerId);
      setSubjectId(subjects.length > 0 ? subjects[0]!.id : '');
      setType('PLANNED_LESSON');
      setTitle('');
      setDescription('');
      setDate(initialDate || new Date().toISOString().split('T')[0]!);
      setDurationMinutes('45');
      setMasteryLevel('DEVELOPING');
      setAssessmentMethod('OBSERVATION');
      setStrengths('');
      setAreasForGrowth('');
      setCharacterHabitGrowth('');
      setNotes('');
      setSelectedObjectiveIds([]);
    }
    setError(null);
  }, [recordToEdit, isOpen, initialDate, defaultLearnerId, learners, subjects]);

  if (!isOpen) return null;

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredObjectives = objectives.filter(
    (obj) => (!learnerId || obj.learnerId === learnerId) && (!subjectId || obj.subjectId === subjectId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) {
      setError('Selecione um educando.');
      return;
    }
    if (!title.trim()) {
      setError('Informe o título do registro de aprendizagem.');
      return;
    }
    if (!date) {
      setError('Informe a data.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : undefined;

      const dto: CreateLearningRecordDto = {
        learnerId,
        subjectId: subjectId || undefined,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        durationMinutes: Number.isNaN(parsedDuration) ? undefined : parsedDuration,
        masteryLevel,
        assessmentMethod,
        strengths: strengths.trim() || undefined,
        areasForGrowth: areasForGrowth.trim() || undefined,
        characterHabitGrowth: characterHabitGrowth.trim() || undefined,
        notes: notes.trim() || undefined,
        objectiveIds: selectedObjectiveIds,
      };

      await onSave(dto);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar registro';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="record-form-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            {recordToEdit ? 'Editar Registro de Aprendizagem' : 'Novo Registro de Aprendizagem'}
          </h2>
          <button
            type="button"
            data-testid="close-record-modal-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {error && (
            <div
              data-testid="record-form-error"
              style={{
                padding: '0.75rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: '0.375rem',
                color: '#991B1B',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Learner & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="record-learner-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Educando *
              </label>
              <select
                id="record-learner-select"
                data-testid="record-learner-select"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Selecione um educando</option>
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    🎓 {l.preferredName || l.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="record-type-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Tipo de Registro *
              </label>
              <select
                id="record-type-select"
                data-testid="record-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as LearningRecordType)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              >
                {Object.entries(RECORD_TYPE_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="record-title-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Título / Assunto *
            </label>
            <input
              id="record-title-input"
              type="text"
              data-testid="record-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Leitura comentada e narração sobre Roma Antiga"
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Subject & Date & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="record-subject-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Disciplina / Matéria
              </label>
              <select
                id="record-subject-select"
                data-testid="record-subject-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Sem disciplina vinculada</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    📚 {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="record-date-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Data *
              </label>
              <input
                id="record-date-input"
                type="date"
                data-testid="record-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="record-duration-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Duração (min)
              </label>
              <input
                id="record-duration-input"
                type="number"
                data-testid="record-duration-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                max="1440"
                placeholder="45"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="record-description-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              Descrição da Atividade
            </label>
            <textarea
              id="record-description-input"
              data-testid="record-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="O que foi estudado ou vivenciado..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Mastery Level & Assessment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="record-mastery-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Nível de Domínio (Mastery) *
              </label>
              <select
                id="record-mastery-select"
                data-testid="record-mastery-select"
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              >
                {Object.entries(MASTERY_CONFIG).map(([lvl, conf]) => (
                  <option key={lvl} value={lvl}>
                    {conf.icon} {conf.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="record-assessment-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
              >
                Método de Avaliação *
              </label>
              <select
                id="record-assessment-select"
                data-testid="record-assessment-select"
                value={assessmentMethod}
                onChange={(e) => setAssessmentMethod(e.target.value as AssessmentMethod)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              >
                {Object.entries(ASSESSMENT_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qualitative Insights: Strengths & Growth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="record-strengths-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#065F46', marginBottom: '0.25rem' }}
              >
                🌟 Pontos Fortes Observados
              </label>
              <textarea
                id="record-strengths-input"
                data-testid="record-strengths-input"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={2}
                placeholder="Facilidade de memorização, atenção aos detalhes..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="record-growth-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#92400E', marginBottom: '0.25rem' }}
              >
                🌱 Oportunidades de Crescimento
              </label>
              <textarea
                id="record-growth-input"
                data-testid="record-growth-input"
                value={areasForGrowth}
                onChange={(e) => setAreasForGrowth(e.target.value)}
                rows={2}
                placeholder="Revisar pronúncia, manter concentração por mais tempo..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          {/* Character & Habit Growth */}
          <div>
            <label
              htmlFor="record-habit-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#701A75', marginBottom: '0.25rem' }}
            >
              🕊️ Crescimento em Caráter & Hábitos
            </label>
            <input
              id="record-habit-input"
              type="text"
              data-testid="record-habit-input"
              value={characterHabitGrowth}
              onChange={(e) => setCharacterHabitGrowth(e.target.value)}
              placeholder="Ex: Demonstrou paciência e diligência ao refazer o exercício"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Objectives Checkboxes */}
          {filteredObjectives.length > 0 && (
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                🎯 Vincular Objetivos do Currículo
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                }}
              >
                {filteredObjectives.map((obj) => (
                  <label
                    key={obj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`record-objective-checkbox-${obj.id}`}
                      checked={selectedObjectiveIds.includes(obj.id)}
                      onChange={() => toggleObjective(obj.id)}
                    />
                    <span>{obj.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              htmlFor="record-notes-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}
            >
              💬 Observações Gerais / Diário dos Pais
            </label>
            <textarea
              id="record-notes-input"
              data-testid="record-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anotações internas, contexto familiar ou impressões..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E5E7EB',
            }}
          >
            <button
              type="button"
              data-testid="cancel-record-btn"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="save-record-btn"
              disabled={submitting}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Salvando...' : recordToEdit ? 'Salvar Alterações' : 'Salvar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
