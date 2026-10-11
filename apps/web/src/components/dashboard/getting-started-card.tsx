'use client';

import React, { useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { OnboardingChecklistDto, OnboardingStepId } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface GettingStartedCardProps {
  checklist: OnboardingChecklistDto;
  familyId: string;
  onDismiss?(): void;
}

interface StepMeta {
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
}

const STEP_METADATA: Record<OnboardingStepId, StepMeta> = {
  create_learner: {
    titleKey: 'dashboard.gettingStarted.steps.createLearner.title',
    descriptionKey: 'dashboard.gettingStarted.steps.createLearner.description',
    actionKey: 'dashboard.gettingStarted.steps.createLearner.action',
  },
  choose_curriculum: {
    titleKey: 'dashboard.gettingStarted.steps.chooseCurriculum.title',
    descriptionKey: 'dashboard.gettingStarted.steps.chooseCurriculum.description',
    actionKey: 'dashboard.gettingStarted.steps.chooseCurriculum.action',
  },
  schedule_lesson: {
    titleKey: 'dashboard.gettingStarted.steps.scheduleLesson.title',
    descriptionKey: 'dashboard.gettingStarted.steps.scheduleLesson.description',
    actionKey: 'dashboard.gettingStarted.steps.scheduleLesson.action',
  },
  complete_first_activity: {
    titleKey: 'dashboard.gettingStarted.steps.completeFirstActivity.title',
    descriptionKey: 'dashboard.gettingStarted.steps.completeFirstActivity.description',
    actionKey: 'dashboard.gettingStarted.steps.completeFirstActivity.action',
  },
};

export function GettingStartedCard({
  checklist,
  familyId,
  onDismiss,
}: GettingStartedCardProps) {
  const { t } = useLocale();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ onboardingDismissed: true }),
      });
    } catch {
      // Non-fatal if offline/error, still dismiss locally
    } finally {
      setIsDismissed(true);
      onDismiss?.();
    }
  };

  const total = checklist.totalCount || 4;
  const percentage = Math.min(100, Math.max(0, (checklist.completedCount / total) * 100));

  return (
    <div
      data-testid="getting-started-card"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm mb-6 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <AletheiaIcon name="compass" size="md" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {t('dashboard.gettingStarted.title')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {t('dashboard.gettingStarted.subtitle')}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isDismissing}
            aria-label={t('dashboard.gettingStarted.dismiss')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <AletheiaIcon name="x" size="sm" />
            <span>{t('dashboard.gettingStarted.dismiss')}</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
          <span>
            {t('dashboard.gettingStarted.progress', {
              completed: checklist.completedCount,
              total: checklist.totalCount,
            })}
          </span>
          <span>{`${Math.round(percentage)}%`}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={checklist.completedCount}
          aria-valuemin={0}
          aria-valuemax={checklist.totalCount}
          aria-label={t('dashboard.gettingStarted.progress', {
            completed: checklist.completedCount,
            total: checklist.totalCount,
          })}
          className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden"
        >
          <div
            className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {checklist.steps.map((step) => {
          const meta = STEP_METADATA[step.id];
          return (
            <div
              key={step.id}
              data-testid={`getting-started-step-${step.id}`}
              className={`flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                step.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500" />
                  {step.completed ? (
                    <span
                      data-testid={`step-status-${step.id}`}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      data-testid={`step-status-${step.id}`}
                      className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-700 inline-block"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3
                  className={`text-sm font-medium ${
                    step.completed
                      ? 'text-stone-700 dark:text-stone-300'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {t(meta.titleKey)}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                  {t(meta.descriptionKey)}
                </p>
              </div>
              <div className="mt-3 pt-2">
                <a
                  href={step.actionUrl}
                  className={`inline-flex items-center gap-1 text-xs ${
                    step.completed
                      ? 'font-medium text-emerald-700 dark:text-emerald-400 hover:underline'
                      : 'font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                  }`}
                >
                  <span>{t(meta.actionKey)}</span>
                  <AletheiaIcon name="arrow-right" size="sm" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
