'use client';

import React from 'react';
import type { DailyAgendaDto, DailyAgendaItemDto, LearnerSummaryDto } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface DailyAgendaViewProps {
  agenda: DailyAgendaDto;
  selectedDate: string;
  learners: LearnerSummaryDto[];
  activeLearnerId?: string | null;
  onDateChange: (date: string) => void;
  onOpenCreateLesson: () => void;
  onOpenCreateSlot: () => void;
  onOpenCompleteLesson: (item: DailyAgendaItemDto) => void;
  onOpenRescheduleLesson: (item: DailyAgendaItemDto) => void;
  onQuickToggleComplete?: (item: DailyAgendaItemDto) => Promise<void>;
  onDeleteLesson?: (lessonId: string) => Promise<void>;
  onDeleteSlot?: (slotId: string) => Promise<void>;
}

export function DailyAgendaView({
  agenda,
  selectedDate,
  learners,
  activeLearnerId: _activeLearnerId,
  onDateChange,
  onOpenCreateLesson,
  onOpenCreateSlot,
  onOpenCompleteLesson,
  onOpenRescheduleLesson,
  onQuickToggleComplete,
  onDeleteLesson,
  onDeleteSlot,
}: DailyAgendaViewProps) {
  const handleShiftDate = (days: number) => {
    const parts = selectedDate.split('-');
    const year = Number(parts[0]) || 2026;
    const month = Number(parts[1]) || 1;
    const day = Number(parts[2]) || 1;
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  const totalItems = agenda?.items?.length || 0;
  const completedItems =
    agenda?.items?.filter((item) => item.isCompleted || item.status === 'COMPLETED').length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const learnerMap = new Map<string, string>();
  learners.forEach((l) => {
    learnerMap.set(l.id, l.preferredName || l.firstName);
  });

  return (
    <div
      data-testid="daily-agenda-view"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Date Navigation and Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={() => handleShiftDate(-1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            &larr; Ontem
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={handleToday}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#1E293B',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={() => handleShiftDate(1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Amanhã &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="date"
            data-testid="agenda-date-picker"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
            }}
          />
          <Can action="manage_lessons">
            <button
              type="button"
              data-testid="create-lesson-btn"
              onClick={onOpenCreateLesson}
              className="btn btn-primary ui-button ui-button--primary ui-button--sm"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#4338CA',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(67, 56, 202, 0.2)',
              }}
            >
              + Nova Lição
            </button>
          </Can>
          <Can action="manage_lessons">
            <button
              type="button"
              data-testid="create-slot-btn"
              onClick={onOpenCreateSlot}
              className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
              style={{
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Bloco de Rotina
            </button>
          </Can>
        </div>
      </div>

      {/* Progress & Completed Totals Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
            Progresso do Dia
          </span>
          <span
            data-testid="completed-totals-text"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4338CA' }}
          >
            {completedItems} de {totalItems} concluídos ({progressPercent}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#F1F5F9',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid="progress-bar-fill"
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#10B981' : '#4338CA',
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Items Checklist List */}
      {totalItems === 0 ? (
        <div
          data-testid="agenda-empty-state"
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px dashed #CBD5E1',
            borderRadius: '1rem',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '9999px',
              backgroundColor: '#EEF2FF',
              color: '#4338CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 12px rgba(67, 56, 202, 0.1)',
            }}
          >
            📅
          </div>
          <div>
            <p style={{ fontSize: '1.125rem', color: '#0F172A', marginBottom: '0.375rem', fontWeight: 700 }}>
              Nenhuma atividade ou lição planejada para esta data ({selectedDate}).
            </p>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '28rem', margin: '0 auto' }}>
              Planeje lições do currículo ou adicione blocos de rotina semanal para organizar o aprendizado da família.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <Can action="manage_lessons">
              <button
                type="button"
                onClick={onOpenCreateLesson}
                className="btn btn-primary ui-button ui-button--primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#4338CA',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(67, 56, 202, 0.2)',
                }}
              >
                Planejar Lição
              </button>
            </Can>
            <Can action="manage_lessons">
              <button
                type="button"
                onClick={onOpenCreateSlot}
                className="btn btn-secondary ui-button ui-button--secondary"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                }}
              >
                Criar Bloco de Rotina
              </button>
            </Can>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {agenda.items.map((item) => {
            const isCompleted = item.isCompleted || item.status === 'COMPLETED';
            const isRoutine = item.type === 'ROUTINE_SLOT';
            const itemColor = item.subjectColor || (isRoutine ? '#7E22CE' : '#4338CA');

            return (
              <div
                key={item.id}
                data-testid={`agenda-item-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isCompleted ? '#F8FAFC' : '#FFFFFF',
                  borderRadius: '0.875rem',
                  border: isCompleted ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
                  borderLeft: `4px solid ${itemColor}`,
                  padding: '1.125rem 1.25rem',
                  boxShadow: isCompleted ? 'none' : '0 2px 4px rgba(15, 23, 42, 0.04)',
                  opacity: isCompleted ? 0.8 : 1,
                  transition: 'all 0.2s ease',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left check and details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                  {/* Checkbox Toggle */}
                  <input
                    type="checkbox"
                    data-testid={`complete-toggle-btn-${item.id}`}
                    checked={isCompleted}
                    onChange={() => {
                      if (onQuickToggleComplete) {
                        onQuickToggleComplete(item);
                      } else if (!isCompleted) {
                        onOpenCompleteLesson(item);
                      }
                    }}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      accentColor: '#10B981',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Type Badge */}
                      <span
                        data-testid={`item-type-badge-${item.id}`}
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isRoutine ? '#FAF5FF' : '#EEF2FF',
                          color: isRoutine ? '#7E22CE' : '#4338CA',
                          border: isRoutine ? '1px solid #E9D5FF' : '1px solid #E0E7FF',
                        }}
                      >
                        {isRoutine ? 'Rotina' : 'Lição'}
                      </span>

                      {/* Subject Badge */}
                      {item.subjectName && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: item.subjectColor ? `${item.subjectColor}15` : '#F1F5F9',
                            color: item.subjectColor || '#334155',
                            border: `1px solid ${item.subjectColor ? `${item.subjectColor}30` : '#E2E8F0'}`,
                          }}
                        >
                          📚 {item.subjectName}
                        </span>
                      )}

                      {/* Time Duration Pill */}
                      {(item.startTime || item.endTime) && (
                        <span
                          data-testid={`item-time-${item.id}`}
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            fontWeight: 600,
                            backgroundColor: '#F8FAFC',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          ⏱️ {item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}
                        </span>
                      )}

                      {/* Status Badge */}
                      {item.status && (
                        <span
                          data-testid={`item-status-${item.id}`}
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor:
                              item.status === 'COMPLETED'
                                ? '#ECFDF5'
                                : item.status === 'IN_PROGRESS'
                                ? '#FEF3C7'
                                : item.status === 'POSTPONED'
                                ? '#FFF1F2'
                                : '#F1F5F9',
                            color:
                              item.status === 'COMPLETED'
                                ? '#047857'
                                : item.status === 'IN_PROGRESS'
                                ? '#92400E'
                                : item.status === 'POSTPONED'
                                ? '#BE123C'
                                : '#475569',
                            border:
                              item.status === 'COMPLETED'
                                ? '1px solid #A7F3D0'
                                : item.status === 'IN_PROGRESS'
                                ? '1px solid #FDE68A'
                                : item.status === 'POSTPONED'
                                ? '1px solid #FECDD3'
                                : '1px solid #E2E8F0',
                          }}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isCompleted ? '#64748B' : '#0F172A',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </div>

                    {/* Learners */}
                    {item.learnerIds && item.learnerIds.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.125rem', flexWrap: 'wrap' }}>
                        {item.learnerIds.map((lId) => (
                          <span
                            key={lId}
                            data-testid={`learner-badge-${lId}`}
                            style={{
                              fontSize: '0.6875rem',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              fontWeight: 500,
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            🎓 {learnerMap.get(lId) || 'Educando'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action buttons wrapped in RBAC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {!isRoutine && (
                    <>
                      <Can action="manage_lessons">
                        <button
                          type="button"
                          data-testid={`complete-lesson-btn-${item.id}`}
                          onClick={() => onOpenCompleteLesson(item)}
                          title="Concluir lição com notas e avaliação"
                          className="btn btn-sm"
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: isCompleted ? '1px solid #A7F3D0' : '1px solid #10B981',
                            backgroundColor: isCompleted ? '#ECFDF5' : '#10B981',
                            color: isCompleted ? '#047857' : '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isCompleted ? '✓ Concluída' : 'Concluir'}
                        </button>
                      </Can>

                      <Can action="manage_lessons">
                        <button
                          type="button"
                          data-testid={`reschedule-btn-${item.id}`}
                          onClick={() => onOpenRescheduleLesson(item)}
                          title="Reagendar lição"
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Reagendar
                        </button>
                      </Can>

                      {onDeleteLesson && (
                        <Can action="manage_lessons">
                          <button
                            type="button"
                            data-testid={`delete-lesson-btn-${item.id}`}
                            onClick={() => onDeleteLesson(item.id)}
                            title="Excluir lição"
                            className="btn btn-sm"
                            style={{
                              padding: '0.35rem 0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #FECDD3',
                              backgroundColor: '#FFF1F2',
                              color: '#E11D48',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Excluir
                          </button>
                        </Can>
                      )}
                    </>
                  )}

                  {isRoutine && onDeleteSlot && (
                    <Can action="manage_lessons">
                      <button
                        type="button"
                        data-testid={`delete-slot-btn-${item.id}`}
                        onClick={() => onDeleteSlot(item.id)}
                        title="Excluir bloco de rotina"
                        className="btn btn-sm"
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #FECDD3',
                          backgroundColor: '#FFF1F2',
                          color: '#E11D48',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Excluir
                      </button>
                    </Can>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
