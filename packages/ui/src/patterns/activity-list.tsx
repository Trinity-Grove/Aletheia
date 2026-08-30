'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/card.js';
import { Badge } from '../components/badge.js';
import { Button } from '../components/button.js';
import { EmptyState } from '../components/empty-state.js';

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
  completableTypes?: Array<DailyActivityItem['type']> | undefined;
  className?: string;
}

const ALL_TYPES: DailyActivityItem['type'][] = ['devotional', 'lesson', 'routine'];

export function ActivityList({
  activities,
  onToggleComplete,
  completableTypes = ALL_TYPES,
  className = '',
}: ActivityListProps) {
  const completedCount = activities.filter((a) => a.completed).length;

  const isCompletable = (type: DailyActivityItem['type']) =>
    onToggleComplete !== undefined && completableTypes.includes(type);

  return (
    <Card variant="default" shadow="sm" className={`ui-pattern-activity-list ${className}`}>
      <CardHeader>
        <div className="ui-activity-list-header">
          <div>
            <CardTitle>Atividades de Hoje</CardTitle>
            <p className="ui-activity-list-subtitle">
              {completedCount} de {activities.length} atividades concluídas
            </p>
          </div>
          <Badge
            variant={completedCount === activities.length && activities.length > 0 ? 'emerald' : 'slate'}
            size="md"
          >
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
          <div className="ui-activity-list-items">
            {activities.map((act) => (
              <div
                key={act.id}
                data-testid={`activity-item-${act.id}`}
                className={`ui-activity-item ${act.completed ? 'ui-activity-item--completed' : ''}`}
              >
                <div className="ui-activity-item-left">
                  {isCompletable(act.type) && (
                    <button
                      type="button"
                      data-testid={`toggle-activity-${act.id}`}
                      onClick={() => onToggleComplete?.(act.id)}
                      aria-label={`Marcar ${act.title} como ${act.completed ? 'pendente' : 'concluída'}`}
                      className={`ui-activity-checkbox ${act.completed ? 'ui-activity-checkbox--checked' : ''}`}
                    >
                      {act.completed && <Check size={14} />}
                    </button>
                  )}

                  <div className="ui-activity-item-info">
                    <h4 className="ui-activity-item-title">
                      {act.title}
                    </h4>
                    <div className="ui-activity-item-meta">
                      {act.subjectName && (
                        <span className="ui-activity-item-subject">
                          {act.subjectName}
                        </span>
                      )}
                      {act.time && (
                        <span className="ui-activity-item-time">
                          <Clock size={12} />
                          <span>{act.time}</span>
                        </span>
                      )}
                      {act.durationMinutes && (
                        <span className="ui-activity-item-duration">
                          ({act.durationMinutes} min)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isCompletable(act.type) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleComplete?.(act.id)}
                  >
                    {act.completed ? 'Desmarcar' : 'Concluir'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
