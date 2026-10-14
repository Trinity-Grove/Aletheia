'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Progress,
} from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface First30DaysChecklistCardProps {
  familyId: string;
  learnersCount?: number | undefined;
  initialCompletedSteps?: string[] | undefined;
  onStepToggle?(stepKey: string, completed: boolean): void;
}

interface ChecklistStepDef {
  key: string;
  actionUrl: string;
}

const CHECKLIST_STEPS: readonly ChecklistStepDef[] = [
  { key: 'step1', actionUrl: '/learners' },
  { key: 'step2', actionUrl: '/curriculum' },
  { key: 'step3', actionUrl: '/schedule' },
  { key: 'step4', actionUrl: '/records' },
  { key: 'step5', actionUrl: '/devotional' },
  { key: 'step6', actionUrl: '/reports' },
];

function getInitialSteps(
  familyId: string,
  learnersCount?: number | undefined,
  initialCompletedSteps?: string[] | undefined
): string[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(
        `aletheia_checklist_30days_${familyId}`
      );
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      }
    } catch {
      // Safe fallback if JSON parsing fails
    }
  }

  if (initialCompletedSteps && initialCompletedSteps.length > 0) {
    return initialCompletedSteps;
  }

  if (learnersCount !== undefined && learnersCount > 0) {
    return ['step1'];
  }

  return [];
}

export function First30DaysChecklistCard({
  familyId,
  learnersCount,
  initialCompletedSteps,
  onStepToggle,
}: First30DaysChecklistCardProps) {
  const { t } = useLocale();

  const [completedSteps, setCompletedSteps] = useState<string[]>(() =>
    getInitialSteps(familyId, learnersCount, initialCompletedSteps)
  );

  useEffect(() => {
    setCompletedSteps(getInitialSteps(familyId, learnersCount, initialCompletedSteps));
  }, [familyId, learnersCount, initialCompletedSteps]);

  const handleToggle = (stepKey: string) => {
    const isCompleted = completedSteps.includes(stepKey);
    const next = isCompleted
      ? completedSteps.filter((k) => k !== stepKey)
      : [...completedSteps, stepKey];

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          `aletheia_checklist_30days_${familyId}`,
          JSON.stringify(next)
        );
      } catch {
        // Safe fallback if localStorage is unavailable
      }
    }

    setCompletedSteps(next);
    onStepToggle?.(stepKey, !isCompleted);
  };

  const total = CHECKLIST_STEPS.length;
  const completed = completedSteps.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <Card className="legal-checklist-card" data-testid="first-30-days-checklist-card">
      <CardHeader className="legal-checklist-header">
        <CardTitle as="h2" className="legal-checklist-title">
          {t('legalGuide.checklist.title')}
        </CardTitle>
        <CardDescription className="legal-checklist-subtitle">
          {t('legalGuide.checklist.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="legal-checklist-content">
        <div className="legal-checklist-progress">
          <span className="legal-checklist-progress-text">
            {t('legalGuide.checklist.progress', { completed, total, percentage })}
          </span>
          <Progress
            value={percentage}
            max={100}
            label={t('legalGuide.checklist.title')}
          />
        </div>

        <div className="legal-checklist-items">
          {CHECKLIST_STEPS.map((step) => {
            const isStepCompleted = completedSteps.includes(step.key);

            return (
              <div
                key={step.key}
                className={`legal-checklist-item ${
                  isStepCompleted ? 'legal-checklist-item--completed' : ''
                }`.trim()}
                data-testid={`checklist-step-${step.key}`}
              >
                <div className="legal-checklist-item-main">
                  <Checkbox
                    id={`checklist-${familyId}-${step.key}`}
                    checked={isStepCompleted}
                    onChange={() => handleToggle(step.key)}
                    label={t(`legalGuide.checklist.steps.${step.key}.title`)}
                    description={t(`legalGuide.checklist.steps.${step.key}.description`)}
                  />
                </div>
                <div className="legal-checklist-item-action">
                  <Link
                    href={step.actionUrl}
                    className="legal-checklist-action-link"
                  >
                    {t(`legalGuide.checklist.steps.${step.key}.action`)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
