'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { DailyDevotionalResponseDto, UpsertDailyDevotionalDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface DevotionalFormModalProps {
  isOpen: boolean;
  currentDate: string;
  initialData?: DailyDevotionalResponseDto | null;
  familyId: string | null;
  onClose: () => void;
  onSubmit(_data: UpsertDailyDevotionalDto): Promise<void> | void;
}

// Kept in sync with YouVersionService's POPULAR_BIBLE_VERSIONS
// (apps/api/.../youversion.service.ts) -- offering a version that isn't
// in that list 404s upstream and the lookup silently returns no text
// (#214). Almeida (ARA/ARC), Nova Almeida Atualizada, ESV and KJV are
// not available through this app's YouVersion key.
const BIBLE_VERSION_OPTIONS = [
  { value: 'nvi', label: 'NVI (Nova Versão Internacional)' },
  { value: 'blt', label: 'BLT (Bíblia Livre Para Todos)' },
  { value: 'bsb', label: 'BSB (Berean Standard Bible)' },
  { value: 'niv11', label: 'NIV (New International Version)' },
];

export function DevotionalFormModal({
  isOpen,
  currentDate,
  initialData,
  familyId,
  onClose,
  onSubmit,
}: DevotionalFormModalProps) {
  const { t } = useLocale();
  const [date, setDate] = useState(currentDate);
  const [bibleReference, setBibleReference] = useState('');
  const [bibleVersionId, setBibleVersionId] = useState('nvi');
  const [passageText, setPassageText] = useState('');
  const [reflection, setReflection] = useState('');
  const [memoryVerse, setMemoryVerse] = useState('');
  const [hymnOrSong, setHymnOrSong] = useState('');
  const [discussionQuestions, setDiscussionQuestions] = useState('');
  const [practicalApplication, setPracticalApplication] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setBibleReference(initialData.bibleReference || '');
      setBibleVersionId(initialData.bibleVersionId || 'nvi');
      setPassageText(initialData.passageText || '');
      setReflection(initialData.reflection || '');
      setMemoryVerse(initialData.memoryVerse || '');
      setHymnOrSong(initialData.hymnOrSong || '');
      setDiscussionQuestions(initialData.discussionQuestions || '');
      setPracticalApplication(initialData.practicalApplication || '');
    } else {
      setDate(currentDate);
      setBibleReference('');
      setBibleVersionId('nvi');
      setPassageText('');
      setReflection('');
      setMemoryVerse('');
      setHymnOrSong('');
      setDiscussionQuestions('');
      setPracticalApplication('');
    }
    setError(null);
  }, [initialData, currentDate, isOpen]);

  const handleLookupScripture = async () => {
    if (!bibleReference.trim()) {
      setError(t('devotional.form.errors.referenceRequired'));
      return;
    }
    if (!familyId) {
      setError(t('devotional.form.errors.familyUnauthenticated'));
      return;
    }

    try {
      setLookupLoading(true);
      setError(null);
      const url = `/api/v1/families/${encodeURIComponent(familyId)}/devotionals/scripture/lookup?reference=${encodeURIComponent(bibleReference.trim())}&versionId=${encodeURIComponent(bibleVersionId)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(t('devotional.form.errors.lookupFailed'));
      }
      const data = await res.json();
      if (data && data.content) {
        setPassageText(data.content);
      } else {
        // The lookup endpoint responds 200 with an empty passage when the
        // upstream provider has no text for this reference/version (#214)
        // -- surface that instead of leaving the field silently blank.
        setError(t('devotional.form.errors.lookupNotFound'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('devotional.form.errors.lookupGeneric');
      setError(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bibleReference.trim() || !date) {
      setError(t('devotional.form.errors.requiredFields'));
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        date,
        bibleReference: bibleReference.trim(),
        bibleVersionId: bibleVersionId.trim() || undefined,
        passageText: passageText.trim() || undefined,
        reflection: reflection.trim() || undefined,
        memoryVerse: memoryVerse.trim() || undefined,
        hymnOrSong: hymnOrSong.trim() || undefined,
        discussionQuestions: discussionQuestions.trim() || undefined,
        practicalApplication: practicalApplication.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('devotional.form.errors.saveFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="devotional-form-modal">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? t('devotional.form.titles.edit') : t('devotional.form.titles.new')}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {t('devotional.form.actions.cancel')}
            </Button>
            <Button type="submit" form="devotional-form" data-testid="devotional-submit-btn" isLoading={loading}>
              {initialData ? t('devotional.form.actions.save') : t('devotional.form.actions.create')}
            </Button>
          </>
        }
      >
        {error && (
          <Alert variant="error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}

        <form id="devotional-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label={t('devotional.form.labels.date')}
              type="date"
              data-testid="devotional-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label={t('devotional.form.labels.bibleVersion')}
              data-testid="devotional-version-select"
              value={bibleVersionId}
              onChange={(e) => setBibleVersionId(e.target.value)}
              options={BIBLE_VERSION_OPTIONS}
            />
          </div>

          <div className="ui-form-group">
            <label htmlFor="devotional-reference" className="ui-form-label">
              {t('devotional.form.labels.bibleReference')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                id="devotional-reference"
                data-testid="devotional-reference-input"
                value={bibleReference}
                onChange={(e) => setBibleReference(e.target.value)}
                placeholder={t('devotional.form.placeholders.bibleReference')}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="secondary"
                data-testid="scripture-lookup-btn"
                onClick={handleLookupScripture}
                isLoading={lookupLoading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {t('devotional.form.actions.lookupScripture')}
              </Button>
            </div>
          </div>

          <Textarea
            label={t('devotional.form.labels.passageText')}
            rows={4}
            data-testid="devotional-passage-input"
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder={t('devotional.form.placeholders.passageText')}
          />

          <Textarea
            label={t('devotional.form.labels.reflection')}
            rows={3}
            data-testid="devotional-reflection-input"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={t('devotional.form.placeholders.reflection')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label={t('devotional.form.labels.memoryVerse')}
              data-testid="devotional-memory-input"
              value={memoryVerse}
              onChange={(e) => setMemoryVerse(e.target.value)}
              placeholder={t('devotional.form.placeholders.memoryVerse')}
            />
            <Input
              label={t('devotional.form.labels.hymn')}
              data-testid="devotional-hymn-input"
              value={hymnOrSong}
              onChange={(e) => setHymnOrSong(e.target.value)}
              placeholder={t('devotional.form.placeholders.hymn')}
            />
          </div>

          <Textarea
            label={t('devotional.form.labels.discussionQuestions')}
            rows={2}
            data-testid="devotional-questions-input"
            value={discussionQuestions}
            onChange={(e) => setDiscussionQuestions(e.target.value)}
            placeholder={t('devotional.form.placeholders.discussionQuestions')}
          />

          <Textarea
            label={t('devotional.form.labels.practicalApplication')}
            rows={2}
            data-testid="devotional-application-input"
            value={practicalApplication}
            onChange={(e) => setPracticalApplication(e.target.value)}
            placeholder={t('devotional.form.placeholders.practicalApplication')}
          />
        </form>
      </Modal>
    </div>
  );
}
