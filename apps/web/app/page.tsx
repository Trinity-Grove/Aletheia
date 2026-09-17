'use client';

import React, { useEffect, useState } from 'react';
import {
  ActivityList,
  AletheiaIcon,
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
import { useDailyScripture } from '../src/components/dashboard/use-daily-scripture';
import { PrivacyComplianceBanner } from '../src/components/settings/privacy-compliance-banner';
import type { LearnerSummaryDto } from '@aletheia/contracts';

const MODULE_ACTIONS = [
  {
    href: '/curriculum',
    iconName: 'library',
    title: 'Currículo & Objetivos',
    description: 'Planejamento por disciplinas, frameworks e árvore de objetivos.',
  },
  {
    href: '/records',
    iconName: 'pen-line',
    title: 'Diário de Aprendizagem',
    description: 'Registro reflexivo, avaliação de domínio e formação de virtudes.',
  },
  {
    href: '/portfolio',
    iconName: 'folder-heart',
    title: 'Portfólio de Evidências',
    description: 'Acervo fotográfico e documentos comprobatórios de trabalhos.',
  },
  {
    href: '/reports',
    iconName: 'bar-chart-3',
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

  const dailyScripture = useDailyScripture(data?.family.id, data?.date);

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
        <PrivacyComplianceBanner />
        <PageHeader
          eyebrow="Trinity Grove • Aletheia"
          title="Faithful learning, thoughtfully guided."
          description="Registros acadêmicos estruturados e relatórios de apoio pedagógico para conformidade familiar."
          action={
            <div className="dashboard-page-actions">
              <a href="/schedule" className="ui-button ui-button--primary ui-button--md dashboard-page-action-button">
                <AletheiaIcon name="calendar" size="sm" />
                <span>Agenda & Checklist</span>
              </a>
              <a href="/devotional" className="ui-button ui-button--secondary ui-button--md dashboard-page-action-button">
                <AletheiaIcon name="book-open" size="sm" />
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
                    verseText={dailyScripture.verseText}
                    citation={dailyScripture.citation}
                  />
                  {dailyScripture.isFromFamilyDevotional ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.375rem', padding: '0 0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--sage-dark)', fontWeight: 600 }}>
                        ✦ Devocional da Família de Hoje
                      </span>
                      <a
                        href="/devotional"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--forest)',
                          textDecoration: 'underline',
                          fontWeight: 600,
                        }}
                      >
                        Ver devocional completo →
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.375rem', padding: '0 0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Versículo do Dia
                      </span>
                      <a
                        href="/devotional"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--forest)',
                          textDecoration: 'underline',
                          fontWeight: 600,
                        }}
                      >
                        Registrar devocional de hoje →
                      </a>
                    </div>
                  )}
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
                          <AletheiaIcon name={module.iconName} size="lg" />
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
