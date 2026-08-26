'use client';

import React from 'react';
import type {
  DayOfWeek,
  LearnerSummaryDto,
  ScheduleSlotResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { DAYS_OF_WEEK } from './routine-slot-modal';

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
    <div data-testid="weekly-routine-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #E5E7EB',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Estrutura da Rotina Semanal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            Defina os blocos fixos e horários de estudo recorrentes para cada dia da semana.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-routine-slot-btn"
          onClick={() => onAddSlot(1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Adicionar Bloco de Rotina
        </button>
      </div>

      {/* Grid of days */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
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
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px',
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
                  {day.label}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#E2E8F0',
                    color: '#475569',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                  }}
                >
                  {daySlots.length}
                </span>
              </div>

              {/* Day Slots List */}
              <div
                style={{
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
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
                      padding: '1.5rem 0.5rem',
                      color: '#9CA3AF',
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      fontStyle: 'italic',
                    }}
                  >
                    Sem blocos programados
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const subInfo = slot.subjectId ? subjectMap.get(slot.subjectId) : null;
                    const learnerName = slot.learnerId ? learnerMap.get(slot.learnerId) : null;
                    const slotColor = slot.color || subInfo?.color || '#3B82F6';

                    return (
                      <div
                        key={slot.id}
                        data-testid={`routine-slot-${slot.id}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0.5rem',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${slotColor}`,
                          padding: '0.625rem 0.75rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span
                            data-testid={`slot-time-${slot.id}`}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#2563EB',
                            }}
                          >
                            ⏱ {slot.startTime} - {slot.endTime}
                          </span>
                          <button
                            type="button"
                            data-testid={`delete-slot-btn-${slot.id}`}
                            onClick={() => onDeleteSlot(slot.id)}
                            title="Excluir bloco de rotina"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#9CA3AF',
                              fontSize: '1rem',
                              lineHeight: 1,
                              cursor: 'pointer',
                              padding: '0 0.25rem',
                            }}
                          >
                            &times;
                          </button>
                        </div>

                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1E293B',
                            margin: '0.25rem 0',
                          }}
                        >
                          {slot.title}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                          {slot.subjectName || subInfo?.name ? (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                              }}
                            >
                              📚 {slot.subjectName || subInfo?.name}
                            </span>
                          ) : null}

                          {learnerName && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#EFF6FF',
                                color: '#1E40AF',
                              }}
                            >
                              🎓 {learnerName}
                            </span>
                          )}

                          {slot.location && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#F3F4F6',
                                color: '#6B7280',
                              }}
                            >
                              📍 {slot.location}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  data-testid={`add-slot-day-btn-${day.value}`}
                  onClick={() => onAddSlot(day.value)}
                  style={{
                    marginTop: 'auto',
                    padding: '0.375rem',
                    borderRadius: '0.375rem',
                    border: '1px dashed #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  + Adicionar Bloco
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
