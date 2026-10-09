'use client';

import React from 'react';
import type { LearnerGamificationSummaryDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { BadgeTile, GROWTH_LEVEL_ICONS } from '../learner-portal/learner-badges-view';

export interface LearnerPortalBadgesSectionProps {
  summary: LearnerGamificationSummaryDto;
  learnerName: string;
}

// Guardian-side, read-only glimpse of one learner's portal badges. Shows
// only this learner's own journey -- never side by side with a sibling.
export function LearnerPortalBadgesSection({ summary, learnerName }: LearnerPortalBadgesSectionProps) {
  const { t, formatNumber } = useLocale();
  const earned = summary.badges.filter((badge) => badge.earned);

  return (
    <section data-testid="guardian-portal-badges" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.0625rem', color: 'var(--forest)' }}>{t('learnerBadges.guardian.title')}</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {t('learnerBadges.guardian.subtitle', { name: learnerName })}
          </p>
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--forest)', textAlign: 'right' }}>
          <div>
            <span aria-hidden="true">{GROWTH_LEVEL_ICONS[summary.level.code]} </span>
            {t(`learnerBadges.levels.${summary.level.code}`)} ·{' '}
            {t('learnerBadges.summary.levelLabel', { number: summary.level.number })}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('learnerBadges.summary.earnedRatio', {
              earned: formatNumber(summary.earnedCount),
              total: formatNumber(summary.totalCount),
            })}
          </div>
        </div>
      </div>
      {earned.length === 0 ? (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {t('learnerBadges.guardian.empty')}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
            gap: '0.75rem',
            marginTop: '0.75rem',
          }}
        >
          {earned.map((badge) => (
            <BadgeTile key={badge.code} badge={{ ...badge, isNew: false }} />
          ))}
        </div>
      )}
    </section>
  );
}
