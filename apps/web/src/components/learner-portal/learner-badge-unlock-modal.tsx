'use client';

import React from 'react';
import { Button } from '@aletheia/ui';
import type { LearnerBadgeDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { BADGE_TIER_COLORS } from './learner-badges-view';

export interface LearnerBadgeUnlockModalProps {
  badges: LearnerBadgeDto[];
  learnerName: string;
  onClose: () => void;
}

export function LearnerBadgeUnlockModal({ badges, learnerName, onClose }: LearnerBadgeUnlockModalProps) {
  const { t } = useLocale();
  if (badges.length === 0) return null;

  const title = badges.length === 1
    ? t('learnerBadges.unlock.title')
    : t('learnerBadges.unlock.titleMany', { count: badges.length });

  return (
    <div
      data-testid="badge-unlock-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-unlock-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <style>{`
        @keyframes aletheia-badge-pop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .aletheia-badge-pop { animation: aletheia-badge-pop 0.5s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .aletheia-badge-pop { animation: none; }
        }
      `}</style>
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '28rem',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '2rem 1.5rem 1.5rem',
          boxShadow: 'var(--shadow-xl)',
          textAlign: 'center',
        }}
      >
        <div aria-hidden="true" style={{ fontSize: '2rem' }}>🎉</div>
        <h2
          id="badge-unlock-title"
          style={{ margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-serif)', color: 'var(--forest)', fontSize: '1.5rem' }}
        >
          {title}
        </h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {t('learnerBadges.unlock.subtitle', { name: learnerName })}
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {badges.map((badge, index) => (
            <li
              key={badge.code}
              data-testid={`unlocked-badge-${badge.code}`}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}
            >
              <span
                aria-hidden="true"
                className="aletheia-badge-pop"
                style={{
                  flexShrink: 0,
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  border: `3px solid ${BADGE_TIER_COLORS[badge.tier]}`,
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                {badge.icon}
              </span>
              <span>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t(`learnerBadges.items.${badge.code}.title`)}
                </span>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {t(`learnerBadges.items.${badge.code}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '1.75rem' }}>
          <Button type="button" data-testid="badge-unlock-continue-btn" onClick={onClose}>
            {t('learnerBadges.unlock.continueButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
