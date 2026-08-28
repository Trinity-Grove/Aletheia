'use client';

import React, { useState } from 'react';
import {
  Calendar,
  BookOpen,
  Library,
  PenLine,
  FolderHeart,
  BarChart3,
} from 'lucide-react';
import { PageHeader, ScriptureCard, Card } from '@aletheia/ui';
import { ProductShell } from '../src/components/layout/product-shell';
import { LearnerFocusHeader } from '../src/components/dashboard/learner-focus-header';
import { DailyJourney } from '../src/components/dashboard/daily-journey';
import { ActivityList, type DailyActivityItem } from '../src/components/dashboard/activity-list';
import type { LearnerSummaryDto } from '@aletheia/contracts';

const MOCK_LEARNERS: LearnerSummaryDto[] = [
  {
    id: 'learner-1',
    firstName: 'Ana Clara',
    lastName: 'Santos',
    preferredName: 'Clarinha',
    stage: 'PRIMARY_GRAMMAR',
  },
  {
    id: 'learner-2',
    firstName: 'Mateus',
    lastName: 'Santos',
    preferredName: 'Mateus',
    stage: 'PRIMARY_GRAMMAR',
  },
];

const INITIAL_ACTIVITIES: DailyActivityItem[] = [
  {
    id: 'act-1',
    title: 'Devocional Matinal em Família — Salmo 23',
    subjectName: 'Devocional',
    time: '08:00',
    durationMinutes: 20,
    completed: true,
    type: 'devotional',
  },
  {
    id: 'act-2',
    title: 'Gramática Latina: Declinações da Primeira Família',
    subjectName: 'Latim & Gramática',
    time: '09:00',
    durationMinutes: 45,
    completed: true,
    type: 'lesson',
  },
  {
    id: 'act-3',
    title: 'Matemática Clássica: Aritmética e Frações',
    subjectName: 'Matemática',
    time: '10:15',
    durationMinutes: 50,
    completed: false,
    type: 'lesson',
  },
  {
    id: 'act-4',
    title: 'História Antiga: As Grandes Guerras Médicas',
    subjectName: 'História',
    time: '11:15',
    durationMinutes: 40,
    completed: false,
    type: 'lesson',
  },
];

export default function HomePage() {
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>('learner-1');
  const [activities, setActivities] = useState<DailyActivityItem[]>(INITIAL_ACTIVITIES);

  const handleToggleComplete = (id: string) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedActivities = activities.filter((a) => a.completed);
  const completedMinutes = completedActivities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const targetMinutes = 240; // 4 hours daily goal

  return (
    <ProductShell currentPath="/" learners={MOCK_LEARNERS} activeLearnerId={activeLearnerId} onSelectLearner={setActiveLearnerId}>
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          eyebrow="Trinity Grove • Aletheia"
          title="Faithful learning, thoughtfully guided."
          description="Registros acadêmicos estruturados e relatórios de apoio pedagógico para conformidade familiar."
          action={
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="/schedule" className="ui-button ui-button--primary ui-button--md" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                <span>Agenda & Checklist</span>
              </a>
              <a href="/devotional" className="ui-button ui-button--secondary ui-button--md" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} />
                <span>Devocional</span>
              </a>
            </div>
          }
        />

        {/* Learner Focus Switcher Header */}
        <LearnerFocusHeader
          learners={MOCK_LEARNERS}
          activeLearnerId={activeLearnerId}
          onSelectLearner={setActiveLearnerId}
        />

        {/* Scripture of the Day */}
        <div style={{ marginBottom: '1.75rem' }}>
          <ScriptureCard
            verseText="Ensina a criança no caminho em que deve andar, e, ainda quando for velho, não se desviará dele."
            citation="Provérbios 22:6 (ARA)"
          />
        </div>

        {/* Main Grid: Daily Journey & Activities */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2rem',
          }}
        >
          {/* Daily Journey Progress */}
          <DailyJourney
            completedMinutes={completedMinutes}
            targetMinutes={targetMinutes}
            completedLessons={completedActivities.filter((a) => a.type === 'lesson').length}
            totalLessons={activities.filter((a) => a.type === 'lesson').length}
            daySequence={42}
          />

          {/* Activity List */}
          <ActivityList
            activities={activities}
            onToggleComplete={handleToggleComplete}
          />
        </div>

        {/* Quick Modules Shortcuts */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <a href="/curriculum" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card variant="bordered" shadow="sm" style={{ padding: '1.25rem', transition: 'transform 0.15s ease' }}>
              <div style={{ color: 'var(--color-brand-forest)', marginBottom: '0.75rem' }}>
                <Library size={24} />
              </div>
              <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-brand-forest)' }}>
                Currículo & Objetivos
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Planejamento por disciplinas, frameworks e árvore de objetivos.
              </p>
            </Card>
          </a>

          <a href="/records" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card variant="bordered" shadow="sm" style={{ padding: '1.25rem', transition: 'transform 0.15s ease' }}>
              <div style={{ color: 'var(--color-brand-forest)', marginBottom: '0.75rem' }}>
                <PenLine size={24} />
              </div>
              <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-brand-forest)' }}>
                Diário de Aprendizagem
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Registro reflexivo, avaliação de domínio e formação de virtudes.
              </p>
            </Card>
          </a>

          <a href="/portfolio" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card variant="bordered" shadow="sm" style={{ padding: '1.25rem', transition: 'transform 0.15s ease' }}>
              <div style={{ color: 'var(--color-brand-forest)', marginBottom: '0.75rem' }}>
                <FolderHeart size={24} />
              </div>
              <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-brand-forest)' }}>
                Portfólio de Evidências
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Acervo fotográfico e documentos comprobatórios de trabalhos.
              </p>
            </Card>
          </a>

          <a href="/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card variant="bordered" shadow="sm" style={{ padding: '1.25rem', transition: 'transform 0.15s ease' }}>
              <div style={{ color: 'var(--color-brand-forest)', marginBottom: '0.75rem' }}>
                <BarChart3 size={24} />
              </div>
              <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--color-brand-forest)' }}>
                Relatórios de Apoio
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Históricos acadêmicos e transcrições estruturadas para famílias.
              </p>
            </Card>
          </a>
        </div>
      </div>
    </ProductShell>
  );
}
