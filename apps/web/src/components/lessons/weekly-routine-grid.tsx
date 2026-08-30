'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  DayOfWeek,
  LearnerSummaryDto,
  ScheduleSlotResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { DAYS_OF_WEEK } from './routine-slot-modal';
import { Can } from '../auth/role-guard';

export interface WeeklyRoutineGridProps {
  slots: ScheduleSlotResponseDto[];
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  onAddSlot: (dayOfWeek?: DayOfWeek) => void;
  onDeleteSlot: (slotId: string) => Promise<void>;
  onEditSlot?: (slot: ScheduleSlotResponseDto) => void;
}

export function WeeklyRoutineGrid({
  slots,
  learners,
  subjects,
  onAddSlot,
  onDeleteSlot,
  onEditSlot: _onEditSlot,
}: WeeklyRoutineGridProps) {
  const learnerMap = new Map<string, string>();
  learners.forEach((l) => {
    learnerMap.set(l.id, l.preferredName || l.firstName);
  });

  const subjectMap = new Map<string, { name: string; color?: string | null | undefined }>();
  subjects.forEach((s) => {
    subjectMap.set(s.id, { name: s.name, color: s.color });
  });

  // Group slots by dayOfWeek (1 to 7)
  const slotsByDay = new Map<number, ScheduleSlotResponseDto[]>();
  DAYS_OF_WEEK.forEach((d) => {
    slotsByDay.set(d.value, []);
  });

  slots.forEach((slot) => {
    const list = slotsByDay.get(slot.dayOfWeek) || [];
    list.push(slot);
    slotsByDay.set(slot.dayOfWeek, list);
  });

  // Sort each day's slots by startTime
  slotsByDay.forEach((list) => {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div
      data-testid="weekly-routine-grid"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            Estrutura da Rotina Semanal
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Defina os blocos fixos, matérias recorrentes e horários de estudo para cada dia da semana.
          </p>
        </div>
        <Can action="manage_lessons">
          <button
            type="button"
            data-testid="add-routine-slot-btn"
            onClick={() => onAddSlot(1)}
            className="btn btn-primary ui-button ui-button--primary ui-button--sm"
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-indigo-700)',
              color: 'var(--text-inverse)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            + Adicionar Bloco de Rotina
          </button>
        </Can>
      </div>

      {/* Grid of days */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {DAYS_OF_WEEK.map((day) => {
          const daySlots = slotsByDay.get(day.value) || [];

          return (
            <div
              key={day.value}
              data-testid={`routine-day-column-${day.value}`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px',
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--sage-soft)',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {day.label}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: daySlots.length > 0 ? 'var(--color-indigo-50)' : 'var(--sage-soft)',
                    color: daySlots.length > 0 ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    border: daySlots.length > 0 ? '1px solid var(--color-indigo-100)' : '1px solid var(--border-light)',
                  }}
                >
                  {daySlots.length}
                </span>
              </div>

              {/* Day Slots List */}
              <div
                style={{
                  padding: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  flex: 1,
                }}
              >
                {daySlots.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem 0.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      backgroundColor: 'var(--sage-soft)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-light)',
                      margin: '0.25rem 0',
                    }}
                  >
                    Sem blocos programados
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const subInfo = slot.subjectId ? subjectMap.get(slot.subjectId) : null;
                    const learnerName = slot.learnerId ? learnerMap.get(slot.learnerId) : null;
                    const slotColor = slot.color || subInfo?.color || 'var(--color-indigo-700)';

                    return (
                      <div
                        key={slot.id}
                        data-testid={`routine-slot-${slot.id}`}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          borderLeft: `4px solid ${slotColor}`,
                          padding: '0.75rem 0.875rem',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.375rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            data-testid={`slot-time-${slot.id}`}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--color-indigo-700)',
                              backgroundColor: 'var(--color-indigo-50)',
                              padding: '0.125rem 0.375rem',
                              borderRadius: 'var(--radius-sm)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <AletheiaIcon name="clock" size={11} />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </span>
                          <Can action="manage_lessons">
                            <button
                              type="button"
                              data-testid={`delete-slot-btn-${slot.id}`}
                              onClick={() => onDeleteSlot(slot.id)}
                              title="Excluir bloco de rotina"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '1rem',
                                lineHeight: 1,
                                cursor: 'pointer',
                                padding: '0 0.25rem',
                              }}
                            >
                              &times;
                            </button>
                          </Can>
                        </div>

                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {slot.title}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.125rem' }}>
                          {slot.subjectName || subInfo?.name ? (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--sage-soft)',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <AletheiaIcon name="book-open" size={10} />
                              <span>{slot.subjectName || subInfo?.name}</span>
                            </span>
                          ) : null}

                          {learnerName && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-indigo-50)',
                                color: 'var(--color-indigo-700)',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <AletheiaIcon name="graduation-cap" size={10} />
                              <span>{learnerName}</span>
                            </span>
                          )}

                          {slot.location && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--sage-soft)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-light)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <AletheiaIcon name="map-pin" size={10} />
                              <span>{slot.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <Can action="manage_lessons">
                  <button
                    type="button"
                    data-testid={`add-slot-day-btn-${day.value}`}
                    onClick={() => onAddSlot(day.value)}
                    style={{
                      marginTop: 'auto',
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px dashed var(--border-medium)',
                      backgroundColor: 'var(--sage-soft)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    + Adicionar Bloco
                  </button>
                </Can>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
