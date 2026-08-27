'use client';

import React from 'react';
import type {
  LearningRecordResponseDto,
  MasteryLevel,
  AssessmentMethod,
  LearningRecordType,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface RecordCardProps {
  record: LearningRecordResponseDto;
  onEdit?: (record: LearningRecordResponseDto) => void;
  onDelete?: (recordId: string) => void;
  onAddEvidence?: (record: LearningRecordResponseDto) => void;
}

export const MASTERY_CONFIG: Record<
  MasteryLevel,
  { label: string; bg: string; text: string; icon: string }
> = {
  NOT_STARTED: { label: 'Não Iniciado', bg: '#F3F4F6', text: '#4B5563', icon: '⏳' },
  EXPOSURE: { label: 'Exposição', bg: '#FEF3C7', text: '#92400E', icon: '🌱' },
  DEVELOPING: { label: 'Em Desenvolvimento', bg: '#DBEAFE', text: '#1E40AF', icon: '🌿' },
  WITH_ASSISTANCE: { label: 'Com Assistência', bg: '#E0E7FF', text: '#3730A3', icon: '🤝' },
  AUTONOMOUS: { label: 'Autônomo', bg: '#D1FAE5', text: '#065F46', icon: '✨' },
  MASTERED: { label: 'Dominado', bg: '#ECFDF5', text: '#047857', icon: '🏆' },
};

export const ASSESSMENT_LABELS: Record<AssessmentMethod, string> = {
  OBSERVATION: 'Observação Direta',
  NARRATION: 'Narração Oral',
  EXERCISE: 'Exercício Prático',
  WRITING: 'Redação / Composição',
  PROJECT: 'Projeto Autoral',
  EXPERIMENT: 'Experimento Científico',
  PRESENTATION: 'Apresentação Oral',
  TEST: 'Avaliação Escrita',
  SELF_ASSESSMENT: 'Autoavaliação',
  PRACTICAL_DEMONSTRATION: 'Demonstração Prática',
};

export const RECORD_TYPE_LABELS: Record<LearningRecordType, { label: string; icon: string }> = {
  PLANNED_LESSON: { label: 'Lição Planejada', icon: '📖' },
  SPONTANEOUS_EXPERIENCE: { label: 'Experiência Espontânea', icon: '💡' },
  PROJECT_WORK: { label: 'Trabalho em Projeto', icon: '🛠️' },
  READING_LOG: { label: 'Registro de Leitura', icon: '📚' },
  HABIT_PRACTICE: { label: 'Prática de Hábito', icon: '🕊️' },
};

export function RecordCard({ record, onEdit, onDelete, onAddEvidence }: RecordCardProps) {
  const mastery = MASTERY_CONFIG[record.masteryLevel] || MASTERY_CONFIG.DEVELOPING;
  const assessmentLabel = ASSESSMENT_LABELS[record.assessmentMethod] || record.assessmentMethod;
  const recordType = RECORD_TYPE_LABELS[record.type] || { label: record.type, icon: '📝' };

  return (
    <article
      data-testid={`record-card-${record.id}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header: Type, Subject badge, Mastery badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            data-testid={`record-type-badge-${record.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
            }}
          >
            <span>{recordType.icon}</span> {recordType.label}
          </span>

          {record.subjectName && (
            <span
              data-testid={`record-subject-badge-${record.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: record.subjectColor ? `${record.subjectColor}15` : '#EEF2FF',
                color: record.subjectColor || '#4F46E5',
                border: `1px solid ${record.subjectColor ? `${record.subjectColor}40` : '#C7D2FE'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
              }}
            >
              📚 {record.subjectName}
            </span>
          )}

          {record.learnerName && (
            <span
              data-testid={`record-learner-badge-${record.id}`}
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
              }}
            >
              🎓 {record.learnerName}
            </span>
          )}
        </div>

        {/* Mastery Badge */}
        <span
          data-testid={`mastery-badge-${record.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: mastery.bg,
            color: mastery.text,
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            border: `1px solid ${mastery.text}30`,
          }}
        >
          <span>{mastery.icon}</span>
          {mastery.label}
        </span>
      </div>

      {/* Main Title & Description */}
      <div>
        <h3
          data-testid={`record-title-${record.id}`}
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 0.375rem 0',
          }}
        >
          {record.title}
        </h3>
        {record.description && (
          <p
            data-testid={`record-description-${record.id}`}
            style={{
              fontSize: '0.875rem',
              color: '#4B5563',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {record.description}
          </p>
        )}
      </div>

      {/* Date, Duration & Assessment Method */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: '#6B7280',
          flexWrap: 'wrap',
        }}
      >
        <span data-testid={`record-date-${record.id}`}>📅 {record.date}</span>
        {record.durationMinutes && (
          <span data-testid={`record-duration-${record.id}`}>⏱️ {record.durationMinutes} min</span>
        )}
        <span
          data-testid={`assessment-method-badge-${record.id}`}
          style={{
            backgroundColor: '#F8FAFC',
            color: '#334155',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #E2E8F0',
            fontWeight: 500,
          }}
        >
          🔍 Avaliação: {assessmentLabel}
        </span>
      </div>

      {/* Strengths & Areas for Growth */}
      {(record.strengths || record.areasForGrowth) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            backgroundColor: '#F9FAFB',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
          }}
        >
          {record.strengths && (
            <div data-testid={`record-strengths-${record.id}`}>
              <strong style={{ color: '#065F46', display: 'block', marginBottom: '0.25rem' }}>
                🌟 Pontos Fortes:
              </strong>
              <span style={{ color: '#374151' }}>{record.strengths}</span>
            </div>
          )}
          {record.areasForGrowth && (
            <div data-testid={`record-growth-${record.id}`}>
              <strong style={{ color: '#92400E', display: 'block', marginBottom: '0.25rem' }}>
                🌱 Áreas para Crescimento:
              </strong>
              <span style={{ color: '#374151' }}>{record.areasForGrowth}</span>
            </div>
          )}
        </div>
      )}

      {/* Character Habit Growth */}
      {record.characterHabitGrowth && (
        <div
          data-testid={`character-habit-growth-${record.id}`}
          style={{
            backgroundColor: '#FDF4FF',
            border: '1px solid #F5D0FE',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: '#701A75',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
            🕊️ Crescimento em Caráter & Hábitos:
          </strong>
          <span>{record.characterHabitGrowth}</span>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div
          data-testid={`record-notes-${record.id}`}
          style={{
            backgroundColor: '#FEFCE8',
            border: '1px solid #FEF08A',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: '#713F12',
          }}
        >
          <strong>💬 Observações:</strong> {record.notes}
        </div>
      )}

      {/* Attached Objectives */}
      {record.objectives && record.objectives.length > 0 && (
        <div data-testid={`record-objectives-container-${record.id}`} style={{ marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '0.375rem' }}>
            🎯 Objetivos Vinculados:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {record.objectives.map((obj) => (
              <span
                key={obj.id}
                data-testid={`attached-objective-${obj.id}`}
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: '0.375rem',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {obj.objectiveTitle || 'Objetivo de Aprendizagem'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions / Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {record.portfolioItemIds && record.portfolioItemIds.length > 0 && (
            <span
              data-testid={`record-evidence-count-${record.id}`}
              style={{
                fontSize: '0.75rem',
                color: '#4B5563',
                backgroundColor: '#F3F4F6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontWeight: 500,
              }}
            >
              📎 {record.portfolioItemIds.length} evidência(s)
            </span>
          )}
          {onAddEvidence && (
            <Can action="upload_portfolio_items">
              <button
                type="button"
                data-testid={`add-evidence-btn-${record.id}`}
                onClick={() => onAddEvidence(record)}
                style={{
                  background: 'none',
                  border: '1px dashed #9CA3AF',
                  borderRadius: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: '#4B5563',
                  cursor: 'pointer',
                }}
              >
                + Anexar Evidência
              </button>
            </Can>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onEdit && (
            <Can action="log_learning">
              <button
                type="button"
                data-testid={`edit-record-btn-${record.id}`}
                onClick={() => onEdit(record)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                Editar
              </button>
            </Can>
          )}
          {onDelete && (
            <Can action="delete_learners">
              <button
                type="button"
                data-testid={`delete-record-btn-${record.id}`}
                onClick={() => onDelete(record.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                Excluir
              </button>
            </Can>
          )}
        </div>
      </div>
    </article>
  );
}
