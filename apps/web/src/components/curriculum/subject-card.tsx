'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { ObjectiveResponseDto, ObjectiveStatus, SubjectResponseDto } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface SubjectCardProps {
  subject: SubjectResponseDto;
  objectives: ObjectiveResponseDto[];
  onAddObjective: (subjectId: string) => void;
  onToggleStatus: (objectiveId: string, nextStatus: ObjectiveStatus) => void;
  onDeleteObjective: (objectiveId: string) => void;
}

export function SubjectCard({
  subject,
  objectives,
  onAddObjective,
  onToggleStatus,
  onDeleteObjective,
}: SubjectCardProps) {
  const total = objectives.length;
  const achieved = objectives.filter((o) => o.status === 'ACHIEVED').length;
  const percent = total > 0 ? Math.round((achieved / total) * 100) : 0;
  const subjectColor = subject.color || 'var(--color-indigo-600)';

  const cycleStatus = (status: ObjectiveStatus): ObjectiveStatus => {
    if (status === 'NOT_STARTED') return 'IN_PROGRESS';
    if (status === 'IN_PROGRESS') return 'ACHIEVED';
    return 'NOT_STARTED';
  };

  const getStatusBadge = (status: ObjectiveStatus) => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Concluído', bg: 'var(--color-emerald-50)', text: 'var(--color-emerald-700)', border: 'var(--color-emerald-100)', icon: <AletheiaIcon name="check-circle-2" size={12} /> };
      case 'IN_PROGRESS':
        return { label: 'Em Andamento', bg: 'var(--color-amber-50)', text: 'var(--color-amber-700)', border: 'var(--color-amber-100)', icon: <AletheiaIcon name="clock" size={12} /> };
      case 'NOT_STARTED':
      default:
        return { label: 'Não Iniciado', bg: 'var(--sage-soft)', text: 'var(--text-secondary)', border: 'var(--border-light)', icon: <AletheiaIcon name="circle" size={12} /> };
    }
  };

  return (
    <div
      data-testid={`subject-card-${subject.id}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        borderLeft: `5px solid ${subjectColor}`,
        boxShadow: 'var(--shadow-sm)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
      }}
    >
      {/* Header: Title, Description, Objective count badge */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--sage-soft)',
                color: subjectColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AletheiaIcon name="book-open" size={16} />
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {subject.name}
            </h3>
          </div>

          <span
            data-testid={`subject-count-badge-${subject.id}`}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: percent === 100 ? 'var(--color-emerald-50)' : 'var(--sage-soft)',
              color: percent === 100 ? 'var(--color-emerald-700)' : 'var(--text-secondary)',
              border: percent === 100 ? '1px solid var(--color-emerald-100)' : '1px solid var(--border-light)',
            }}
          >
            {achieved}/{total} ({percent}%)
          </span>
        </div>

        {subject.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.375rem 0 0 0', lineHeight: 1.4 }}>
            {subject.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--sage-soft)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          data-testid="subject-progress-bar"
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: subjectColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Objectives Tree / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {objectives.length === 0 ? (
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              padding: '0.75rem 0',
              textAlign: 'center',
              backgroundColor: 'var(--sage-soft)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-light)',
            }}
          >
            Nenhum objetivo cadastrado nesta disciplina.
          </div>
        ) : (
          objectives.map((obj) => {
            const badge = getStatusBadge(obj.status);
            return (
              <div
                key={obj.id}
                data-testid={`objective-item-${obj.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: obj.status === 'ACHIEVED' ? 'var(--sage-soft)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.8125rem',
                  gap: '0.5rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        obj.status === 'ACHIEVED'
                          ? 'var(--color-emerald-600)'
                          : obj.status === 'IN_PROGRESS'
                          ? 'var(--color-amber-600)'
                          : 'var(--border-medium)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: obj.status === 'ACHIEVED' ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: obj.status === 'ACHIEVED' ? 'line-through' : 'none',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {obj.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    data-testid={`status-toggle-btn-${obj.id}`}
                    onClick={() => onToggleStatus(obj.id, cycleStatus(obj.status))}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${badge.border}`,
                      backgroundColor: badge.bg,
                      color: badge.text,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>{badge.icon}</span> {badge.label}
                  </button>

                  <Can action="manage_curriculum">
                    <button
                      type="button"
                      data-testid={`delete-objective-btn-${obj.id}`}
                      onClick={() => onDeleteObjective(obj.id)}
                      title="Excluir objetivo"
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.25rem',
                      }}
                      aria-label="Excluir objetivo"
                    >
                      <AletheiaIcon name="x" size={14} />
                    </button>
                  </Can>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Add Objective button wrapped in RBAC */}
      <Can action="manage_curriculum">
        <button
          type="button"
          data-testid={`add-objective-btn-${subject.id}`}
          onClick={() => onAddObjective(subject.id)}
          className="btn ui-button ui-button--outline ui-button--sm"
          style={{
            width: '100%',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px dashed var(--border-medium)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'auto',
          }}
        >
          + Adicionar Objetivo
        </button>
      </Can>
    </div>
  );
}
