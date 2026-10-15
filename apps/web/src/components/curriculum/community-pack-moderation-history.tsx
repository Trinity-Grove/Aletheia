'use client';

import React, { useState } from 'react';
import { Alert, Button } from '@aletheia/ui';
import type { CurriculumPackModerationHistoryResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

interface CommunityPackModerationHistoryProps {
  packId: string;
}

const EVENT_KEYS: Record<CurriculumPackModerationHistoryResponseDto['event'], string> = {
  CREATED: 'curriculum.community.historyEventCreated',
  EDITED: 'curriculum.community.historyEventEdited',
  SUBMITTED: 'curriculum.community.historyEventSubmitted',
  APPROVED: 'curriculum.community.historyEventApproved',
  REJECTED: 'curriculum.community.historyEventRejected',
  SUSPENDED: 'curriculum.community.historyEventSuspended',
  RESTORED: 'curriculum.community.historyEventRestored',
  ARCHIVED: 'curriculum.community.historyEventArchived',
};

export function CommunityPackModerationHistory({ packId }: CommunityPackModerationHistoryProps) {
  const { t, formatDate } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [entries, setEntries] = useState<CurriculumPackModerationHistoryResponseDto[]>([]);

  const loadHistory = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/curriculum-packs/${packId}/moderation-history`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('history load failed');
      setEntries(await response.json());
      setOpen(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <Button
        variant="secondary"
        size="sm"
        data-testid={`view-moderation-history-btn-${packId}`}
        onClick={() => void loadHistory()}
        isLoading={loading}
        disabled={loading}
      >
        {t('curriculum.community.viewHistoryBtn')}
      </Button>
      {error && (
        <Alert variant="error" data-testid={`moderation-history-error-${packId}`} style={{ marginTop: '0.5rem' }}>
          {t('curriculum.community.historyLoadError')}{' '}
          <Button variant="secondary" size="sm" onClick={() => void loadHistory()}>
            {t('curriculum.community.retryHistoryBtn')}
          </Button>
        </Alert>
      )}
      {open && !error && (
        <div
          data-testid={`moderation-history-${packId}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.625rem', padding: '0.625rem 0.75rem', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}
        >
          <strong style={{ color: 'var(--forest)', fontSize: '0.8125rem' }}>{t('curriculum.community.historyTitle')}</strong>
          {entries.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{t('curriculum.community.historyEmpty')}</span>
          ) : entries.map((entry) => (
            <div key={entry.id} data-testid={`moderation-history-entry-${entry.id}`} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{t(EVENT_KEYS[entry.event])}</strong> · {formatDate(entry.createdAt)}
              {entry.notes && <div>{entry.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
