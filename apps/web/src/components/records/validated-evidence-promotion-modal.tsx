'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Checkbox, Input, Modal, Textarea } from '@aletheia/ui';
import type {
  CreatePortfolioItemFromEvidenceSubmissionDto,
  EvidenceSubmissionResponseDto,
  EvidenceTypeCatalogEntryDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface ValidatedEvidencePromotionModalProps {
  isOpen: boolean;
  onClose(): void;
  submissions: EvidenceSubmissionResponseDto[];
  evidenceTypes: EvidenceTypeCatalogEntryDto[];
  promotedSubmissionIds: ReadonlySet<string>;
  onPromote(submissionId: string, dto: CreatePortfolioItemFromEvidenceSubmissionDto): Promise<void>;
  onResolveMediaUrl?(submissionId: string): Promise<string | null>;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ValidatedEvidencePromotionModal({
  isOpen,
  onClose,
  submissions,
  evidenceTypes,
  promotedSubmissionIds,
  onPromote,
  onResolveMediaUrl,
}: ValidatedEvidencePromotionModalProps) {
  const { t, formatDate } = useLocale();
  const validatedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.validationStatus === 'VALIDATED'),
    [submissions],
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isHighlight, setIsHighlight] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaRetryToken, setMediaRetryToken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubmission = validatedSubmissions.find((submission) => submission.id === selectedSubmissionId) ?? null;
  const selectedType = selectedSubmission
    ? evidenceTypes.find((type) => type.id === selectedSubmission.evidenceTypeId)
    : undefined;
  const fileDetails = selectedSubmission
    ? [selectedSubmission.mimeType, formatFileSize(selectedSubmission.fileSizeBytes)].filter(Boolean).join(' · ')
    : '';

  useEffect(() => {
    if (!isOpen) return;
    const firstAvailable = validatedSubmissions.find((submission) => !promotedSubmissionIds.has(submission.id));
    const nextId = firstAvailable?.id ?? validatedSubmissions[0]?.id ?? '';
    setSelectedSubmissionId(nextId);
    setTitle('');
    setDescription('');
    setTagsInput('');
    setIsHighlight(false);
    setError(null);
  }, [isOpen, validatedSubmissions, promotedSubmissionIds]);

  useEffect(() => {
    if (!selectedSubmission) {
      setMediaUrl(null);
      setMediaLoading(false);
      setMediaError(false);
      return;
    }
    setTitle(selectedType?.name || t('records.validatedEvidence.defaultTitle'));
    setMediaError(false);
    if (selectedSubmission.fileUrl) {
      setMediaUrl(selectedSubmission.fileUrl);
      setMediaLoading(false);
      return;
    }
    if (!selectedSubmission.storageKey || !onResolveMediaUrl) {
      setMediaUrl(null);
      setMediaLoading(false);
      return;
    }
    let cancelled = false;
    setMediaUrl(null);
    setMediaLoading(true);
    void onResolveMediaUrl(selectedSubmission.id).then((url) => {
      if (cancelled) return;
      setMediaUrl(url);
      setMediaError(!url);
      setMediaLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setMediaUrl(null);
      setMediaError(true);
      setMediaLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaRetryToken, onResolveMediaUrl, selectedSubmission, selectedType?.name, t]);

  const renderPreview = () => {
    if (!selectedSubmission) return null;
    if (mediaLoading) {
      return <div role="status" data-testid="validated-evidence-media-loading">{t('records.validatedEvidence.mediaLoading')}</div>;
    }
    if (mediaError) {
      return (
        <div>
          <Alert variant="error" data-testid="validated-evidence-media-error">{t('records.validatedEvidence.mediaUnavailable')}</Alert>
          <Button variant="secondary" onClick={() => setMediaRetryToken((current) => current + 1)} data-testid="validated-evidence-retry-media">
            {t('records.validatedEvidence.retryMedia')}
          </Button>
        </div>
      );
    }
    if (selectedSubmission.textContent) {
      return (
        <blockquote data-testid="validated-evidence-text-preview" style={{ margin: 0, padding: '0.75rem 1rem', borderLeft: '3px solid var(--forest)', color: 'var(--text-secondary)' }}>
          {selectedSubmission.textContent}
        </blockquote>
      );
    }
    if (!mediaUrl) return <span style={{ color: 'var(--text-secondary)' }}>{t('records.validatedEvidence.noMedia')}</span>;
    if (selectedSubmission.mimeType?.startsWith('image/')) {
      return <img src={mediaUrl} alt={selectedType?.name || t('records.validatedEvidence.mediaAlt')} data-testid="validated-evidence-image-preview" onError={() => setMediaError(true)} style={{ display: 'block', width: '100%', maxHeight: '14rem', objectFit: 'contain' }} />;
    }
    if (selectedSubmission.mimeType?.startsWith('audio/')) {
      return <audio controls src={mediaUrl} aria-label={selectedType?.name || t('records.validatedEvidence.mediaAlt')} data-testid="validated-evidence-audio-preview" onError={() => setMediaError(true)} style={{ width: '100%' }} />;
    }
    if (selectedSubmission.mimeType?.startsWith('video/')) {
      return <video controls playsInline src={mediaUrl} aria-label={selectedType?.name || t('records.validatedEvidence.mediaAlt')} data-testid="validated-evidence-video-preview" onError={() => setMediaError(true)} style={{ width: '100%', maxHeight: '14rem' }} />;
    }
    return <a href={mediaUrl} target="_blank" rel="noopener noreferrer" data-testid="validated-evidence-open-media">{t('records.validatedEvidence.openMedia')}</a>;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSubmission || promotedSubmissionIds.has(selectedSubmission.id)) return;
    if (!title.trim()) {
      setError(t('records.validatedEvidence.titleRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onPromote(selectedSubmission.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        isHighlight,
        tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      onClose();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t('records.validatedEvidence.promoteError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('records.validatedEvidence.modalTitle')} description={t('records.validatedEvidence.modalDescription')} maxWidth="xl" footer={<><Button variant="secondary" onClick={onClose} disabled={submitting}>{t('records.validatedEvidence.cancelBtn')}</Button><Button type="submit" form="validated-evidence-promotion-form" isLoading={submitting} disabled={!selectedSubmission || promotedSubmissionIds.has(selectedSubmission.id)}>{t('records.validatedEvidence.promoteBtn')}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <Alert variant="error" data-testid="validated-evidence-promotion-error">{error}</Alert>}
        {validatedSubmissions.length === 0 ? (
          <div data-testid="validated-evidence-empty-state" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{t('records.validatedEvidence.emptyState')}</div>
        ) : (
          <div data-testid="validated-evidence-list" style={{ display: 'grid', gap: '0.5rem' }}>
            {validatedSubmissions.map((submission) => {
              const promoted = promotedSubmissionIds.has(submission.id);
              const typeName = evidenceTypes.find((type) => type.id === submission.evidenceTypeId)?.name || t('records.validatedEvidence.unknownType');
              return (
                <button type="button" key={submission.id} data-testid={`validated-evidence-option-${submission.id}`} onClick={() => !promoted && setSelectedSubmissionId(submission.id)} disabled={promoted} aria-pressed={selectedSubmissionId === submission.id} style={{ textAlign: 'left', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: selectedSubmissionId === submission.id ? '2px solid var(--forest)' : '1px solid var(--border-light)', background: 'var(--bg-surface)', cursor: promoted ? 'not-allowed' : 'pointer', opacity: promoted ? 0.7 : 1 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}><strong>{typeName}</strong><Badge variant={promoted ? 'emerald' : 'slate'}>{promoted ? t('records.validatedEvidence.alreadyAdded') : t('records.validatedEvidence.validated')}</Badge></span>
                  <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(new Date(submission.createdAt))}{submission.textContent ? ` · ${submission.textContent.slice(0, 100)}` : ''}</span>
                </button>
              );
            })}
          </div>
        )}
        {selectedSubmission && !promotedSubmissionIds.has(selectedSubmission.id) && (
          <form id="validated-evidence-promotion-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div data-testid="validated-evidence-preview" style={{ padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
              {renderPreview()}
              {fileDetails && <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{fileDetails}</div>}
            </div>
            <Input label={t('records.validatedEvidence.titleLabel')} data-testid="validated-evidence-title-input" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea label={t('records.validatedEvidence.descriptionLabel')} data-testid="validated-evidence-description-input" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
            <Input label={t('records.validatedEvidence.tagsLabel')} data-testid="validated-evidence-tags-input" value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder={t('records.validatedEvidence.tagsPlaceholder')} />
            <Checkbox checked={isHighlight} onChange={(event) => setIsHighlight(event.target.checked)} label={t('records.validatedEvidence.highlightLabel')} />
          </form>
        )}
      </div>
    </Modal>
  );
}
