'use client';

import React from 'react';
import { Alert, Badge, Button, Card } from '@aletheia/ui';
import type { LearnerTrackedCompetency } from './types';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LearnerProgressViewProps {
  learnerId: string;
  trackings: LearnerTrackedCompetency[];
  loading: boolean;
  error: string | null;
  onOpenEvidenceModal: (trackingId?: string) => void;
}

export function LearnerProgressView({
  trackings,
  loading,
  error,
  onOpenEvidenceModal,
}: LearnerProgressViewProps) {
  const { t } = useLocale();
  const activeTrackings = trackings.filter((t) => t.status !== 'RETIRED');
  const achievedCount = trackings.filter((t) => Boolean(t.achievedAt)).length;
  const inProgressCount = activeTrackings.filter((t) => !t.achievedAt).length;

  return (
    <section data-testid="learner-progress-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div
        style={{
          backgroundColor: 'var(--forest)',
          color: '#ffffff',
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold)',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            {t('learnerPortal.progress.trackBadge')}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: '1.625rem',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {t('learnerPortal.progress.title')}
          </h2>
          <p style={{ margin: '0.375rem 0 0 0', opacity: 0.85, fontSize: '0.9375rem' }}>
            {t('learnerPortal.progress.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          data-testid="open-evidence-modal-btn"
          onClick={() => onOpenEvidenceModal()}
          style={{
            backgroundColor: 'var(--gold)',
            color: '#1b3b22',
            fontWeight: 700,
            border: 'none',
            padding: '0.625rem 1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {t('learnerPortal.progress.sendWorkButton')}
        </Button>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('learnerPortal.progress.totalCompetencies')}
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--forest)' }}>
            {trackings.length}
          </span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('learnerPortal.progress.completedCompetencies')}
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sage)' }}>
            {achievedCount}
          </span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('learnerPortal.progress.inProgressCompetencies')}
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gold-dark)' }}>
            {inProgressCount}
          </span>
        </Card>
      </div>

      {error && (
        <Alert variant="error" data-testid="progress-error">
          {error}
        </Alert>
      )}

      {/* Competencies List */}
      <div>
        {loading ? (
          <div
            data-testid="progress-loading"
            style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}
          >
            {t('learnerPortal.progress.loadingProgress')}
          </div>
        ) : trackings.length === 0 ? (
          <div
            data-testid="progress-empty"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.25rem' }}>
              {t('learnerPortal.progress.emptyTitle')}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {t('learnerPortal.progress.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {trackings.map((tracking) => {
              const code = tracking.competency?.code || tracking.competencyCode || '';
              const title = tracking.competency?.title || tracking.competencyCode || tracking.id;
              const domain = tracking.competency?.domainTitle;
              const isAchieved = Boolean(tracking.achievedAt);

              return (
                <article
                  key={tracking.id}
                  data-testid={`competency-card-${tracking.id}`}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        marginBottom: '0.375rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {domain && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--forest)',
                          }}
                        >
                          {domain}
                        </span>
                      )}

                      {code && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {code}
                        </span>
                      )}

                      {isAchieved ? (
                        <Badge variant="emerald" data-testid={`competency-status-${tracking.id}`}>
                          {t('learnerPortal.progress.statusAchieved')}
                        </Badge>
                      ) : (
                        <Badge variant="amber" data-testid={`competency-status-${tracking.id}`}>
                          {t('learnerPortal.progress.statusInProgress')}
                        </Badge>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {title}
                    </h3>

                    {tracking.evidenceCount !== undefined && tracking.evidenceCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--sage)',
                          fontWeight: 500,
                          marginTop: '0.25rem',
                        }}
                      >
                        📄{' '}
                        {tracking.evidenceCount === 1
                          ? t('learnerPortal.progress.evidenceCountSingle')
                          : t('learnerPortal.progress.evidenceCountMultiple', {
                              count: tracking.evidenceCount,
                            })}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      data-testid={`submit-evidence-btn-${tracking.id}`}
                      onClick={() => onOpenEvidenceModal(tracking.id)}
                      style={{
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('learnerPortal.progress.sendEvidenceForThis')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
