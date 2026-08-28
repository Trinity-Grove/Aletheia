'use client';

import React from 'react';
import { BookOpen, GraduationCap, MapPin, Clock } from 'lucide-react';
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
          backgroundColor: '#FFFFFF',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
            Estrutura da Rotina Semanal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
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
              borderRadius: '0.5rem',
              backgroundColor: '#4338CA',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(67, 56, 202, 0.2)',
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
                backgroundColor: '#FFFFFF',
                borderRadius: '1rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
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
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                  {day.label}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: daySlots.length > 0 ? '#EEF2FF' : '#F1F5F9',
                    color: daySlots.length > 0 ? '#4338CA' : '#64748B',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    border: daySlots.length > 0 ? '1px solid #E0E7FF' : '1px solid #E2E8F0',
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
                      color: '#94A3B8',
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      fontStyle: 'italic',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '0.5rem',
                      border: '1px dashed #E2E8F0',
                      margin: '0.25rem 0',
                    }}
                  >
                    Sem blocos programados
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const subInfo = slot.subjectId ? subjectMap.get(slot.subjectId) : null;
                    const learnerName = slot.learnerId ? learnerMap.get(slot.learnerId) : null;
                    const slotColor = slot.color || subInfo?.color || '#4338CA';

                    return (
                      <div
                        key={slot.id}
                        data-testid={`routine-slot-${slot.id}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0.625rem',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${slotColor}`,
                          padding: '0.75rem 0.875rem',
                          boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
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
                              color: '#4338CA',
                              backgroundColor: '#EEF2FF',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Clock size={11} />
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
                                color: '#94A3B8',
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
                            color: '#0F172A',
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
                                borderRadius: '0.25rem',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <BookOpen size={10} />
                              <span>{slot.subjectName || subInfo?.name}</span>
                            </span>
                          ) : null}

                          {learnerName && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <GraduationCap size={10} />
                              <span>{learnerName}</span>
                            </span>
                          )}

                          {slot.location && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#F8FAFC',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <MapPin size={10} />
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
                      borderRadius: '0.5rem',
                      border: '1.5px dashed #CBD5E1',
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
                </Can>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
