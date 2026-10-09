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
import { useLocale } from '../src/lib/i18n/locale-context';
import type { LearnerSummaryDto } from '@aletheia/contracts';

export default function HomePage() {
  const { t } = useLocale();
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
        setCompletionError(t('landing.completionError'));
      }
    }
  };

  const moduleActions = [
    {
      href: '/curriculum',
      iconName: 'library' as const,
      title: t('landing.modules.curriculumTitle'),
      description: t('landing.modules.curriculumDesc'),
    },
    {
      href: '/records',
      iconName: 'pen-line' as const,
      title: t('landing.modules.recordsTitle'),
      description: t('landing.modules.recordsDesc'),
    },
    {
      href: '/portfolio',
      iconName: 'folder-heart' as const,
      title: t('landing.modules.portfolioTitle'),
      description: t('landing.modules.portfolioDesc'),
    },
    {
      href: '/reports',
      iconName: 'bar-chart-3' as const,
      title: t('landing.modules.reportsTitle'),
      description: t('landing.modules.reportsDesc'),
    },
  ];

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
          eyebrow={t('landing.eyebrow')}
          title={t('landing.title')}
          description={t('landing.description')}
          action={
            <div className="dashboard-page-actions">
              <a href="/schedule" className="ui-button ui-button--primary ui-button--md dashboard-page-action-button">
                <AletheiaIcon name="calendar" size="sm" />
                <span>{t('landing.actions.schedule')}</span>
              </a>
              <a href="/devotional" className="ui-button ui-button--secondary ui-button--md dashboard-page-action-button">
                <AletheiaIcon name="book-open" size="sm" />
                <span>{t('landing.actions.devotional')}</span>
              </a>
            </div>
          }
        />

        {status === 'idle' && (
          <EmptyState
            title={t('landing.emptyFamily.title')}
            description={t('landing.emptyFamily.description')}
            action={
              <a href="/onboarding" className="ui-button ui-button--primary ui-button--md">
                {t('landing.emptyFamily.setupButton')}
              </a>
            }
          />
        )}

        {!data && status === 'loading' && (
          <div className="dashboard-page-loading" data-testid="dashboard-loading" aria-busy="true">
            <p>{t('landing.loading')}</p>
          </div>
        )}

        {!data && status === 'error' && (
          <EmptyState
            title={t('landing.errorTitle')}
            description={errorMessage ?? undefined}
            action={
              <Button onClick={retry} variant="primary" size="md">
                {t('landing.retryButton')}
              </Button>
            }
          />
        )}

        {data && (
          <>
            {data.learners.length === 0 ? (
              <EmptyState
                title={t('landing.emptyLearners.title')}
                description={t('landing.emptyLearners.description')}
                action={
                  <a href="/learners" className="ui-button ui-button--primary ui-button--md">
                    {t('landing.emptyLearners.registerButton')}
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
                        {t('landing.scripture.familyDevotionalToday')}
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
                        {t('landing.scripture.viewFullDevotional')}
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.375rem', padding: '0 0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {t('landing.scripture.verseOfTheDay')}
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
                        {t('landing.scripture.recordDevotionalToday')}
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
                  {moduleActions.map((module) => (
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
