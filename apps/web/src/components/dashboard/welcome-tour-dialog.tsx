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
      className="welcome-tour-backdrop"
    >
      <div className="welcome-tour-modal">
        <div className="welcome-tour-icon">
          <AletheiaIcon name="compass" size="xl" aria-hidden={true} />
        </div>

        <h2
          id="welcome-tour-title"
          className="welcome-tour-title"
        >
          {t('dashboard.tour.welcome.title')}
        </h2>

        <p
          id="welcome-tour-subtitle"
          className="welcome-tour-subtitle"
        >
          {t('dashboard.tour.welcome.subtitle')}
        </p>

        <div className="welcome-tour-actions">
          <Button
            variant="primary"
            onClick={onStartTour}
            style={{ width: '100%' }}
            data-testid="welcome-tour-start-btn"
          >
            {t('dashboard.tour.welcome.start')}
          </Button>

          <Button
            variant="ghost"
            onClick={handleDismiss}
            isLoading={isDismissing}
            style={{ width: '100%' }}
            data-testid="welcome-tour-dismiss-btn"
          >
            {t('dashboard.tour.welcome.dismissNever')}
          </Button>
        </div>
      </div>
    </div>
  );
}
