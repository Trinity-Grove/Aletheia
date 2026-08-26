'use client';

import React from 'react';
import type { DailyAgendaDto, DailyAgendaItemDto, LearnerSummaryDto } from '@aletheia/contracts';

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
    <div data-testid="daily-agenda-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Date Navigation and Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleShiftDate(-1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            &larr; Ontem
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleToday}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleShiftDate(1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontSize: '0.875rem',
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
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="button"
            data-testid="create-lesson-btn"
            onClick={onOpenCreateLesson}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nova Lição
          </button>
          <button
            type="button"
            data-testid="create-slot-btn"
            onClick={onOpenCreateSlot}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              backgroundColor: '#F9FAFB',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Bloco de Rotina
          </button>
        </div>
      </div>

      {/* Progress & Completed Totals Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px solid #E5E7EB',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Progresso do Dia
          </span>
          <span
            data-testid="completed-totals-text"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2563EB' }}
          >
            {completedItems} de {totalItems} concluídos ({progressPercent}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#F3F4F6',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid="progress-bar-fill"
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#10B981' : '#3B82F6',
              transition: 'width 0.3s ease',
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
            border: '2px dashed #E5E7EB',
            borderRadius: '0.75rem',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem', fontWeight: 600 }}>
            Nenhuma atividade ou lição planejada para esta data ({selectedDate}).
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            Planeje lições do currículo ou adicione blocos de rotina semanal para organizar o aprendizado.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={onOpenCreateLesson}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Planejar Lição
            </button>
            <button
              type="button"
              onClick={onOpenCreateSlot}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
              }}
            >
              Criar Bloco de Rotina
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {agenda.items.map((item) => {
            const isCompleted = item.isCompleted || item.status === 'COMPLETED';
            const isRoutine = item.type === 'ROUTINE_SLOT';

            return (
              <div
                key={item.id}
                data-testid={`agenda-item-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isCompleted ? '#F9FAFB' : '#FFFFFF',
                  borderRadius: '0.75rem',
                  border: isCompleted ? '1px solid #E5E7EB' : '1px solid #D1D5DB',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  opacity: isCompleted ? 0.85 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left check and details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
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
                    }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Type Badge */}
                      <span
                        data-testid={`item-type-badge-${item.id}`}
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          backgroundColor: isRoutine ? '#F3E8FF' : '#DBEAFE',
                          color: isRoutine ? '#6B21A8' : '#1E40AF',
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
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            backgroundColor: item.subjectColor ? `${item.subjectColor}20` : '#F3F4F6',
                            color: item.subjectColor || '#4B5563',
                            border: `1px solid ${item.subjectColor || '#E5E7EB'}`,
                          }}
                        >
                          {item.subjectName}
                        </span>
                      )}

                      {/* Time */}
                      {(item.startTime || item.endTime) && (
                        <span
                          data-testid={`item-time-${item.id}`}
                          style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}
                        >
                          ⏱ {item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}
                        </span>
                      )}

                      {/* Status */}
                      {item.status && (
                        <span
                          data-testid={`item-status-${item.id}`}
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            backgroundColor:
                              item.status === 'COMPLETED'
                                ? '#DEF7EC'
                                : item.status === 'IN_PROGRESS'
                                ? '#FEF08A'
                                : item.status === 'POSTPONED'
                                ? '#FEE2E2'
                                : '#F3F4F6',
                            color:
                              item.status === 'COMPLETED'
                                ? '#03543F'
                                : item.status === 'IN_PROGRESS'
                                ? '#713F12'
                                : item.status === 'POSTPONED'
                                ? '#991B1B'
                                : '#374151',
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
                        fontWeight: 600,
                        color: isCompleted ? '#6B7280' : '#111827',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        marginTop: '0.25rem',
                      }}
                    >
                      {item.title}
                    </div>

                    {/* Learners */}
                    {item.learnerIds && item.learnerIds.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        {item.learnerIds.map((lId) => (
                          <span
                            key={lId}
                            data-testid={`learner-badge-${lId}`}
                            style={{
                              fontSize: '0.6875rem',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                            }}
                          >
                            🎓 {learnerMap.get(lId) || 'Educando'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!isRoutine && (
                    <>
                      <button
                        type="button"
                        data-testid={`complete-lesson-btn-${item.id}`}
                        onClick={() => onOpenCompleteLesson(item)}
                        title="Concluir lição com notas e avaliação"
                        style={{
                          padding: '0.375rem 0.625rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #10B981',
                          backgroundColor: isCompleted ? '#DEF7EC' : '#FFFFFF',
                          color: '#047857',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isCompleted ? '✓ Concluída' : 'Concluir'}
                      </button>

                      <button
                        type="button"
                        data-testid={`reschedule-btn-${item.id}`}
                        onClick={() => onOpenRescheduleLesson(item)}
                        title="Reagendar lição"
                        style={{
                          padding: '0.375rem 0.625rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#374151',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Reagendar
                      </button>

                      {onDeleteLesson && (
                        <button
                          type="button"
                          data-testid={`delete-lesson-btn-${item.id}`}
                          onClick={() => onDeleteLesson(item.id)}
                          title="Excluir lição"
                          style={{
                            padding: '0.375rem 0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Excluir
                        </button>
                      )}
                    </>
                  )}

                  {isRoutine && onDeleteSlot && (
                    <button
                      type="button"
                      data-testid={`delete-slot-btn-${item.id}`}
                      onClick={() => onDeleteSlot(item.id)}
                      title="Excluir bloco de rotina"
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Excluir
                    </button>
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
