'use client';

import React from 'react';
import { Alert } from '@aletheia/ui';
import type {
  LearnerBadgeCategory,
  LearnerBadgeDto,
  LearnerBadgeTier,
  LearnerGamificationSummaryDto,
  LearnerGrowthLevel,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export const GROWTH_LEVEL_ICONS: Record<LearnerGrowthLevel, string> = {
  SEED: '🌰',
  SPROUT: '🌱',
  SEEDLING: '🌿',
  SAPLING: '🪴',
  YOUNG_TREE: '🌲',
  FLOURISHING_TREE: '🌳',
  FRUITFUL_TREE: '🍎',
  MIGHTY_OAK: '🏞️',
};

export const BADGE_TIER_COLORS: Record<LearnerBadgeTier, string> = {
  BRONZE: '#b87333',
  SILVER: '#8a96a8',
  GOLD: 'var(--gold)',
};

const CATEGORY_ORDER: LearnerBadgeCategory[] = [
  'CONSISTENCY',
  'LEARNING',
  'EVIDENCE',
  'MASTERY',
  'EXPLORATION',
  'CHARACTER',
];

export interface LearnerBadgesViewProps {
  summary: LearnerGamificationSummaryDto | null;
  loading: boolean;
  error: string | null;
}

export function BadgeTile({ badge }: { badge: LearnerBadgeDto }) {
  const { t, formatDate, formatNumber } = useLocale();
  const isHours = badge.metric === 'LEARNING_MINUTES';
  const current = Math.min(badge.current, badge.threshold);
  const percent = Math.round((current / badge.threshold) * 100);
  const title = t(`learnerBadges.items.${badge.code}.title`);
  const description = t(`learnerBadges.items.${badge.code}.description`);
  const progressText = isHours
    ? t('learnerBadges.badge.progressHours', {
        current: formatNumber(Math.floor(current / 60)),
        threshold: formatNumber(badge.threshold / 60),
      })
    : t('learnerBadges.badge.progress', {
        current: formatNumber(current),
        threshold: formatNumber(badge.threshold),
      });
  const tierColor = BADGE_TIER_COLORS[badge.tier];

  return (
    <article
      data-testid={`badge-tile-${badge.code}`}
      data-earned={badge.earned}
      aria-label={`${title} — ${badge.earned ? t(`learnerBadges.tiers.${badge.tier}`) : t('learnerBadges.badge.locked')}`}
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid',
        borderColor: badge.earned ? tierColor : 'var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.375rem',
        boxShadow: badge.earned ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {badge.isNew && (
        <span
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: 'var(--forest)',
            borderRadius: 'var(--radius-full)',
            padding: '0.125rem 0.5rem',
          }}
        >
          {t('learnerBadges.badge.newTag')}
        </span>
      )}
      <div
        aria-hidden="true"
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          border: `3px solid ${badge.earned ? tierColor : 'var(--border-light)'}`,
          backgroundColor: badge.earned ? 'var(--bg-canvas)' : 'transparent',
          filter: badge.earned ? 'none' : 'grayscale(1)',
          opacity: badge.earned ? 1 : 0.45,
        }}
      >
        {badge.icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</div>
      <div
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: badge.earned ? tierColor : 'var(--text-secondary)',
        }}
      >
        {t(`learnerBadges.tiers.${badge.tier}`)}
      </div>
      {badge.earned && badge.awardedAt ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {t('learnerBadges.badge.earnedOn', {
            date: formatDate(badge.awardedAt, { day: 'numeric', month: 'short', year: 'numeric' }),
          })}
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: '0.25rem' }}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={badge.threshold}
            aria-valuenow={current}
            aria-label={progressText}
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border-light)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: 'var(--sage)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {progressText}
          </div>
        </div>
      )}
    </article>
  );
}

export function LearnerBadgesView({ summary, loading, error }: LearnerBadgesViewProps) {
  const { t, formatNumber } = useLocale();

  if (loading && !summary) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        {t('learnerBadges.loading')}
      </div>
    );
  }
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!summary) return null;

  const { level, streak } = summary;
  const span = level.nextLevelXp === null ? 1 : level.nextLevelXp - level.currentLevelXp;
  const levelPercent =
    level.nextLevelXp === null ? 100 : Math.round(((summary.xp - level.currentLevelXp) / span) * 100);
  const streakText = streak.current === 1
    ? t('learnerBadges.streak.oneDay')
    : t('learnerBadges.streak.days', { count: formatNumber(streak.current) });

  return (
    <section data-testid="learner-badges-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
        {/* Growth level */}
        <div
          data-testid="badges-level-card"
          style={{
            backgroundColor: 'var(--forest)',
            color: '#ffffff',
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--gold)',
            }}
          >
            {t('learnerBadges.summary.eyebrow')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>
              {GROWTH_LEVEL_ICONS[level.code]}
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500 }}>
                {t(`learnerBadges.levels.${level.code}`)}
              </div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
                {t('learnerBadges.summary.levelLabel', { number: level.number })} ·{' '}
                {t('learnerBadges.summary.xp', { xp: formatNumber(summary.xp) })}
              </div>
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={levelPercent}
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${levelPercent}%`,
                height: '100%',
                backgroundColor: 'var(--gold)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.5rem', opacity: 0.9 }}>
            {level.nextLevelXp === null
              ? t('learnerBadges.summary.maxLevel')
              : t('learnerBadges.summary.toNextLevel', {
                  xp: formatNumber(level.nextLevelXp - summary.xp),
                  level: t(`learnerBadges.levels.${nextLevelCode(level.code)}`),
                })}
          </div>
        </div>

        {/* Streak */}
        <div
          data-testid="badges-streak-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--gold-dark)',
            }}
          >
            {t('learnerBadges.streak.title')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.75rem 0 0.25rem' }}>
            <span aria-hidden="true" style={{ fontSize: '2rem', filter: streak.current > 0 ? 'none' : 'grayscale(1)' }}>
              🔥
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--forest)' }}>{streakText}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {t('learnerBadges.streak.longest', { count: formatNumber(streak.longest) })}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.75rem', fontWeight: 600 }}>
            {streak.activeToday ? t('learnerBadges.streak.activeToday') : t('learnerBadges.streak.keepGoing')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {t('learnerBadges.streak.restNote')}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--forest)' }} data-testid="badges-earned-ratio">
        {t('learnerBadges.summary.earnedRatio', {
          earned: formatNumber(summary.earnedCount),
          total: formatNumber(summary.totalCount),
        })}
      </div>

      {CATEGORY_ORDER.map((category) => {
        const badges = summary.badges.filter((badge) => badge.category === category);
        if (badges.length === 0) return null;
        return (
          <div key={category} data-testid={`badge-category-${category}`}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.0625rem', color: 'var(--forest)' }}>
              {t(`learnerBadges.categories.${category}`)}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '0.75rem' }}>
              {badges.map((badge) => (
                <BadgeTile key={badge.code} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

const LEVEL_SEQUENCE = Object.keys(GROWTH_LEVEL_ICONS) as LearnerGrowthLevel[];

function nextLevelCode(code: LearnerGrowthLevel): LearnerGrowthLevel {
  const index = LEVEL_SEQUENCE.indexOf(code);
  return LEVEL_SEQUENCE[Math.min(index + 1, LEVEL_SEQUENCE.length - 1)]!;
}
