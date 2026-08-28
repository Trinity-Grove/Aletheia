'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, EmptyState } from '@aletheia/ui';

export interface DailyActivityItem {
  id: string;
  title: string;
  subjectName?: string | undefined;
  time?: string | undefined;
  durationMinutes?: number | undefined;
  completed: boolean;
  type: 'devotional' | 'lesson' | 'routine';
}

export interface ActivityListProps {
  activities: DailyActivityItem[];
  onToggleComplete?: ((id: string) => void) | undefined;
}

export function ActivityList({ activities, onToggleComplete }: ActivityListProps) {
  const completedCount = activities.filter((a) => a.completed).length;

  return (
    <Card variant="default" shadow="sm">
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <CardTitle>Atividades de Hoje</CardTitle>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {completedCount} de {activities.length} atividades concluídas
            </p>
          </div>
          <Badge variant={completedCount === activities.length && activities.length > 0 ? 'emerald' : 'slate'} size="md">
            {completedCount}/{activities.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade para hoje"
            description="Aproveite o dia ou adicione novas lições e rotinas ao cronograma."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map((act) => (
              <div
                key={act.id}
                data-testid={`activity-item-${act.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: act.completed ? 'var(--sage-soft)' : 'var(--parchment-light)',
                  border: '1px solid',
                  borderColor: act.completed ? 'var(--color-brand-sage)' : 'var(--border-light)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    data-testid={`toggle-activity-${act.id}`}
                    onClick={() => onToggleComplete?.(act.id)}
                    aria-label={`Marcar ${act.title} como ${act.completed ? 'pendente' : 'concluída'}`}
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '4px',
                      border: act.completed ? '2px solid var(--color-brand-forest)' : '2px solid var(--border-medium)',
                      backgroundColor: act.completed ? 'var(--color-brand-forest)' : 'transparent',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {act.completed && <Check size={14} />}
                  </button>

                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        textDecoration: act.completed ? 'line-through' : 'none',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {act.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {act.subjectName && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-forest)', fontWeight: 600 }}>
                          {act.subjectName}
                        </span>
                      )}
                      {act.time && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          <span>{act.time}</span>
                        </span>
                      )}
                      {act.durationMinutes && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ({act.durationMinutes} min)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleComplete?.(act.id)}
                >
                  {act.completed ? 'Desmarcar' : 'Concluir'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
