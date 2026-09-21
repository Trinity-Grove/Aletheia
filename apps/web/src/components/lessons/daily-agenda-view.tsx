'use client';

import React from 'react';
import { AletheiaIcon, Badge, Button, Checkbox, Input } from '@aletheia/ui';
import type { DailyAgendaDto, DailyAgendaItemDto, LearnerSummaryDto } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { useLocale } from '../../lib/i18n/locale-context';

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

const LESSON_STATUS_KEYS: Record<string, string> = {
  PLANNED: 'lessons.statusPlanned',
  IN_PROGRESS: 'lessons.statusInProgress',
  COMPLETED: 'lessons.statusCompleted',
  POSTPONED: 'lessons.statusPostponed',
  CANCELLED: 'lessons.statusCancelled',
};

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
  const { t } = useLocale();
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

  const statusBadgeVariant = (status: DailyAgendaItemDto['status']): 'emerald' | 'amber' | 'rose' | 'slate' => {
    if (status === 'COMPLETED') return 'emerald';
    if (status === 'IN_PROGRESS') return 'amber';
    if (status === 'POSTPONED') return 'rose';
    return 'slate';
  };

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
          <Button variant="secondary" size="sm" onClick={() => handleShiftDate(-1)}>
            &larr; Ontem
          </Button>
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleShiftDate(1)}>
            Amanhã &rarr;
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Input
            type="date"
            data-testid="agenda-date-picker"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <Can action="manage_lessons">
            <Button size="sm" data-testid="create-lesson-btn" onClick={onOpenCreateLesson}>
              + Nova Lição
            </Button>
          </Can>
          <Can action="manage_lessons">
            <Button variant="secondary" size="sm" data-testid="create-slot-btn" onClick={onOpenCreateSlot}>
              + Bloco de Rotina
            </Button>
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
              <Button onClick={onOpenCreateLesson}>Planejar Lição</Button>
            </Can>
            <Can action="manage_lessons">
              <Button variant="secondary" onClick={onOpenCreateSlot}>
                Criar Bloco de Rotina
              </Button>
            </Can>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {agenda.items.map((item) => {
            const isCompleted = item.isCompleted || item.status === 'COMPLETED';
            const isRoutine = item.type === 'ROUTINE_SLOT';
            const itemColor = item.subjectColor || 'var(--color-indigo-700)';

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
                  <Checkbox
                    data-testid={`complete-toggle-btn-${item.id}`}
                    checked={isCompleted}
                    // Routine slots are a recurring weekly template with no
                    // per-day completion record in the API (isCompleted is
                    // always false for them) — routing this into the lesson
                    // "complete" flow would 404 (it has no lesson plan to
                    // complete). Disable it here instead of offering an
                    // interaction that can never succeed; log attendance or
                    // a learning record to track what actually happened.
                    disabled={isRoutine && !onQuickToggleComplete}
                    title={
                      isRoutine && !onQuickToggleComplete
                        ? 'Blocos de rotina não têm conclusão diária registrada — use Frequência ou o Diário de Aprendizagem.'
                        : undefined
                    }
                    onChange={() => {
                      if (onQuickToggleComplete) {
                        onQuickToggleComplete(item);
                      } else if (!isCompleted && !isRoutine) {
                        onOpenCompleteLesson(item);
                      }
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Type Badge */}
                      <Badge data-testid={`item-type-badge-${item.id}`} variant="indigo">
                        {isRoutine ? 'Rotina' : 'Lição'}
                      </Badge>

                      {/* Subject Badge */}
                      {item.subjectName && (
                        <Badge variant="slate">
                          <AletheiaIcon name="book-open" size={10} />
                          <span>{item.subjectName}</span>
                        </Badge>
                      )}

                      {/* Time Duration Pill */}
                      {(item.startTime || item.endTime) && (
                        <Badge data-testid={`item-time-${item.id}`} variant="slate">
                          <AletheiaIcon name="clock" size={10} />
                          <span>{item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}</span>
                        </Badge>
                      )}

                      {/* Status Badge */}
                      {item.status && (
                        <Badge data-testid={`item-status-${item.id}`} variant={statusBadgeVariant(item.status)}>
                          {LESSON_STATUS_KEYS[item.status] ? t(LESSON_STATUS_KEYS[item.status] as string) : item.status}
                        </Badge>
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
                          <Badge key={lId} data-testid={`learner-badge-${lId}`} variant="slate">
                            <AletheiaIcon name="graduation-cap" size={10} />
                            <span>{learnerMap.get(lId) || 'Educando'}</span>
                          </Badge>
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
                        <Button
                          size="sm"
                          variant={isCompleted ? 'secondary' : 'primary'}
                          data-testid={`complete-lesson-btn-${item.id}`}
                          onClick={() => onOpenCompleteLesson(item)}
                          title="Concluir lição com notas e avaliação"
                          leftIcon={isCompleted ? <AletheiaIcon name="check" size={12} /> : undefined}
                        >
                          {isCompleted ? 'Concluída' : 'Concluir'}
                        </Button>
                      </Can>

                      <Can action="manage_lessons">
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid={`reschedule-btn-${item.id}`}
                          onClick={() => onOpenRescheduleLesson(item)}
                          title="Reagendar lição"
                        >
                          Reagendar
                        </Button>
                      </Can>

                      {onDeleteLesson && (
                        <Can action="manage_lessons">
                          <Button
                            size="sm"
                            variant="danger"
                            data-testid={`delete-lesson-btn-${item.id}`}
                            onClick={() => {
                              if (window.confirm('Excluir esta lição? Esta ação não pode ser desfeita.')) {
                                onDeleteLesson(item.id);
                              }
                            }}
                            title="Excluir lição"
                          >
                            Excluir
                          </Button>
                        </Can>
                      )}
                    </>
                  )}

                  {isRoutine && onDeleteSlot && (
                    <Can action="manage_lessons">
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid={`delete-slot-btn-${item.id}`}
                        onClick={() => {
                          if (window.confirm('Excluir este bloco de rotina? Esta ação não pode ser desfeita.')) {
                            onDeleteSlot(item.id);
                          }
                        }}
                        title="Excluir bloco de rotina"
                      >
                        Excluir
                      </Button>
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
