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
    const cardWidth = typeof window !== 'undefined' ? Math.min(440, window.innerWidth - 32) : 440;
    const cardHeight = typeof window !== 'undefined' ? Math.min(360, window.innerHeight - 32) : 260;
    let top = targetRect.bottom + margin;
    let left = targetRect.left;

    if (typeof window !== 'undefined') {
      const isSidebar = targetRect.left < 260 && targetRect.right <= 320;
      const isNearRight = targetRect.right > window.innerWidth - 300;

      if (isSidebar) {
        left = targetRect.right + margin;
        top = Math.max(margin, Math.min(targetRect.top + 20, window.innerHeight - cardHeight - margin));
      } else if (isNearRight) {
        left = Math.max(margin, targetRect.right - cardWidth);
        top = targetRect.bottom + margin;
      } else {
        left = Math.max(margin, Math.min(targetRect.left, window.innerWidth - cardWidth - margin));
        top = targetRect.bottom + margin;
      }

      if (!isSidebar && top + cardHeight > window.innerHeight && targetRect.top - cardHeight > margin) {
        top = Math.max(margin, targetRect.top - cardHeight - margin);
      }

      top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: 'min(440px, calc(100vw - 32px))',
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
      className="guided-tour-root"
    >
      {isFallback ? (
        <div
          data-testid="tour-backdrop"
          className="guided-tour-backdrop guided-tour-backdrop--fallback"
        />
      ) : (
        <>
          <div
            data-testid="tour-backdrop"
            className="guided-tour-backdrop"
          />
          <div
            data-testid="tour-spotlight-highlight"
            className="guided-tour-spotlight"
            style={{
              top: Math.max(0, targetRect ? targetRect.top - 6 : 0),
              left: Math.max(0, targetRect ? targetRect.left - 6 : 0),
              width: (targetRect ? targetRect.width : 0) + 12,
              height: (targetRect ? targetRect.height : 0) + 12,
            }}
          />
        </>
      )}

      <div
        className={
          isFallback || !targetRect || targetRect.width === 0
            ? 'guided-tour-card-container guided-tour-card-container--centered'
            : 'guided-tour-card-container'
        }
        style={
          !isFallback && targetRect && targetRect.width > 0
            ? tooltipStyle
            : undefined
        }
      >
        <div
          data-testid="tour-card"
          data-fallback={isFallback ? 'true' : 'false'}
          className="guided-tour-card"
        >
          <div className="guided-tour-header">
            <span
              data-testid="tour-step-indicator"
              className="guided-tour-indicator"
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
              className="guided-tour-close-btn"
            >
              <AletheiaIcon name="x" size="sm" aria-hidden={true} />
            </button>
          </div>

          {isLastStep ? (
            <div className="guided-tour-celebrate-wrap">
              <div className="guided-tour-celebrate-icon">
                <AletheiaIcon name="sparkles" size="md" aria-hidden={true} />
              </div>
              <div>
                <h3
                  id="tour-step-title"
                  data-testid="tour-step-title"
                  className="guided-tour-title"
                >
                  {t(currentStep.titleKey)}
                </h3>
                <p
                  id="tour-step-description"
                  data-testid="tour-step-description"
                  className="guided-tour-description"
                >
                  {t(currentStep.descriptionKey)}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h3
                id="tour-step-title"
                data-testid="tour-step-title"
                className="guided-tour-title"
              >
                {t(currentStep.titleKey)}
              </h3>
              <p
                id="tour-step-description"
                data-testid="tour-step-description"
                className="guided-tour-description"
              >
                {t(currentStep.descriptionKey)}
              </p>
            </div>
          )}

          <div className="guided-tour-footer">
            <Button
              variant="ghost"
              onClick={handleSkip}
              data-testid="tour-skip-btn"
              size="sm"
            >
              {t('dashboard.tour.controls.skip')}
            </Button>

            <div className="guided-tour-controls">
              <Button
                variant="secondary"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                data-testid="tour-prev-btn"
                size="sm"
              >
                {t('dashboard.tour.controls.prev')}
              </Button>

              {isLastStep ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  data-testid="tour-finish-btn"
                  size="sm"
                >
                  {t('dashboard.tour.controls.finish')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  data-testid="tour-next-btn"
                  size="sm"
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
