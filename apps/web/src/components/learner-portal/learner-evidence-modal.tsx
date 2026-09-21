'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { LearnerTrackedCompetency } from './types';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LearnerEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerId: string;
  trackings: LearnerTrackedCompetency[];
  initialTrackingId?: string | null | undefined;
  onSuccess: (message: string) => void;
}

const DEFAULT_EVIDENCE_TYPE_ID = '00000000-0000-0000-0000-000000000001';

export function LearnerEvidenceModal({
  isOpen,
  onClose,
  learnerId,
  trackings,
  initialTrackingId,
  onSuccess,
}: LearnerEvidenceModalProps) {
  const { t } = useLocale();
  const [trackingId, setTrackingId] = useState<string>('');
  const [evidenceTypeCode, setEvidenceTypeCode] = useState<string>('WORK_SAMPLE');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultId = initialTrackingId || (trackings.length > 0 ? trackings[0]!.id : '');
      setTrackingId(defaultId);
      setEvidenceTypeCode('WORK_SAMPLE');
      setTitle('');
      setDescription('');
      setUrl('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialTrackingId, trackings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) {
      setError(t('learnerPortal.evidenceModal.errorSelectCompetency'));
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setError(t('learnerPortal.evidenceModal.errorTitleMinLength'));
      return;
    }

    setSubmitting(true);
    setError(null);

    const selectedTracking = trackings.find((t) => t.id === trackingId) || trackings[0];
    const competencyDefinitionId =
      selectedTracking?.competencyDefinitionId || selectedTracking?.id || trackingId;

    const payload = {
      trackingId: selectedTracking?.id || trackingId,
      evidenceTypeCode,
      evidenceTypeVersion: 1,
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,

      // Backend real schema fields (learnerSubmitEvidenceSchema)
      evidenceTypeId: DEFAULT_EVIDENCE_TYPE_ID,
      competencies: [{ competencyDefinitionId }],
      textContent: description.trim() ? `${title.trim()}: ${description.trim()}` : title.trim(),
      fileUrl: url.trim() || undefined,
    };

    try {
      const res = await fetch(`/api/v1/learner-access/learners/${learnerId}/evidence-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || t('learnerPortal.evidenceModal.errorSubmitFailed'));
      }

      onSuccess(t('learnerPortal.evidenceModal.celebrationSuccess'));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learnerPortal.evidenceModal.errorSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const activeTrackings = trackings.filter((t) => t.status !== 'RETIRED');
  const trackingOptions = [
    { value: '', label: t('learnerPortal.evidenceModal.selectCompetencyPlaceholder') },
    ...activeTrackings.map((t) => {
      const code = t.competency?.code || t.competencyCode || '';
      const titleText = t.competency?.title || t.competencyCode || t.id;
      return {
        value: t.id,
        label: code ? `${code} - ${titleText}` : titleText,
      };
    }),
  ];

  const typeOptions = [
    { value: 'WORK_SAMPLE', label: t('learnerPortal.evidenceModal.typeWorkSample') },
    { value: 'PHOTO', label: t('learnerPortal.evidenceModal.typePhoto') },
    { value: 'DOCUMENT', label: t('learnerPortal.evidenceModal.typeDocument') },
    { value: 'AUDIO', label: t('learnerPortal.evidenceModal.typeAudio') },
    { value: 'TEXT', label: t('learnerPortal.evidenceModal.typeText') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('learnerPortal.evidenceModal.title')}
      description={t('learnerPortal.evidenceModal.subtitle')}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button
            type="button"
            variant="secondary"
            data-testid="cancel-evidence-btn"
            onClick={onClose}
            disabled={submitting}
          >
            {t('learnerPortal.evidenceModal.cancelButton')}
          </Button>
          <Button
            type="submit"
            form="learner-evidence-form"
            variant="primary"
            data-testid="submit-evidence-btn"
            isLoading={submitting}
          >
            {t('learnerPortal.evidenceModal.submitButton')}
          </Button>
        </div>
      }
    >
      <div data-testid="learner-evidence-modal">
        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error" data-testid="evidence-form-error">
              {error}
            </Alert>
          </div>
        )}

        <form
          id="learner-evidence-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <Select
            label={`${t('learnerPortal.evidenceModal.selectCompetencyLabel')} *`}
            data-testid="evidence-competency-select"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            options={trackingOptions}
            required
          />

          <Select
            label={`${t('learnerPortal.evidenceModal.evidenceTypeLabel')} *`}
            data-testid="evidence-type-select"
            value={evidenceTypeCode}
            onChange={(e) => setEvidenceTypeCode(e.target.value)}
            options={typeOptions}
            required
          />

          <Input
            label={`${t('learnerPortal.evidenceModal.titleLabel')} *`}
            data-testid="evidence-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('learnerPortal.evidenceModal.titlePlaceholder')}
            required
          />

          <Textarea
            label={t('learnerPortal.evidenceModal.descriptionLabel')}
            data-testid="evidence-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t('learnerPortal.evidenceModal.descriptionPlaceholder')}
          />

          <Input
            type="url"
            label={t('learnerPortal.evidenceModal.urlLabel')}
            data-testid="evidence-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('learnerPortal.evidenceModal.urlPlaceholder')}
          />

          <Textarea
            label={t('learnerPortal.evidenceModal.notesLabel')}
            data-testid="evidence-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t('learnerPortal.evidenceModal.notesPlaceholder')}
          />
        </form>
      </div>
    </Modal>
  );
}
