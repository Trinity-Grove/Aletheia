'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Progress, Badge } from '@aletheia/ui';

export interface DailyJourneyProps {
  completedMinutes: number;
  targetMinutes: number;
  completedLessons: number;
  totalLessons: number;
  daySequence: number; // e.g. Dia 42 de 180 dias letivos
}

export function DailyJourney({
  completedMinutes,
  targetMinutes,
  completedLessons,
  totalLessons,
  daySequence,
}: DailyJourneyProps) {
  const percentage = Math.min(
    100,
    targetMinutes > 0 ? Math.round((completedMinutes / targetMinutes) * 100) : 0
  );

  return (
    <Card variant="elevated" shadow="sm">
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <CardTitle>Jornada Diária de Aprendizagem</CardTitle>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Dia letivo #{daySequence} do ano acadêmico
            </p>
          </div>
          <Badge variant={percentage >= 100 ? 'emerald' : 'indigo'} size="md">
            {percentage}% da Meta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Tempo de Instrução
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong>{completedMinutes} min</strong> de {targetMinutes} min
              </span>
            </div>
            <Progress value={completedMinutes} max={targetMinutes} label="Tempo de instrução hoje" />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-forest)', fontFamily: 'var(--font-serif)' }}>
                {completedLessons}/{totalLessons}
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Lições Concluídas
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-gold)', fontFamily: 'var(--font-serif)' }}>
                {(completedMinutes / 60).toFixed(1)}h
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Horas Registradas
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-sage)', fontFamily: 'var(--font-serif)' }}>
                100%
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Devocional em Dia
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
