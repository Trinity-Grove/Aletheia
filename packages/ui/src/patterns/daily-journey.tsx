'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/card.js';
import { Progress } from '../components/progress.js';
import { Badge } from '../components/badge.js';

export interface DailyJourneyProps {
  completedMinutes: number;
  targetMinutes: number;
  completedLessons: number;
  totalLessons: number;
  daySequence: number;
  className?: string;
}

export function DailyJourney({
  completedMinutes,
  targetMinutes,
  completedLessons,
  totalLessons,
  daySequence,
  className = '',
}: DailyJourneyProps) {
  const percentage = Math.min(
    100,
    targetMinutes > 0 ? Math.round((completedMinutes / targetMinutes) * 100) : 0
  );

  return (
    <Card variant="elevated" shadow="sm" className={`ui-pattern-daily-journey ${className}`}>
      <CardHeader>
        <div className="ui-daily-journey-header">
          <div>
            <CardTitle>Jornada Diária de Aprendizagem</CardTitle>
            <p className="ui-daily-journey-subtitle">
              Dia letivo #{daySequence} do ano acadêmico
            </p>
          </div>
          <Badge variant={percentage >= 100 ? 'emerald' : 'indigo'} size="md">
            {percentage}% da Meta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="ui-daily-journey-body">
          <div className="ui-daily-journey-progress-section">
            <div className="ui-daily-journey-progress-labels">
              <span className="ui-daily-journey-progress-title">
                Tempo de Instrução
              </span>
              <span className="ui-daily-journey-progress-values">
                <strong>{completedMinutes} min</strong> de {targetMinutes} min
              </span>
            </div>
            <Progress value={completedMinutes} max={targetMinutes} label="Tempo de instrução hoje" />
          </div>

          <div className="ui-daily-journey-stats-grid">
            <div className="ui-daily-journey-stat-card">
              <span className="ui-daily-journey-stat-number ui-daily-journey-stat-number--forest">
                {completedLessons}/{totalLessons}
              </span>
              <p className="ui-daily-journey-stat-label">
                Lições Concluídas
              </p>
            </div>

            <div className="ui-daily-journey-stat-card">
              <span className="ui-daily-journey-stat-number ui-daily-journey-stat-number--gold">
                {(completedMinutes / 60).toFixed(1)}h
              </span>
              <p className="ui-daily-journey-stat-label">
                Horas Registradas
              </p>
            </div>

            <div className="ui-daily-journey-stat-card">
              <span className="ui-daily-journey-stat-number ui-daily-journey-stat-number--sage">
                {percentage}%
              </span>
              <p className="ui-daily-journey-stat-label">
                Progresso Geral
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
