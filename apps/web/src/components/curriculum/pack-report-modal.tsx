'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal } from '@aletheia/ui';
import type { PackReportReason } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PackReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  packId: string;
  packTitle: string;
  familyId: string;
  onSuccess?: (() => void) | undefined;
}

const REPORT_REASONS: PackReportReason[] = [
  'SPAM_COMMERCIAL',
  'HARMFUL_INAPPROPRIATE',
  'COPYRIGHT_PLAGIARISM',
  'MALFORMED_QUALITY',
  'OTHER',
];

export function PackReportModal({
  isOpen,
  onClose,
  packId,
  packTitle,
  familyId,
  onSuccess,
}: PackReportModalProps) {
  const { t } = useLocale();
  const [reason, setReason] = useState<PackReportReason>('SPAM_COMMERCIAL');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'conflict' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setReason('SPAM_COMMERCIAL');
      setDetails('');
      setIsSubmitting(false);
      setStatus('idle');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const res = await fetch(`/api/v1/curriculum-packs/${packId}/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-family-id': familyId,
        },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
          familyId,
        }),
      });

      if (res.status === 409) {
        setStatus('conflict');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('success');
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('curriculum.moderation.reportModalTitle')}
      description={packTitle}
      maxWidth="md"
    >
      <div data-testid="pack-report-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {status === 'success' && (
          <Alert variant="success" data-testid="report-success-alert">
            {t('curriculum.moderation.reportSuccessMsg')}
          </Alert>
        )}

        {status === 'conflict' && (
          <Alert variant="error" data-testid="report-conflict-alert">
            {t('curriculum.moderation.reportConflictMsg')}
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="error" data-testid="report-error-alert">
            {t('curriculum.moderation.reportErrorMsg')}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              htmlFor="report-reason-select"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.375rem',
              }}
            >
              {t('curriculum.moderation.reasonLabel')}
            </label>
            <select
              id="report-reason-select"
              data-testid="report-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value as PackReportReason)}
              disabled={isSubmitting || status === 'success'}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`curriculum.moderation.reasons.${r}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-details-textarea"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.375rem',
              }}
            >
              {t('curriculum.moderation.detailsLabel')}
            </label>
            <textarea
              id="report-details-textarea"
              data-testid="report-details-textarea"
              rows={4}
              maxLength={2000}
              placeholder={t('curriculum.moderation.detailsPlaceholder')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting || status === 'success'}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <Button
              type="button"
              variant="secondary"
              data-testid="cancel-report-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('curriculum.moderation.cancelBtn')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              data-testid="submit-report-btn"
              isLoading={isSubmitting}
              disabled={isSubmitting || status === 'success'}
            >
              {isSubmitting
                ? t('curriculum.moderation.submittingReport')
                : t('curriculum.moderation.submitReport')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
