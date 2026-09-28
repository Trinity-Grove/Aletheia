'use client';

import React from 'react';
import { Card } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface TheologicalLensCardProps {
  preferredTraditionCode?: string | null | undefined;
  disciplineCode?: string | undefined;
  disciplineName?: string | undefined;
}

type TraditionKey =
  | 'reformed'
  | 'baptist'
  | 'lutheran'
  | 'wesleyanArminian'
  | 'pentecostal'
  | 'ecumenical';

function resolveTraditionKey(code?: string | null): TraditionKey {
  if (!code) return 'ecumenical';
  const upper = code.toUpperCase();
  if (upper.includes('REFORMED') || upper.includes('PRESBYTERIAN')) {
    return 'reformed';
  }
  if (upper.includes('BAPTIST')) {
    return 'baptist';
  }
  if (upper.includes('LUTHERAN')) {
    return 'lutheran';
  }
  if (upper.includes('WESLEYAN') || upper.includes('ARMINIAN') || upper.includes('METHODIST')) {
    return 'wesleyanArminian';
  }
  if (upper.includes('PENTECOSTAL') || upper.includes('CHARISMATIC')) {
    return 'pentecostal';
  }
  return 'ecumenical';
}

export function TheologicalLensCard({
  preferredTraditionCode,
  disciplineCode,
  disciplineName,
}: TheologicalLensCardProps) {
  const { t } = useLocale();
  const traditionKey = resolveTraditionKey(preferredTraditionCode);

  const traditionName = t(`curriculum.seminary.lensTraditions.${traditionKey}`);
  const summary = t(`curriculum.seminary.lensTraditions.${traditionKey}Summary`);
  const sources = t(`curriculum.seminary.lensTraditions.${traditionKey}Sources`);

  return (
    <Card
      data-testid="theological-lens-card"
      style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--gold-dark)',
              marginBottom: '0.25rem',
            }}
          >
            {t('curriculum.seminary.lensTitle')}
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--forest)',
            }}
          >
            {traditionName}
          </h4>
        </div>
        {disciplineCode && (
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(56, 102, 65, 0.1)',
              color: 'var(--forest)',
              fontFamily: 'monospace',
            }}
          >
            {disciplineCode}
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        {summary}
      </p>

      {disciplineName && (
        <div
          style={{
            fontSize: '0.8rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <strong>{disciplineName}:</strong> {t('curriculum.seminary.lensDescription')}
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: '0.35rem',
          }}
        >
          {t('curriculum.seminary.sourcesLabel')}
        </div>
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            lineHeight: 1.45,
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--bg-canvas, #f8f9fa)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--gold-dark)',
          }}
        >
          {sources}
        </div>
      </div>
    </Card>
  );
}
