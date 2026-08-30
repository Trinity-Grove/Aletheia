'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { EducationalStage, LearnerResponseDto } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface LearnerCardProps {
  learner: LearnerResponseDto;
  onEdit?: ((learner: LearnerResponseDto) => void) | undefined;
  onToggleArchive?: ((learner: LearnerResponseDto) => void) | undefined;
}

const stageLabels: Record<EducationalStage, string> = {
  EARLY_YEARS: 'Educação Infantil (Early Years)',
  PRIMARY_GRAMMAR: 'Ensino Fundamental I (Grammar)',
  MIDDLE_LOGIC: 'Ensino Fundamental II (Logic)',
  HIGH_RHETORIC: 'Ensino Médio (Rhetoric)',
  OTHER: 'Outro',
};

function calculateAge(birthDateStr?: string | null): string | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} anos` : 'Menos de 1 ano';
}

export function LearnerCard({ learner, onEdit, onToggleArchive }: LearnerCardProps) {
  const isArchived = Boolean(learner.archivedAt);
  const displayName = learner.preferredName || learner.firstName;
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  const avatarBg = learner.avatarColor || 'var(--color-indigo-600)';
  const age = calculateAge(learner.birthDate);

  return (
    <div
      className={`learner-card ${isArchived ? 'learner-card-archived' : ''}`}
      data-testid={`learner-card-${learner.id}`}
      style={{
        backgroundColor: isArchived ? 'var(--sage-soft)' : 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: isArchived ? '1.5px dashed var(--border-medium)' : '1px solid var(--border-light)',
        boxShadow: isArchived ? 'none' : 'var(--shadow-sm)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        opacity: isArchived ? 0.75 : 1,
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: avatarBg,
        }}
      />

      {/* Header: Avatar, Names, Archive badge if applicable */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            data-testid="learner-avatar"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: avatarBg,
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              border: '2px solid var(--bg-surface)',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {displayName}
            </h3>
            {learner.lastName && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block' }}>
                {learner.firstName} {learner.lastName}
              </span>
            )}
          </div>
        </div>

        {isArchived && (
          <span
            data-testid="learner-archived-chip"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--text-secondary)',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Arquivado
          </span>
        )}
      </div>

      {/* Badges and Stage Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {/* Stage Chip */}
        <span
          data-testid="learner-stage-chip"
          style={{
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-indigo-50)',
            color: 'var(--color-indigo-700)',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid var(--color-indigo-100)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <AletheiaIcon name="sprout" size={12} />
          <span>{stageLabels[learner.stage] || learner.stage}</span>
        </span>

        {/* Custom Grade Pill */}
        {learner.customGrade && (
          <span
            data-testid="learner-grade-pill"
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid var(--border-light)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <AletheiaIcon name="book-open" size={12} />
            <span>{learner.customGrade}</span>
          </span>
        )}

        {/* Age / BirthDate Pill */}
        {learner.birthDate && (
          <span
            data-testid="learner-age-pill"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              border: '1px solid var(--border-light)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <AletheiaIcon name="calendar" size={12} />
            <span>{age ? `${age} • ` : ''}Nascimento: {learner.birthDate}</span>
          </span>
        )}
      </div>

      {/* Special Needs Alert */}
      {learner.specialNeeds && (
        <div
          data-testid="learner-special-needs"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-amber-700)',
            backgroundColor: 'var(--color-amber-50)',
            border: '1px solid var(--color-amber-100)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.375rem',
          }}
        >
          <AletheiaIcon name="lightbulb" size={16} style={{ color: 'var(--color-amber-600)', flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <strong>Necessidades / Adaptações:</strong> {learner.specialNeeds}
          </div>
        </div>
      )}

      {/* Notes / Pedagogical Observations */}
      {learner.notes && (
        <div
          data-testid="learner-notes"
          style={{
            backgroundColor: 'var(--sage-soft)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
            <AletheiaIcon name="file-text" size={14} />
            <span>Observações:</span>
          </span>
          {learner.notes}
        </div>
      )}

      {/* Action Buttons wrapped in RBAC <Can> */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
          justifyContent: 'flex-end',
        }}
      >
        <Can action="manage_learners">
          <button
            type="button"
            data-testid={`edit-learner-btn-${learner.id}`}
            onClick={() => onEdit?.(learner)}
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
        </Can>

        <Can action="delete_learner">
          <button
            type="button"
            data-testid={`archive-learner-btn-${learner.id}`}
            onClick={() => onToggleArchive?.(learner)}
            className={`btn ${isArchived ? 'btn-success' : 'btn-outline-danger'} ui-button ui-button--sm`}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: isArchived ? '1px solid var(--color-emerald-600)' : '1px solid var(--color-rose-100)',
              backgroundColor: isArchived ? 'var(--color-emerald-50)' : 'var(--color-rose-50)',
              color: isArchived ? 'var(--color-emerald-700)' : 'var(--color-rose-600)',
              cursor: 'pointer',
            }}
          >
            {isArchived ? 'Reativar' : 'Arquivar'}
          </button>
        </Can>
      </div>
    </div>
  );
}
