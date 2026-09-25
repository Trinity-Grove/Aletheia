'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CurriculumPackResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PublishToCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyCurriculumPackId: string;
  sourceName: string;
  onSuccess?: ((pack: CurriculumPackResponseDto) => void) | undefined;
}

export function PublishToCommunityModal({
  isOpen,
  onClose,
  familyId,
  familyCurriculumPackId,
  sourceName,
  onSuccess,
}: PublishToCommunityModalProps) {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [name, setName] = useState(sourceName);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'conflict' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setName(sourceName);
      setDescription('');
      setIsSubmitting(false);
      setStatus('idle');
    }
  }, [isOpen, sourceName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum-packs/${familyCurriculumPackId}/publish-to-community`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        },
      );

      if (res.status === 400) {
        setStatus('conflict');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        return;
      }

      const pack = (await res.json()) as CurriculumPackResponseDto;
      setStatus('success');
      onSuccess?.(pack);
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
      title={t('curriculum.community.publishModalTitle')}
      description={t('curriculum.community.publishModalDescription')}
      maxWidth="md"
    >
      <div data-testid="publish-to-community-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {status === 'success' && (
          <Alert variant="success" data-testid="publish-success-alert">
            {t('curriculum.community.publishSuccessMsg')}
          </Alert>
        )}

        {status === 'conflict' && (
          <Alert variant="error" data-testid="publish-conflict-alert">
            {t('curriculum.community.publishConflictMsg')}
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="error" data-testid="publish-error-alert">
            {t('curriculum.community.publishErrorMsg')}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label={t('curriculum.community.codeLabel')}
            data-testid="publish-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('curriculum.community.codePlaceholder')}
            helperText={t('curriculum.community.codeHelp')}
            disabled={isSubmitting || status === 'success'}
            required
          />

          <Input
            label={t('curriculum.community.nameLabel')}
            data-testid="publish-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('curriculum.community.namePlaceholder')}
            disabled={isSubmitting || status === 'success'}
            required
          />

          <div>
            <label
              htmlFor="publish-description-textarea"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.375rem',
              }}
            >
              {t('curriculum.community.descriptionLabel')}
            </label>
            <Textarea
              id="publish-description-textarea"
              data-testid="publish-description-textarea"
              rows={3}
              maxLength={2000}
              placeholder={t('curriculum.community.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting || status === 'success'}
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
              data-testid="cancel-publish-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('curriculum.community.cancelBtn')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              data-testid="submit-publish-btn"
              isLoading={isSubmitting}
              disabled={isSubmitting || status === 'success' || !code.trim() || !name.trim()}
            >
              {isSubmitting ? t('curriculum.community.submittingBtn') : t('curriculum.community.submitBtn')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
