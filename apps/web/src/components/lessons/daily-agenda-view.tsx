'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
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
          backgroundColor: 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={() => handleShiftDate(-1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
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
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--text-primary)',
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
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
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
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
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
                borderRadius: 'var(--radius-md)',
                border: 'none',
                color: 'var(--text-inverse)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
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
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Progresso do Dia
          </span>
          <span
            data-testid="completed-totals-text"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-indigo-700)' }}
          >
            {completedItems} de {totalItems} concluídos ({progressPercent}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--sage-soft)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid="progress-bar-fill"
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? 'var(--color-emerald-600)' : 'var(--color-indigo-700)',
              borderRadius: 'var(--radius-full)',
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
            backgroundColor: 'var(--bg-surface)',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
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
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-indigo-50)',
              border: '2px solid var(--color-indigo-100)',
              color: 'var(--color-indigo-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <AletheiaIcon name="calendar" size={32} />
          </div>
          <div>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.375rem', fontWeight: 700 }}>
              Nenhuma atividade ou lição planejada para esta data ({selectedDate}).
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '28rem', margin: '0 auto' }}>
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
                  borderRadius: 'var(--radius-md)',
                    color: 'var(--text-inverse)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
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
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-medium)',
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
            const itemColor = item.subjectColor || (isRoutine ? 'var(--color-indigo-700)' : 'var(--color-indigo-700)');

            return (
              <div
                key={item.id}
                data-testid={`agenda-item-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isCompleted ? 'var(--sage-soft)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  borderLeft: `4px solid ${itemColor}`,
                  padding: '1.125rem 1.25rem',
                  boxShadow: isCompleted ? 'none' : 'var(--shadow-sm)',
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
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      accentColor: 'var(--color-emerald-600)',
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
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isRoutine ? 'var(--color-indigo-50)' : 'var(--color-indigo-50)',
                          color: isRoutine ? 'var(--color-indigo-700)' : 'var(--color-indigo-700)',
                          border: isRoutine ? '1px solid var(--color-indigo-100)' : '1px solid var(--color-indigo-100)',
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
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <AletheiaIcon name="book-open" size={10} />
                          <span>{item.subjectName}</span>
                        </span>
                      )}

                      {/* Time Duration Pill */}
                      {(item.startTime || item.endTime) && (
                        <span
                          data-testid={`item-time-${item.id}`}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            backgroundColor: 'var(--sage-soft)',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-light)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <AletheiaIcon name="clock" size={10} />
                          <span>{item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}</span>
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
                            borderRadius: 'var(--radius-full)',
                            backgroundColor:
                              item.status === 'COMPLETED'
                                ? 'var(--color-emerald-50)'
                                : item.status === 'IN_PROGRESS'
                                ? 'var(--color-amber-50)'
                                : item.status === 'POSTPONED'
                                ? 'var(--color-rose-50)'
                                : 'var(--sage-soft)',
                            color:
                              item.status === 'COMPLETED'
                                ? 'var(--color-emerald-700)'
                                : item.status === 'IN_PROGRESS'
                                ? 'var(--color-amber-700)'
                                : item.status === 'POSTPONED'
                                ? 'var(--color-rose-700)'
                                : 'var(--text-secondary)',
                            border:
                              item.status === 'COMPLETED'
                                ? '1px solid var(--color-emerald-100)'
                                : item.status === 'IN_PROGRESS'
                                ? '1px solid var(--color-amber-100)'
                                : item.status === 'POSTPONED'
                                ? '1px solid var(--color-rose-100)'
                                : '1px solid var(--border-light)',
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
                        color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
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
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--sage-soft)',
                              color: 'var(--text-secondary)',
                              fontWeight: 500,
                              border: '1px solid var(--border-light)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <AletheiaIcon name="graduation-cap" size={10} />
                            <span>{learnerMap.get(lId) || 'Educando'}</span>
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
                            borderRadius: 'var(--radius-sm)',
                            border: isCompleted ? '1px solid var(--color-emerald-100)' : '1px solid var(--color-emerald-600)',
                            backgroundColor: isCompleted ? 'var(--color-emerald-50)' : 'var(--color-emerald-600)',
                            color: isCompleted ? 'var(--color-emerald-700)' : 'var(--text-inverse)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {isCompleted ? (
                            <>
                              <AletheiaIcon name="check" size={12} />
                              <span>Concluída</span>
                            </>
                          ) : (
                            'Concluir'
                          )}
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
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-medium)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
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
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-rose-100)',
                              backgroundColor: 'var(--color-rose-50)',
                              color: 'var(--color-rose-600)',
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
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-rose-100)',
                          backgroundColor: 'var(--color-rose-50)',
                          color: 'var(--color-rose-600)',
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
