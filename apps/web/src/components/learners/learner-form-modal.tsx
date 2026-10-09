'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea, useToast } from '@aletheia/ui';
import { resolvePrivacyRegime, type CreateLearnerDto, type EducationalStage, type LearnerResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { LegalDocumentContent } from '../shared/legal-document-content';

// acceptedDataConsent is only ever included on creation, never on edit
// (see updateLearnerSchema.partial() on the backend) -- optional here so
// the edit path can omit it entirely rather than send a `false` that
// would fail contract validation.
export type LearnerFormSubmitDto = Omit<CreateLearnerDto, 'acceptedDataConsent'> & {
  acceptedDataConsent?: true;
};

// A scroll position within this many pixels of the bottom counts as
// "reached the end" -- exact equality is unreliable across browsers due
// to fractional-pixel layout/zoom rounding.
const SCROLL_END_THRESHOLD_PX = 4;

export interface LearnerFormModalProps {
  isOpen: boolean;
  familyId: string;
  initialData?: LearnerResponseDto | null | undefined;
  onClose(): void;
  onSubmit?(data: LearnerFormSubmitDto): Promise<void> | void;
}

const EDUCATIONAL_STAGES: EducationalStage[] = [
  'EARLY_YEARS',
  'PRIMARY',
  'LOWER_SECONDARY',
  'UPPER_SECONDARY',
  'OTHER',
];

export function LearnerFormModal({
  isOpen,
  familyId,
  initialData,
  onClose,
  onSubmit,
}: LearnerFormModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [stage, setStage] = useState<EducationalStage>('PRIMARY');
  const [customGrade, setCustomGrade] = useState('');
  const [avatarColor, setAvatarColor] = useState('#3B82F6');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  // Guardian consent for processing this learner's data -- only required
  // when creating a new learner, not when editing one that already has a
  // consent record (see updateLearnerSchema.partial()).
  const [acceptedDataConsent, setAcceptedDataConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentText, setConsentText] = useState<string | null>(null);
  const [consentTextFetchFailed, setConsentTextFetchFailed] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [showFullConsentText, setShowFullConsentText] = useState(false);
  const [hasReadConsentText, setHasReadConsentText] = useState(false);
  const consentScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPreferredName(initialData.preferredName || '');
      setBirthDate(initialData.birthDate || '');
      setStage(initialData.stage || 'PRIMARY');
      setCustomGrade(initialData.customGrade || '');
      setAvatarColor(initialData.avatarColor || '#3B82F6');
      setSpecialNeeds(initialData.specialNeeds || '');
      setNotes(initialData.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setPreferredName('');
      setBirthDate('');
      setStage('PRIMARY');
      setCustomGrade('');
      setAvatarColor('#3B82F6');
      setSpecialNeeds('');
      setNotes('');
    }
    setSubmitError(null);
    setFirstNameError(null);
    setBirthDateError(null);
    setAcceptedDataConsent(false);
    setConsentError(null);
    setShowFullConsentText(false);
    setHasReadConsentText(false);
    setConsentTextFetchFailed(false);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen || initialData || !familyId) return;

    async function loadConsentText() {
      try {
        setConsentLoading(true);
        const familyRes = await fetch(`/api/v1/families/${familyId}`, { credentials: 'include' });
        const family = familyRes.ok ? await familyRes.json() : null;
        const regime = resolvePrivacyRegime(family?.countryCode ?? '');

        const defsRes = await fetch('/api/v1/consent-definitions/published?scope=LEARNER');
        if (defsRes.ok) {
          const defs: Array<{ code: string; content: string }> = await defsRes.json();
          const match = defs.find((d) => d.code === `LEARNER_DATA_PROCESSING_${regime}`);
          setConsentText(match?.content ?? null);
          if (!match) setConsentTextFetchFailed(true);
        } else {
          setConsentTextFetchFailed(true);
        }
      } catch {
        // Nothing to read in this case either -- the checkbox must not
        // stay permanently disabled because of a transient fetch error.
        setConsentTextFetchFailed(true);
      } finally {
        setConsentLoading(false);
      }
    }

    void loadConsentText();
  }, [isOpen, initialData, familyId]);

  // Nothing to gate reading on if the text never loaded -- don't
  // permanently block the checkbox because of that.
  useEffect(() => {
    if (consentTextFetchFailed) setHasReadConsentText(true);
  }, [consentTextFetchFailed]);

  // Some documents may fit entirely within the viewer without ever
  // needing to scroll -- nothing to gate on in that case either.
  useEffect(() => {
    if (!showFullConsentText) return;
    const el = consentScrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight) {
      setHasReadConsentText(true);
    }
  }, [showFullConsentText, consentText]);

  const stageOptions = React.useMemo(
    () =>
      EDUCATIONAL_STAGES.map((s) => ({
        value: s,
        label: t(`learners.stages.${s}`),
      })),
    [t]
  );

  const handleConsentScroll = (el: HTMLDivElement) => {
    const reachedEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_END_THRESHOLD_PX;
    if (reachedEnd) setHasReadConsentText(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextFirstNameError = firstName.trim() ? null : t('learners.form.requiredFirstName');
    const nextBirthDateError = birthDate ? null : t('learners.form.requiredBirthDate');
    const nextConsentError =
      !initialData && !acceptedDataConsent
        ? t('learners.form.requiredConsent')
        : null;
    setFirstNameError(nextFirstNameError);
    setBirthDateError(nextBirthDateError);
    setConsentError(nextConsentError);

    if (nextFirstNameError || nextBirthDateError || nextConsentError) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit?.({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        preferredName: preferredName.trim() || undefined,
        birthDate,
        stage,
        customGrade: customGrade.trim() || undefined,
        avatarColor: avatarColor.trim() || undefined,
        specialNeeds: specialNeeds.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(initialData ? {} : { acceptedDataConsent: true as const }),
      });
      toast({
        variant: 'success',
        title: initialData ? t('learners.toast.updated') : t('learners.toast.created'),
      });
      onClose?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('learners.toast.saveError');
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('learners.form.editTitle') : t('learners.form.newTitle')}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('learners.form.cancel')}
          </Button>
          <Button
            type="submit"
            form="learner-form"
            data-testid="learner-submit-btn"
            isLoading={loading}
          >
            {initialData ? t('learners.form.saveChanges') : t('learners.form.createLearner')}
          </Button>
        </>
      }
    >
      {submitError && (
        <Alert variant="error" style={{ marginBottom: '1rem' }}>
          {submitError}
        </Alert>
      )}

      <form
        id="learner-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <Input
          label={t('learners.form.firstNameLabel')}
          data-testid="learner-first-name-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t('learners.form.firstNamePlaceholder')}
          error={firstNameError ?? undefined}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('learners.form.lastNameLabel')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('learners.form.lastNamePlaceholder')}
          />
          <Input
            label={t('learners.form.preferredNameLabel')}
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder={t('learners.form.preferredNamePlaceholder')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('learners.form.birthDateLabel')}
            type="date"
            data-testid="learner-birth-date-input"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={birthDateError ?? undefined}
          />
          <Select
            label={t('learners.form.stageLabel')}
            value={stage}
            onChange={(e) => setStage(e.target.value as EducationalStage)}
            options={stageOptions}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('learners.form.customGradeLabel')}
            value={customGrade}
            onChange={(e) => setCustomGrade(e.target.value)}
            placeholder={t('learners.form.customGradePlaceholder')}
          />
          <div className="ui-form-group">
            <label htmlFor="avatar-color" className="ui-form-label">
              {t('learners.form.avatarColorLabel')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="avatar-color"
                type="color"
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                style={{ width: '40px', height: '38px', padding: '0', border: 'none', cursor: 'pointer' }}
              />
              <Input
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                placeholder={t('learners.form.avatarColorPlaceholder')}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <Textarea
          label={t('learners.form.specialNeedsLabel')}
          rows={2}
          value={specialNeeds}
          onChange={(e) => setSpecialNeeds(e.target.value)}
          placeholder={t('learners.form.specialNeedsPlaceholder')}
        />

        <Textarea
          label={t('learners.form.notesLabel')}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('learners.form.notesPlaceholder')}
        />

        {!initialData && (
          <div className="ui-form-group">
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                data-testid="learner-data-consent-checkbox"
                checked={acceptedDataConsent}
                disabled={!hasReadConsentText}
                onChange={(e) => setAcceptedDataConsent(e.target.checked)}
                style={{ marginTop: '0.2rem' }}
              />
              <span>
                {t('learners.form.consentCheckboxText')}{' '}
                <button
                  type="button"
                  data-testid="learner-view-consent-text"
                  onClick={() => setShowFullConsentText(true)}
                  disabled={consentLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--forest)',
                    textDecoration: 'underline',
                    cursor: consentLoading ? 'default' : 'pointer',
                    font: 'inherit',
                  }}
                >
                  {t('learners.form.consentPrivacyPolicy')}
                </button>
                .{' '}
                {!hasReadConsentText && !consentLoading && (
                  <span data-testid="learner-consent-hint" style={{ fontSize: '0.8125rem', opacity: 0.75 }}>
                    {t('learners.form.consentHint')}
                  </span>
                )}
              </span>
            </label>
            {consentError && (
              <p style={{ color: 'var(--color-danger, #dc2626)', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
                {consentError}
              </p>
            )}
          </div>
        )}
      </form>

      {showFullConsentText && (
        <Modal
          isOpen
          onClose={() => setShowFullConsentText(false)}
          title={t('learners.form.consentModalTitle')}
          maxWidth="md"
          footer={
            <Button variant="secondary" onClick={() => setShowFullConsentText(false)}>
              {t('learners.form.close')}
            </Button>
          }
        >
          {consentText ? (
            <div
              ref={consentScrollRef}
              data-testid="learner-consent-scroll-area"
              onScroll={(e) => handleConsentScroll(e.currentTarget)}
              style={{ maxHeight: '50vh', overflowY: 'auto' }}
            >
              <LegalDocumentContent content={consentText} />
            </div>
          ) : (
            <p data-testid="learner-consent-unavailable">
              {t('learners.form.consentUnavailable')}
            </p>
          )}
        </Modal>
      )}
    </Modal>
  );
}
