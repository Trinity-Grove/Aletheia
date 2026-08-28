'use client';

import React from 'react';
import { CheckCircle2, Clock, Circle, BookOpen, X } from 'lucide-react';
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
  const subjectColor = subject.color || '#4F46E5';

  const cycleStatus = (status: ObjectiveStatus): ObjectiveStatus => {
    if (status === 'NOT_STARTED') return 'IN_PROGRESS';
    if (status === 'IN_PROGRESS') return 'ACHIEVED';
    return 'NOT_STARTED';
  };

  const getStatusBadge = (status: ObjectiveStatus) => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Concluído', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: <CheckCircle2 size={12} /> };
      case 'IN_PROGRESS':
        return { label: 'Em Andamento', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: <Clock size={12} /> };
      case 'NOT_STARTED':
      default:
        return { label: 'Não Iniciado', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', icon: <Circle size={12} /> };
    }
  };

  return (
    <div
      data-testid={`subject-card-${subject.id}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        borderLeft: `5px solid ${subjectColor}`,
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
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
                borderRadius: '0.375rem',
                backgroundColor: `${subjectColor}18`,
                color: subjectColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} />
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {subject.name}
            </h3>
          </div>

          <span
            data-testid={`subject-count-badge-${subject.id}`}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: percent === 100 ? '#ECFDF5' : '#F1F5F9',
              color: percent === 100 ? '#047857' : '#475569',
              border: percent === 100 ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
            }}
          >
            {achieved}/{total} ({percent}%)
          </span>
        </div>

        {subject.description && (
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.375rem 0 0 0', lineHeight: 1.4 }}>
            {subject.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#F1F5F9',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          data-testid="subject-progress-bar"
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: subjectColor,
            borderRadius: '9999px',
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
              color: '#94A3B8',
              fontStyle: 'italic',
              padding: '0.75rem 0',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '0.5rem',
              border: '1px dashed #E2E8F0',
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
                  borderRadius: '0.5rem',
                  backgroundColor: obj.status === 'ACHIEVED' ? '#F8FAFC' : '#FFFFFF',
                  border: '1px solid #E2E8F0',
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
                          ? '#10B981'
                          : obj.status === 'IN_PROGRESS'
                          ? '#F59E0B'
                          : '#CBD5E1',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: obj.status === 'ACHIEVED' ? '#64748B' : '#1E293B',
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
                      borderRadius: '9999px',
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
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.25rem',
                      }}
                      aria-label="Excluir objetivo"
                    >
                      <X size={14} />
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
            borderRadius: '0.5rem',
            border: '1.5px dashed #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#475569',
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
