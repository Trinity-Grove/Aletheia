'use client';

import React from 'react';
import { AletheiaIcon, Badge, Button, IconButton } from '@aletheia/ui';
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
  { label: string; bg: string; text: string; icon: React.ReactNode; badgeVariant: 'slate' | 'amber' | 'indigo' | 'emerald' }
> = {
  NOT_STARTED: { label: 'Não Iniciado', bg: 'var(--sage-soft)', text: 'var(--text-secondary)', icon: <AletheiaIcon name="clock" size={14} />, badgeVariant: 'slate' },
  EXPOSURE: { label: 'Exposição', bg: 'var(--color-amber-50)', text: 'var(--color-amber-700)', icon: <AletheiaIcon name="sprout" size={14} />, badgeVariant: 'amber' },
  DEVELOPING: { label: 'Em Desenvolvimento', bg: 'var(--color-indigo-50)', text: 'var(--color-indigo-700)', icon: <AletheiaIcon name="trending-up" size={14} />, badgeVariant: 'indigo' },
  WITH_ASSISTANCE: { label: 'Com Assistência', bg: 'var(--color-indigo-100)', text: 'var(--color-indigo-700)', icon: <AletheiaIcon name="heart" size={14} />, badgeVariant: 'indigo' },
  AUTONOMOUS: { label: 'Autônomo', bg: 'var(--color-emerald-100)', text: 'var(--color-emerald-700)', icon: <AletheiaIcon name="sparkles" size={14} />, badgeVariant: 'emerald' },
  MASTERED: { label: 'Dominado', bg: 'var(--color-emerald-50)', text: 'var(--color-emerald-700)', icon: <AletheiaIcon name="sparkles" size={14} />, badgeVariant: 'emerald' },
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

export const RECORD_TYPE_LABELS: Record<LearningRecordType, { label: string; icon: React.ReactNode }> = {
  PLANNED_LESSON: { label: 'Lição Planejada', icon: <AletheiaIcon name="book-open" size={14} /> },
  SPONTANEOUS_EXPERIENCE: { label: 'Experiência Espontânea', icon: <AletheiaIcon name="lightbulb" size={14} /> },
  PROJECT_WORK: { label: 'Trabalho em Projeto', icon: <AletheiaIcon name="folder" size={14} /> },
  READING_LOG: { label: 'Registro de Leitura', icon: <AletheiaIcon name="file-text" size={14} /> },
  HABIT_PRACTICE: { label: 'Prática de Hábito', icon: <AletheiaIcon name="heart" size={14} /> },
};

export function RecordCard({ record, onEdit, onDelete, onAddEvidence }: RecordCardProps) {
  const mastery = MASTERY_CONFIG[record.masteryLevel] || MASTERY_CONFIG.DEVELOPING;
  const assessmentLabel = ASSESSMENT_LABELS[record.assessmentMethod] || record.assessmentMethod;
  const recordType = RECORD_TYPE_LABELS[record.type] || { label: record.type, icon: <AletheiaIcon name="file-text" size={14} /> };

  return (
    <article
      data-testid={`record-card-${record.id}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
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
          <Badge data-testid={`record-type-badge-${record.id}`} variant="slate" size="sm">
            {recordType.icon} {recordType.label}
          </Badge>

          {record.subjectName && (
            <span
              data-testid={`record-subject-badge-${record.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: record.subjectColor ? `${record.subjectColor}15` : 'var(--color-indigo-50)',
                color: record.subjectColor || 'var(--color-indigo-600)',
                border: `1px solid ${record.subjectColor ? `${record.subjectColor}40` : 'var(--color-indigo-100)'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <AletheiaIcon name="book-open" size={12} />
              <span>{record.subjectName}</span>
            </span>
          )}

          {record.learnerName && (
            <Badge data-testid={`record-learner-badge-${record.id}`} variant="amber" size="sm">
              <AletheiaIcon name="graduation-cap" size={12} />
              <span>{record.learnerName}</span>
            </Badge>
          )}
        </div>

        {/* Mastery Badge */}
        <Badge data-testid={`mastery-badge-${record.id}`} variant={mastery.badgeVariant}>
          {mastery.icon}
          {mastery.label}
        </Badge>
      </div>

      {/* Main Title & Description */}
      <div>
        <h3
          data-testid={`record-title-${record.id}`}
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
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
              color: 'var(--text-secondary)',
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
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} data-testid={`record-date-${record.id}`}>
          <AletheiaIcon name="calendar" size={12} /> {record.date}
        </span>
        {record.durationMinutes && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} data-testid={`record-duration-${record.id}`}>
            <AletheiaIcon name="clock" size={12} /> {record.durationMinutes} min
          </span>
        )}
        <Badge data-testid={`assessment-method-badge-${record.id}`} variant="slate" size="sm">
          <AletheiaIcon name="search" size={12} />
          <span>Avaliação: {assessmentLabel}</span>
        </Badge>
      </div>

      {/* Strengths & Areas for Growth */}
      {(record.strengths || record.areasForGrowth) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            backgroundColor: 'var(--sage-soft)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
          }}
        >
          {record.strengths && (
            <div data-testid={`record-strengths-${record.id}`}>
              <strong style={{ color: 'var(--color-emerald-700)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <AletheiaIcon name="sparkles" size={14} />
                <span>Pontos Fortes:</span>
              </strong>
              <span style={{ color: 'var(--text-secondary)' }}>{record.strengths}</span>
            </div>
          )}
          {record.areasForGrowth && (
            <div data-testid={`record-growth-${record.id}`}>
              <strong style={{ color: 'var(--color-amber-700)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <AletheiaIcon name="sprout" size={14} />
                <span>Áreas para Crescimento:</span>
              </strong>
              <span style={{ color: 'var(--text-secondary)' }}>{record.areasForGrowth}</span>
            </div>
          )}
        </div>
      )}

      {/* Character Habit Growth */}
      {record.characterHabitGrowth && (
        <div
          data-testid={`character-habit-growth-${record.id}`}
          style={{
            backgroundColor: 'var(--color-indigo-50)',
            border: '1px solid var(--color-indigo-100)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--color-indigo-700)',
          }}
        >
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.2rem' }}>
            <AletheiaIcon name="heart" size={14} />
            <span>Crescimento em Caráter & Hábitos:</span>
          </strong>
          <span>{record.characterHabitGrowth}</span>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div
          data-testid={`record-notes-${record.id}`}
          style={{
            backgroundColor: 'var(--color-amber-50)',
            border: '1px solid var(--color-amber-100)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--color-amber-700)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.375rem',
          }}
        >
          <AletheiaIcon name="file-text" size={14} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
          <div>
            <strong>Observações:</strong> {record.notes}
          </div>
        </div>
      )}

      {/* Attached Objectives */}
      {record.objectives && record.objectives.length > 0 && (
        <div data-testid={`record-objectives-container-${record.id}`} style={{ marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <AletheiaIcon name="sparkles" size={14} />
            <span>Objetivos Vinculados:</span>
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {record.objectives.map((obj) => (
              <Badge key={obj.id} data-testid={`attached-objective-${obj.id}`} variant="indigo" size="sm">
                {obj.objectiveTitle || 'Objetivo de Aprendizagem'}
              </Badge>
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
          borderTop: '1px solid var(--sage-soft)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {record.portfolioItemIds && record.portfolioItemIds.length > 0 && (
            <Badge data-testid={`record-evidence-count-${record.id}`} variant="slate" size="sm">
              <AletheiaIcon name="paperclip" size={12} />
              <span>{record.portfolioItemIds.length} evidência(s)</span>
            </Badge>
          )}
          {onAddEvidence && (
            <Can action="upload_portfolio_items">
              <Button
                variant="outline"
                size="sm"
                data-testid={`add-evidence-btn-${record.id}`}
                onClick={() => onAddEvidence(record)}
                leftIcon={<AletheiaIcon name="plus" size={12} />}
              >
                Evidência
              </Button>
            </Can>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {onEdit && (
            <Can action="log_learning">
              <Button
                variant="secondary"
                size="sm"
                data-testid={`edit-record-btn-${record.id}`}
                onClick={() => onEdit(record)}
                leftIcon={<AletheiaIcon name="pencil" size={12} />}
              >
                Editar
              </Button>
            </Can>
          )}
          {onDelete && (
            <Can action="delete_learners">
              <IconButton
                size="sm"
                data-testid={`delete-record-btn-${record.id}`}
                onClick={() => onDelete(record.id)}
                aria-label="Excluir registro"
              >
                <AletheiaIcon name="trash" size={12} />
              </IconButton>
            </Can>
          )}
        </div>
      </div>
    </article>
  );
}
