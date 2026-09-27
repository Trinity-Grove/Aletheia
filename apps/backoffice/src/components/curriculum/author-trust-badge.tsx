'use client';

import React from 'react';
import type { AuthorTrustTier } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface AuthorTrustBadgeProps {
  tier: AuthorTrustTier;
  trustScore?: number | null | undefined;
  showScore?: boolean | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

const TIER_ICONS: Record<AuthorTrustTier, string> = {
  NOVICE: '🌱',
  VERIFIED: '✓',
  TRUSTED: '🛡️',
};

const TIER_KEYS: Record<AuthorTrustTier, string> = {
  NOVICE: 'curriculum.moderation.badgeNovice',
  VERIFIED: 'curriculum.moderation.badgeVerified',
  TRUSTED: 'curriculum.moderation.badgeTrusted',
};

const TIER_STYLES: Record<
  AuthorTrustTier,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  NOVICE: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    borderColor: '#E5E7EB',
  },
  VERIFIED: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    borderColor: '#BFDBFE',
  },
  TRUSTED: {
    backgroundColor: '#ECFDF5',
    color: '#047857',
    borderColor: '#A7F3D0',
  },
};

export function AuthorTrustBadge({
  tier,
  trustScore,
  showScore = false,
  className = '',
  style = {},
}: AuthorTrustBadgeProps) {
  const { t } = useLocale();

  const labelKey = TIER_KEYS[tier];
  const label = labelKey ? t(labelKey) : tier;
  const icon = TIER_ICONS[tier] || '';
  const theme = TIER_STYLES[tier] || {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    borderColor: '#E5E7EB',
  };

  const title =
    trustScore != null
      ? t('curriculum.moderation.scoreTooltip', { score: trustScore })
      : undefined;

  return (
    <span
      data-testid="author-trust-badge"
      data-tier={tier}
      title={title}
      className={`author-trust-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontWeight: 600,
        fontSize: '0.75rem',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: 1.25,
        ...theme,
        ...style,
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
      {showScore && trustScore != null && (
        <span style={{ opacity: 0.85, fontSize: '0.6875rem' }}>({trustScore})</span>
      )}
    </span>
  );
}
