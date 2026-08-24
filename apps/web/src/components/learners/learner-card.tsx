'use client';

import React from 'react';
import type { EducationalStage, LearnerResponseDto } from '@aletheia/contracts';

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

export function LearnerCard({ learner, onEdit, onToggleArchive }: LearnerCardProps) {
  const isArchived = Boolean(learner.archivedAt);
  const displayName = learner.preferredName || learner.firstName;
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  const avatarBg = learner.avatarColor || '#4F46E5';

  return (
    <div
      className={`learner-card ${isArchived ? 'learner-card-archived' : ''}`}
      data-testid={`learner-card-${learner.id}`}
      style={{
        border: '1px solid var(--border-color, #E5E7EB)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        backgroundColor: isArchived ? '#F9FAFB' : '#FFFFFF',
        opacity: isArchived ? 0.75 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          data-testid="learner-avatar"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: avatarBg,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.125rem',
          }}
        >
          {initial}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{displayName}</h3>
          {learner.lastName && (
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {learner.firstName} {learner.lastName}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8125rem' }}>
        <span
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            backgroundColor: '#EEF2FF',
            color: '#4338CA',
            fontWeight: 500,
          }}
        >
          {stageLabels[learner.stage] || learner.stage}
        </span>

        {learner.customGrade && (
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            {learner.customGrade}
          </span>
        )}

        {learner.birthDate && (
          <span style={{ color: '#6B7280', alignSelf: 'center' }}>
            Nascimento: {learner.birthDate}
          </span>
        )}
      </div>

      {learner.specialNeeds && (
        <div style={{ fontSize: '0.875rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '0.375rem 0.5rem', borderRadius: '0.375rem' }}>
          <strong>Necessidades:</strong> {learner.specialNeeds}
        </div>
      )}

      {learner.notes && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#4B5563' }}>
          {learner.notes}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => onEdit?.(learner)}
          className="btn btn-secondary"
          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => onToggleArchive?.(learner)}
          className={`btn ${isArchived ? 'btn-success' : 'btn-outline-danger'}`}
          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
        >
          {isArchived ? 'Reativar' : 'Arquivar'}
        </button>
      </div>
    </div>
  );
}
