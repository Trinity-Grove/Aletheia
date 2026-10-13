'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Button } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface WelcomeTourDialogProps {
  familyId: string;
  isOpen: boolean;
  onStartTour(): void;
  onDismiss(): void;
}

export function WelcomeTourDialog({
  familyId,
  isOpen,
  onStartTour,
  onDismiss,
}: WelcomeTourDialogProps) {
  const { t } = useLocale();
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) {
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
      // Non-fatal if offline or network error, dismiss locally
    } finally {
      setIsDismissing(false);
      onDismiss();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
      aria-describedby="welcome-tour-subtitle"
      data-testid="welcome-tour-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 text-center shadow-2xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          <AletheiaIcon name="compass" size="xl" aria-hidden={true} />
        </div>

        <h2
          id="welcome-tour-title"
          className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100"
        >
          {t('dashboard.tour.welcome.title')}
        </h2>

        <p
          id="welcome-tour-subtitle"
          className="mt-2 text-sm text-stone-600 dark:text-stone-400"
        >
          {t('dashboard.tour.welcome.subtitle')}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={onStartTour}
            className="w-full"
            data-testid="welcome-tour-start-btn"
          >
            {t('dashboard.tour.welcome.start')}
          </Button>

          <Button
            variant="ghost"
            onClick={handleDismiss}
            isLoading={isDismissing}
            className="w-full text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            data-testid="welcome-tour-dismiss-btn"
          >
            {t('dashboard.tour.welcome.dismissNever')}
          </Button>
        </div>
      </div>
    </div>
  );
}
