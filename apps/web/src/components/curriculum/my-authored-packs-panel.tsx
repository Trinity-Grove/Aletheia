'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, EmptyState } from '@aletheia/ui';
import type {
  AuthorTrustProfileResponseDto,
  CurriculumPackModerationStatus,
  CurriculumPackResponseDto,
} from '@aletheia/contracts';
import { AuthorTrustBadge } from './author-trust-badge';
import { useLocale } from '../../lib/i18n/locale-context';

const STATUS_KEYS: Record<CurriculumPackModerationStatus, string> = {
  DRAFT: 'curriculum.community.statusDraft',
  PENDING_REVIEW: 'curriculum.community.statusPendingReview',
  APPROVED: 'curriculum.community.statusApproved',
  REJECTED: 'curriculum.community.statusRejected',
  SUSPENDED: 'curriculum.community.statusSuspended',
};

const STATUS_STYLES: Record<CurriculumPackModerationStatus, { backgroundColor: string; color: string }> = {
  DRAFT: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  PENDING_REVIEW: { backgroundColor: '#FEF3C7', color: '#92400E' },
  APPROVED: { backgroundColor: '#ECFDF5', color: '#047857' },
  REJECTED: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
  SUSPENDED: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};

export function MyAuthoredPacksPanel() {
  const { t } = useLocale();
  const [packs, setPacks] = useState<CurriculumPackResponseDto[]>([]);
  const [profile, setProfile] = useState<AuthorTrustProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; kind: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [packsRes, profileRes] = await Promise.all([
        fetch('/api/v1/curriculum-packs/my-packs', { credentials: 'include' }),
        fetch('/api/v1/curriculum-packs/author-profile', { credentials: 'include' }),
      ]);
      if (!packsRes.ok || !profileRes.ok) {
        setLoadError(true);
        return;
      }
      setPacks(await packsRes.json());
      setProfile(await profileRes.json());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmitForReview = async (packId: string) => {
    setSubmittingId(packId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/curriculum-packs/${packId}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        setFeedback({ id: packId, kind: 'error' });
        return;
      }
      setFeedback({ id: packId, kind: 'success' });
      await loadData();
    } catch {
      setFeedback({ id: packId, kind: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <div data-testid="my-authored-packs-loading">…</div>;
  }

  if (loadError) {
    return (
      <Alert variant="error" data-testid="my-authored-packs-error">
        {t('curriculum.community.myPacksLoadError')}
      </Alert>
    );
  }

  return (
    <div data-testid="my-authored-packs-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AuthorTrustBadge tier={profile.tier} trustScore={profile.trustScore} showScore />
        </div>
      )}

      {packs.length === 0 ? (
        <EmptyState
          data-testid="my-authored-packs-empty"
          title={t('curriculum.community.myPacksEmpty')}
        />
      ) : (
        packs.map((pack) => (
          <Card key={pack.id} data-testid={`my-authored-pack-${pack.id}`} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{pack.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{pack.code}</div>
              </div>
              {pack.moderationStatus && (
                <span
                  data-testid={`my-authored-pack-status-${pack.id}`}
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    ...STATUS_STYLES[pack.moderationStatus],
                  }}
                >
                  {t(STATUS_KEYS[pack.moderationStatus])}
                </span>
              )}
            </div>

            {pack.moderationNotes && (pack.moderationStatus === 'REJECTED' || pack.moderationStatus === 'SUSPENDED') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                <strong>{t('curriculum.community.moderationNotesLabel')}</strong> {pack.moderationNotes}
              </div>
            )}

            {feedback?.id === pack.id && feedback.kind === 'success' && (
              <Alert variant="success" data-testid={`submit-for-review-success-${pack.id}`} style={{ marginTop: '0.5rem' }}>
                {t('curriculum.community.submitForReviewSuccessMsg')}
              </Alert>
            )}
            {feedback?.id === pack.id && feedback.kind === 'error' && (
              <Alert variant="error" data-testid={`submit-for-review-error-${pack.id}`} style={{ marginTop: '0.5rem' }}>
                {t('curriculum.community.submitForReviewErrorMsg')}
              </Alert>
            )}

            {pack.moderationStatus === 'DRAFT' && (
              <div style={{ marginTop: '0.75rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`submit-for-review-btn-${pack.id}`}
                  isLoading={submittingId === pack.id}
                  disabled={submittingId === pack.id}
                  onClick={() => handleSubmitForReview(pack.id)}
                >
                  {submittingId === pack.id
                    ? t('curriculum.community.submittingForReviewBtn')
                    : t('curriculum.community.submitForReviewBtn')}
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
