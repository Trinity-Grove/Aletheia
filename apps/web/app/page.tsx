'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  BookOpen,
  Library,
  PenLine,
  FolderHeart,
  BarChart3,
} from 'lucide-react';
import {
  ActivityList,
  Button,
  Card,
  DailyJourney,
  EmptyState,
  PageHeader,
  ScriptureCard,
  type DailyActivityItem,
} from '@aletheia/ui';
import { ProductShell } from '../src/components/layout/product-shell';
import { LearnerFocusHeader } from '../src/components/dashboard/learner-focus-header';
import { useDashboard } from '../src/components/dashboard/use-dashboard';
import type { LearnerSummaryDto } from '@aletheia/contracts';

const MODULE_ACTIONS = [
  {
    href: '/curriculum',
    icon: Library,
    title: 'Currículo & Objetivos',
    description: 'Planejamento por disciplinas, frameworks e árvore de objetivos.',
  },
  {
    href: '/records',
    icon: PenLine,
    title: 'Diário de Aprendizagem',
    description: 'Registro reflexivo, avaliação de domínio e formação de virtudes.',
  },
  {
    href: '/portfolio',
    icon: FolderHeart,
    title: 'Portfólio de Evidências',
    description: 'Acervo fotográfico e documentos comprobatórios de trabalhos.',
  },
  {
    href: '/reports',
    icon: BarChart3,
    title: 'Relatórios de Apoio',
    description: 'Históricos acadêmicos e transcrições estruturadas para famílias.',
  },
];

export default function HomePage() {
  const {
    data,
    status,
    errorMessage,
    activeLearnerId,
    setActiveLearnerId,
    retry,
    completeActivity,
  } = useDashboard();

  const activities: DailyActivityItem[] = data
    ? data.activities.map((activity) => ({
        ...activity,
        time: activity.scheduledTime,
      }))
    : [];

  const shellLearners = (data?.learners ?? []).map((learner) => ({
    id: learner.id,
    firstName: learner.displayName,
    preferredName: learner.displayName,
  })) as LearnerSummaryDto[];

  const [completionError, setCompletionError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      setCompletionError(null);
    }
  }, [status]);

  const handleToggleComplete = async (id: string) => {
    const activity = data?.activities.find((a) => a.id === id);
    if (activity && activity.type === 'lesson') {
      try {
        await completeActivity(activity);
        setCompletionError(null);
      } catch {
        setCompletionError('Não foi possível concluir a lição.');
      }
    }
  };

  return (
    <ProductShell
      currentPath="/"
      learners={shellLearners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      <div className="dashboard-page">
        <PageHeader
          eyebrow="Trinity Grove • Aletheia"
          title="Faithful learning, thoughtfully guided."
          description="Registros acadêmicos estruturados e relatórios de apoio pedagógico para conformidade familiar."
          action={
            <div className="dashboard-page-actions">
              <a href="/schedule" className="ui-button ui-button--primary ui-button--md dashboard-page-action-button">
                <Calendar size={16} />
                <span>Agenda & Checklist</span>
              </a>
              <a href="/devotional" className="ui-button ui-button--secondary ui-button--md dashboard-page-action-button">
                <BookOpen size={16} />
                <span>Devocional</span>
              </a>
            </div>
          }
        />

        {status === 'idle' && (
          <EmptyState
            title="Vincule sua família para começar"
            description="Para acompanhar a jornada diária, configure primeiro sua família no Aletheia."
            action={
              <a href="/onboarding" className="ui-button ui-button--primary ui-button--md">
                Configurar Família
              </a>
            }
          />
        )}

        {!data && status === 'loading' && (
          <div className="dashboard-page-loading" data-testid="dashboard-loading" aria-busy="true">
            <p>Carregando o painel...</p>
          </div>
        )}

        {!data && status === 'error' && (
          <EmptyState
            title="Não conseguimos carregar o painel"
            description={errorMessage ?? undefined}
            action={
              <Button onClick={retry} variant="primary" size="md">
                Tentar novamente
              </Button>
            }
          />
        )}

        {data && (
          <>
            {data.learners.length === 0 ? (
              <EmptyState
                title="Cadastre seus educandos"
                description="Adicione pelo menos um educando para acompanhar a jornada diária da família."
                action={
                  <a href="/learners" className="ui-button ui-button--primary ui-button--md">
                    Cadastrar Educandos
                  </a>
                }
              />
            ) : (
              <div
                className="dashboard-page-content"
                data-testid="dashboard-content"
                aria-busy={status === 'loading' ? 'true' : 'false'}
              >
                <LearnerFocusHeader
                  learners={data.learners}
                  activeLearnerId={data.activeLearnerId}
                  onSelectLearner={setActiveLearnerId}
                />

                <div className="dashboard-page-scripture">
                  <ScriptureCard
                    verseText="Ensina a criança no caminho em que deve andar, e, ainda quando for velho, não se desviará dele."
                    citation="Provérbios 22:6 (ARA)"
                  />
                </div>

                <div className="dashboard-page-grid">
                  <DailyJourney
                    completedMinutes={data.journey.completedMinutes}
                    targetMinutes={data.journey.targetMinutes}
                    completedLessons={data.journey.completedLessons}
                    totalLessons={data.journey.totalLessons}
                    daySequence={data.journey.daySequence}
                  />

                  <div className="dashboard-page-activities">
                    <ActivityList
                      activities={activities}
                      onToggleComplete={handleToggleComplete}
                      completableTypes={['lesson']}
                    />
                    <div
                      className="dashboard-page-completion-status"
                      data-testid="completion-live-region"
                      aria-live="polite"
                      role="status"
                    >
                      {completionError && <p>{completionError}</p>}
                    </div>
                  </div>
                </div>

                <div className="dashboard-page-module-grid">
                  {MODULE_ACTIONS.map((module) => (
                    <a key={module.href} href={module.href} className="dashboard-page-module-link">
                      <Card variant="bordered" shadow="sm" className="dashboard-page-module-card">
                        <div className="dashboard-page-module-icon">
                          <module.icon size={24} />
                        </div>
                        <h4 className="dashboard-page-module-title">{module.title}</h4>
                        <p className="dashboard-page-module-description">{module.description}</p>
                      </Card>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProductShell>
  );
}
