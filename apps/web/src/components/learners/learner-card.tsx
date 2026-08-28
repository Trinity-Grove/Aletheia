'use client';

import React from 'react';
import {
  Sprout,
  BookOpen,
  Calendar,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
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
  const avatarBg = learner.avatarColor || '#4F46E5';
  const age = calculateAge(learner.birthDate);

  return (
    <div
      className={`learner-card ${isArchived ? 'learner-card-archived' : ''}`}
      data-testid={`learner-card-${learner.id}`}
      style={{
        backgroundColor: isArchived ? '#F8FAFC' : '#FFFFFF',
        borderRadius: '1rem',
        border: isArchived ? '1.5px dashed #CBD5E1' : '1px solid #E2E8F0',
        boxShadow: isArchived ? 'none' : '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
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
              borderRadius: '9999px',
              backgroundColor: avatarBg,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              boxShadow: `0 2px 8px ${avatarBg}40`,
              border: '2px solid #FFFFFF',
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
                color: '#0F172A',
                letterSpacing: '-0.01em',
              }}
            >
              {displayName}
            </h3>
            {learner.lastName && (
              <span style={{ fontSize: '0.875rem', color: '#64748B', display: 'block' }}>
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
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
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
            borderRadius: '9999px',
            backgroundColor: '#EEF2FF',
            color: '#4338CA',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid #E0E7FF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <Sprout size={12} />
          <span>{stageLabels[learner.stage] || learner.stage}</span>
        </span>

        {/* Custom Grade Pill */}
        {learner.customGrade && (
          <span
            data-testid="learner-grade-pill"
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #E2E8F0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <BookOpen size={12} />
            <span>{learner.customGrade}</span>
          </span>
        )}

        {/* Age / BirthDate Pill */}
        {learner.birthDate && (
          <span
            data-testid="learner-age-pill"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: '#F8FAFC',
              color: '#64748B',
              fontSize: '0.75rem',
              fontWeight: 500,
              border: '1px solid #E2E8F0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Calendar size={12} />
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
            color: '#92400E',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.375rem',
          }}
        >
          <Lightbulb size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '0.125rem' }} />
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
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            fontSize: '0.8125rem',
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
            <MessageSquare size={14} />
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
          borderTop: '1px solid #F1F5F9',
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
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
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
              borderRadius: '0.375rem',
              border: isArchived ? '1px solid #10B981' : '1px solid #FCA5A5',
              backgroundColor: isArchived ? '#ECFDF5' : '#FFF1F2',
              color: isArchived ? '#047857' : '#E11D48',
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
