'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AletheiaIcon, Button } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface TourStep {
  targetSelector?: string;
  titleKey: string;
  descriptionKey: string;
}

export interface GuidedTourProps {
  isOpen: boolean;
  familyId: string;
  steps?: TourStep[];
  onComplete(): Promise<void> | void;
  onSkip(): Promise<void> | void;
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-testid="appshell-nav"]',
    titleKey: 'dashboard.tour.steps.step1.title',
    descriptionKey: 'dashboard.tour.steps.step1.description',
  },
  {
    targetSelector: '[data-testid="learner-focus-container"]',
    titleKey: 'dashboard.tour.steps.step2.title',
    descriptionKey: 'dashboard.tour.steps.step2.description',
  },
  {
    targetSelector: '[data-testid="scripture-card"]',
    titleKey: 'dashboard.tour.steps.step3.title',
    descriptionKey: 'dashboard.tour.steps.step3.description',
  },
  {
    targetSelector: '[data-testid="dashboard-content"]',
    titleKey: 'dashboard.tour.steps.step4.title',
    descriptionKey: 'dashboard.tour.steps.step4.description',
  },
  {
    titleKey: 'dashboard.tour.steps.step5.title',
    descriptionKey: 'dashboard.tour.steps.step5.description',
  },
];

export function GuidedTour({
  isOpen,
  steps,
  onComplete,
  onSkip,
}: GuidedTourProps) {
  const { t } = useLocale();
  const effectiveSteps = useMemo(() => steps ?? DEFAULT_TOUR_STEPS, [steps]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const totalSteps = effectiveSteps.length;
  const currentStep = effectiveSteps[currentStepIndex] ?? effectiveSteps[0];
  const isLastStep = currentStepIndex >= totalSteps - 1;

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep?.targetSelector) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      setTargetElement(el);
      setTargetRect(el.getBoundingClientRect());
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch {
        // Fallback for environments lacking smooth scroll
      }
    } else {
      setTargetElement(null);
      setTargetRect(null);
    }
  }, [isOpen, currentStep?.targetSelector]);

  useEffect(() => {
    updateTargetPosition();
  }, [updateTargetPosition]);

  useEffect(() => {
    if (!isOpen || !targetElement) return;

    const handleWindowChange = () => {
      setTargetRect(targetElement.getBoundingClientRect());
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, targetElement]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSkip]);

  const handleNext = async () => {
    if (isLastStep) {
      await onComplete();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = async () => {
    await onSkip();
  };

  const isFallback = !currentStep?.targetSelector || !targetElement;

  const tooltipStyle: React.CSSProperties = useMemo(() => {
    if (isFallback || !targetRect || targetRect.width === 0) {
      return {};
    }
    const margin = 16;
    const cardWidth = 420;
    let top = targetRect.bottom + margin;
    let left = targetRect.left;

    if (typeof window !== 'undefined') {
      if (top + 280 > window.innerHeight && targetRect.top - 280 > margin) {
        top = Math.max(margin, targetRect.top - 280 - margin);
      }
      if (left + cardWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - cardWidth - margin);
      }
      if (left < margin) {
        left = margin;
      }
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: 'min(420px, calc(100vw - 32px))',
    };
  }, [isFallback, targetRect]);

  if (!isOpen || !currentStep) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-description"
      data-testid="guided-tour"
      className="fixed inset-0 z-50 pointer-events-none"
    >
      {isFallback && (
        <div
          data-testid="tour-backdrop"
          className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm pointer-events-auto"
        />
      )}

      {!isFallback && (
        <div
          data-testid="tour-spotlight-highlight"
          className="fixed z-40 rounded-lg pointer-events-none transition-all duration-300 ring-2 ring-amber-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
          style={{
            top: Math.max(0, targetRect ? targetRect.top - 6 : 0),
            left: Math.max(0, targetRect ? targetRect.left - 6 : 0),
            width: (targetRect ? targetRect.width : 0) + 12,
            height: (targetRect ? targetRect.height : 0) + 12,
          }}
        />
      )}

      <div
        className={`fixed z-50 pointer-events-auto ${
          isFallback || !targetRect || targetRect.width === 0
            ? 'inset-0 flex items-center justify-center p-4'
            : ''
        }`}
        style={
          !isFallback && targetRect && targetRect.width > 0
            ? tooltipStyle
            : undefined
        }
      >
        <div
          data-testid="tour-card"
          data-fallback={isFallback ? 'true' : 'false'}
          className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span
              data-testid="tour-step-indicator"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
            >
              <AletheiaIcon name="compass" size="sm" aria-hidden={true} />
              {t('dashboard.tour.controls.stepIndicator', {
                current: currentStepIndex + 1,
                total: totalSteps,
              })}
            </span>

            <button
              type="button"
              onClick={handleSkip}
              aria-label={t('dashboard.tour.controls.skip')}
              data-testid="tour-close-btn"
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors"
            >
              <AletheiaIcon name="x" size="sm" aria-hidden={true} />
            </button>
          </div>

          {isLastStep ? (
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                <AletheiaIcon name="sparkles" size="md" aria-hidden={true} />
              </div>
              <div>
                <h3
                  id="tour-step-title"
                  data-testid="tour-step-title"
                  className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100"
                >
                  {t(currentStep.titleKey)}
                </h3>
                <p
                  id="tour-step-description"
                  data-testid="tour-step-description"
                  className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed"
                >
                  {t(currentStep.descriptionKey)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h3
                id="tour-step-title"
                data-testid="tour-step-title"
                className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100"
              >
                {t(currentStep.titleKey)}
              </h3>
              <p
                id="tour-step-description"
                data-testid="tour-step-description"
                className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed"
              >
                {t(currentStep.descriptionKey)}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <Button
              variant="ghost"
              onClick={handleSkip}
              data-testid="tour-skip-btn"
              className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-xs sm:text-sm"
            >
              {t('dashboard.tour.controls.skip')}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                data-testid="tour-prev-btn"
                className="text-xs sm:text-sm"
              >
                {t('dashboard.tour.controls.prev')}
              </Button>

              {isLastStep ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  data-testid="tour-finish-btn"
                  className="text-xs sm:text-sm"
                >
                  {t('dashboard.tour.controls.finish')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  data-testid="tour-next-btn"
                  className="text-xs sm:text-sm"
                >
                  {t('dashboard.tour.controls.next')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
