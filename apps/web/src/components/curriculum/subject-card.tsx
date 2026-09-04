'use client';

import React from 'react';
import { AletheiaIcon, Badge, Button, Card, IconButton } from '@aletheia/ui';
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

  const getStatusBadge = (status: ObjectiveStatus): { label: string; variant: 'emerald' | 'amber' | 'slate'; icon: React.ReactNode } => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Concluído', variant: 'emerald', icon: <AletheiaIcon name="check-circle-2" size={12} /> };
      case 'IN_PROGRESS':
        return { label: 'Em Andamento', variant: 'amber', icon: <AletheiaIcon name="clock" size={12} /> };
      case 'NOT_STARTED':
      default:
        return { label: 'Não Iniciado', variant: 'slate', icon: <AletheiaIcon name="circle" size={12} /> };
    }
  };

  return (
    <Card
      data-testid={`subject-card-${subject.id}`}
      style={{
        borderLeft: `5px solid ${subjectColor}`,
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
                // Tint the chip itself with the subject's own color, not just
                // the icon glyph — gives each discipline a distinct identity
                // at a glance instead of every chip looking the same.
                backgroundColor: subject.color
                  ? `color-mix(in srgb, ${subject.color} 16%, white)`
                  : 'var(--sage-soft)',
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

          <Badge
            data-testid={`subject-count-badge-${subject.id}`}
            variant={percent === 100 ? 'emerald' : 'slate'}
          >
            {achieved}/{total} ({percent}%)
          </Badge>
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
                    className={`ui-badge ui-badge--${badge.variant} ui-badge--sm`}
                    style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>{badge.icon}</span> {badge.label}
                  </button>

                  <Can action="manage_curriculum">
                    <IconButton
                      size="sm"
                      data-testid={`delete-objective-btn-${obj.id}`}
                      onClick={() => onDeleteObjective(obj.id)}
                      aria-label="Excluir objetivo"
                    >
                      <AletheiaIcon name="x" size={14} />
                    </IconButton>
                  </Can>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Add Objective button wrapped in RBAC */}
      <Can action="manage_curriculum">
        <Button
          variant="outline"
          size="sm"
          data-testid={`add-objective-btn-${subject.id}`}
          onClick={() => onAddObjective(subject.id)}
          style={{ width: '100%', marginTop: 'auto' }}
        >
          + Adicionar Objetivo
        </Button>
      </Can>
    </Card>
  );
}
