'use client';

import React from 'react';
import type { CurriculumPackModerationStatus } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

interface CommunityPackPublicationStatusProps {
  packId: string;
  moderationStatus: CurriculumPackModerationStatus | undefined;
  packStatus: string;
  moderationNotes?: string | null | undefined;
}

export function CommunityPackPublicationStatus({
  packId,
  moderationStatus,
  packStatus,
  moderationNotes,
}: CommunityPackPublicationStatusProps) {
  const { t } = useLocale();
  const safeModerationStatus = moderationStatus ?? 'DRAFT';
  const terminalStatus = moderationStatus === 'APPROVED' || moderationStatus === 'REJECTED';
  const isArchived = packStatus === 'ARCHIVED';

  const statusCopy = isArchived
    ? t('curriculum.community.visibilityArchived')
    : safeModerationStatus === 'DRAFT'
      ? t('curriculum.community.visibilityDraft')
        : safeModerationStatus === 'PENDING_REVIEW'
        ? t('curriculum.community.visibilityPendingReview')
          : safeModerationStatus === 'APPROVED'
          ? t('curriculum.community.visibilityPublic')
          : t('curriculum.community.visibilityRejected');

  return (
    <div
      data-testid={`community-pack-publication-status-${packId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.875rem' }}
    >
      <div
        data-testid={`community-pack-visibility-${packId}`}
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: safeModerationStatus === 'APPROVED' ? 'var(--sage-soft)' : 'var(--bg-canvas)',
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          lineHeight: 1.45,
        }}
      >
        <strong style={{ color: 'var(--forest)' }}>{t('curriculum.community.visibilityLabel')}:</strong>{' '}
        {statusCopy}
      </div>

      <ol
        aria-label={t('curriculum.community.publicationProgressLabel')}
        data-testid={`community-pack-publication-progress-${packId}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.375rem', listStyle: 'none', padding: 0, margin: 0 }}
      >
        {[
          { key: 'DRAFT', label: t('curriculum.community.statusDraft') },
          { key: 'PENDING_REVIEW', label: t('curriculum.community.statusPendingReview') },
          { key: 'APPROVED', label: t('curriculum.community.statusApproved') },
          { key: 'REJECTED', label: t('curriculum.community.statusRejected') },
        ].map((step, index) => {
          const isCurrent = step.key === safeModerationStatus;
          const isComplete =
            (step.key === 'DRAFT' && safeModerationStatus !== 'DRAFT') ||
            (step.key === 'PENDING_REVIEW' && terminalStatus) ||
            (step.key === 'APPROVED' && safeModerationStatus === 'APPROVED');
          const isRelevant = step.key !== 'REJECTED' || safeModerationStatus === 'REJECTED';
          return (
            <li
              key={step.key}
              data-testid={`community-pack-progress-step-${packId}-${step.key.toLowerCase()}`}
              aria-current={isCurrent ? 'step' : undefined}
              style={{
                minWidth: 0,
                padding: '0.4rem 0.35rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isCurrent ? 'var(--forest)' : 'var(--border-light)'}`,
                backgroundColor: isCurrent ? 'var(--forest)' : isComplete ? 'var(--sage-soft)' : 'var(--bg-surface)',
                color: isCurrent ? '#fff' : isRelevant ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isRelevant ? 1 : 0.55,
                textAlign: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'block', fontSize: '0.625rem', opacity: 0.8 }}>{index + 1}</span>
              {step.label}
            </li>
          );
        })}
      </ol>

      {safeModerationStatus === 'REJECTED' && moderationNotes && (
        <div
          data-testid={`community-pack-moderation-notes-${packId}`}
          style={{ color: '#991B1B', fontSize: '0.8125rem', lineHeight: 1.45 }}
        >
          <strong>{t('curriculum.community.moderationNotesLabel')}</strong> {moderationNotes}
          <div style={{ marginTop: '0.25rem' }}>{t('curriculum.community.rejectionNextStep')}</div>
        </div>
      )}
    </div>
  );
}
