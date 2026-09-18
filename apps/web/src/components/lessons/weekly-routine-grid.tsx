'use client';

import React from 'react';
import { AletheiaIcon, Badge, Button, IconButton } from '@aletheia/ui';
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
  onSuggestRoutine?: () => void;
}

export function WeeklyRoutineGrid({
  slots,
  learners,
  subjects,
  onAddSlot,
  onDeleteSlot,
  onEditSlot,
  onSuggestRoutine,
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onSuggestRoutine && (
            <Button
              variant="secondary"
              size="sm"
              data-testid="smart-routine-header-btn"
              onClick={onSuggestRoutine}
            >
              ⚡ Gerador de Rotina
            </Button>
          )}
          <Can action="manage_lessons">
            <Button size="sm" data-testid="add-routine-slot-btn" onClick={() => onAddSlot(1)}>
              + Adicionar Bloco de Rotina
            </Button>
          </Can>
        </div>
      </div>

      {/* Empty Routine Suggestion Banner */}
      {slots.length === 0 && (
        <div
          data-testid="empty-routine-banner"
          style={{
            backgroundColor: 'var(--color-indigo-50)',
            border: '1.5px dashed var(--color-indigo-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ maxWidth: '38rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-indigo-900)' }}>
                Grade Semanal Vazia: Economize tempo criando uma rotina sugerida
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-indigo-700)', lineHeight: '1.5' }}>
              Em vez de cadastrar manualmente horário por horário, nosso gerador inteligente distribui disciplinas matinais, pausas ao ar livre e devocionais de acordo com o ritmo da sua família.
            </p>
          </div>
          {onSuggestRoutine && (
            <Button
              variant="primary"
              data-testid="generate-suggested-routine-btn"
              onClick={onSuggestRoutine}
              style={{ fontWeight: 600 }}
            >
              ⚡ Gerar Grade Semanal Sugerida
            </Button>
          )}
        </div>
      )}

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
                <Badge variant={daySlots.length > 0 ? 'indigo' : 'slate'}>{daySlots.length}</Badge>
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
                          <Badge data-testid={`slot-time-${slot.id}`} variant="indigo">
                            <AletheiaIcon name="clock" size={11} />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </Badge>
                          <Can action="manage_lessons">
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <IconButton
                                size="sm"
                                data-testid={`edit-slot-btn-${slot.id}`}
                                onClick={() => onEditSlot?.(slot)}
                                aria-label="Editar bloco de rotina"
                                title="Editar bloco de rotina"
                              >
                                <AletheiaIcon name="pencil" size={12} />
                              </IconButton>
                              <IconButton
                                size="sm"
                                data-testid={`delete-slot-btn-${slot.id}`}
                                onClick={() => {
                                  if (window.confirm('Excluir este bloco de rotina? Esta ação não pode ser desfeita.')) {
                                    onDeleteSlot(slot.id);
                                  }
                                }}
                                aria-label="Excluir bloco de rotina"
                                title="Excluir bloco de rotina"
                              >
                                <AletheiaIcon name="x" size={12} />
                              </IconButton>
                            </div>
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
                            <Badge variant="slate">
                              <AletheiaIcon name="book-open" size={10} />
                              <span>{slot.subjectName || subInfo?.name}</span>
                            </Badge>
                          ) : null}

                          {learnerName && (
                            <Badge variant="indigo">
                              <AletheiaIcon name="graduation-cap" size={10} />
                              <span>{learnerName}</span>
                            </Badge>
                          )}

                          {slot.location && (
                            <Badge variant="slate">
                              <AletheiaIcon name="map-pin" size={10} />
                              <span>{slot.location}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <Can action="manage_lessons">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`add-slot-day-btn-${day.value}`}
                    onClick={() => onAddSlot(day.value)}
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    + Adicionar Bloco
                  </Button>
                </Can>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
