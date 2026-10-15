'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type { FamilyActivityResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

interface FamilyActivityModalProps {
  isOpen: boolean;
  familyId: string;
  activity: FamilyActivityResponseDto | null;
  onClose(): void;
  onSaved(activity: FamilyActivityResponseDto): void;
}

export function FamilyActivityModal({
  isOpen,
  familyId,
  activity,
  onClose,
  onSaved,
}: FamilyActivityModalProps) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [supervisionRequired, setSupervisionRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setName(activity?.name ?? '');
    setDescription(activity?.description ?? '');
    setVisibility(activity?.visibility ?? 'PRIVATE');
    setSupervisionRequired(activity?.supervisionRequired ?? false);
    setError(null);
  }, [isOpen, activity]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'));

    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0]!;
      const last = elements[elements.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('curriculum.familyActivities.nameRequired'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        supervisionRequired,
        visibility,
      };

      const url = activity
        ? `/api/v1/families/${familyId}/activities/${activity.id}`
        : `/api/v1/families/${familyId}/activities`;

      const res = await fetch(url, {
        method: activity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('curriculum.familyActivities.saveError'));
      }

      const saved: FamilyActivityResponseDto = await res.json();
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('curriculum.familyActivities.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-activity-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <Card style={{ maxWidth: '32rem', width: '100%', padding: '1.75rem' }}>
        <h2 id="family-activity-dialog-title" style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)' }}>
          {activity ? t('curriculum.familyActivities.editTitle') : t('curriculum.familyActivities.createTitle')}
        </h2>

        {error && <Alert variant="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {t('curriculum.familyActivities.nameLabel')}
            <input
              type="text"
              data-testid="family-activity-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {t('curriculum.familyActivities.descriptionLabel')}
            <textarea
              data-testid="family-activity-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              data-testid="family-activity-supervision-checkbox"
              checked={supervisionRequired}
              onChange={(e) => setSupervisionRequired(e.target.checked)}
            />
            {t('curriculum.familyActivities.supervisionRequired')}
          </label>

          <div>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              {t('curriculum.familyActivities.visibilityLabel')}
            </span>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('curriculum.familyActivities.visibilityHelp')}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                data-testid="family-activity-visibility-private"
                aria-pressed={visibility === 'PRIVATE'}
                onClick={() => setVisibility('PRIVATE')}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: visibility === 'PRIVATE' ? 'var(--forest)' : 'var(--border-light)',
                  backgroundColor: visibility === 'PRIVATE' ? 'var(--forest)' : 'var(--bg-surface)',
                  color: visibility === 'PRIVATE' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {t('curriculum.familyActivities.privateBadge')}
              </button>
              <button
                type="button"
                data-testid="family-activity-visibility-public"
                aria-pressed={visibility === 'PUBLIC'}
                onClick={() => setVisibility('PUBLIC')}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: visibility === 'PUBLIC' ? 'var(--forest)' : 'var(--border-light)',
                  backgroundColor: visibility === 'PUBLIC' ? 'var(--forest)' : 'var(--bg-surface)',
                  color: visibility === 'PUBLIC' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {t('curriculum.familyActivities.publicBadge')}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('curriculum.familyActivities.cancel')}
          </Button>
          <Button
            variant="primary"
            data-testid="family-activity-save-btn"
            onClick={handleSave}
            isLoading={saving}
          >
            {t('curriculum.familyActivities.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
