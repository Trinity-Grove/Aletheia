'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea, useToast } from '@aletheia/ui';
import { resolvePrivacyRegime, type CreateLearnerDto, type EducationalStage, type LearnerResponseDto } from '@aletheia/contracts';
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
  initialData?: LearnerResponseDto | null;
  onClose: () => void;
  onSubmit: (_data: LearnerFormSubmitDto) => Promise<void> | void;
}

const STAGE_OPTIONS: { value: EducationalStage; label: string }[] = [
  { value: 'EARLY_YEARS', label: 'Educação Infantil (Early Years)' },
  { value: 'PRIMARY', label: 'Ensino Fundamental inicial (Primary)' },
  { value: 'LOWER_SECONDARY', label: 'Ensino Fundamental final (Lower Secondary)' },
  { value: 'UPPER_SECONDARY', label: 'Ensino Médio (Upper Secondary)' },
  { value: 'OTHER', label: 'Outro' },
];

export function LearnerFormModal({
  isOpen,
  familyId,
  initialData,
  onClose,
  onSubmit,
}: LearnerFormModalProps) {
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

  const handleConsentScroll = (el: HTMLDivElement) => {
    const reachedEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_END_THRESHOLD_PX;
    if (reachedEnd) setHasReadConsentText(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextFirstNameError = firstName.trim() ? null : 'Nome é obrigatório.';
    const nextBirthDateError = birthDate ? null : 'Data de nascimento é obrigatória.';
    const nextConsentError =
      !initialData && !acceptedDataConsent
        ? 'É necessário consentir com o tratamento de dados do educando.'
        : null;
    setFirstNameError(nextFirstNameError);
    setBirthDateError(nextBirthDateError);
    setConsentError(nextConsentError);

    if (nextFirstNameError || nextBirthDateError || nextConsentError) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
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
        title: initialData ? 'Educando atualizado com sucesso.' : 'Educando criado com sucesso.',
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar educando.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Educando' : 'Novo Educando'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="learner-form"
            data-testid="learner-submit-btn"
            isLoading={loading}
          >
            {initialData ? 'Salvar Alterações' : 'Criar Educando'}
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
          label="Primeiro Nome *"
          data-testid="learner-first-name-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Ex: Clara"
          error={firstNameError ?? undefined}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Sobrenome"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ex: Silva"
          />
          <Input
            label="Nome Preferido / Apelido"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Ex: Clarinha"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Data de Nascimento *"
            type="date"
            data-testid="learner-birth-date-input"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={birthDateError ?? undefined}
          />
          <Select
            label="Etapa Educacional"
            value={stage}
            onChange={(e) => setStage(e.target.value as EducationalStage)}
            options={STAGE_OPTIONS}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Série / Grau Customizado"
            value={customGrade}
            onChange={(e) => setCustomGrade(e.target.value)}
            placeholder="Ex: 3º Ano"
          />
          <div className="ui-form-group">
            <label htmlFor="avatar-color" className="ui-form-label">
              Cor do Avatar
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
                placeholder="#3B82F6"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <Textarea
          label="Necessidades Especiais / Adaptações"
          rows={2}
          value={specialNeeds}
          onChange={(e) => setSpecialNeeds(e.target.value)}
          placeholder="Ex: Dislexia leve, necessidade de tempo adicional..."
        />

        <Textarea
          label="Anotações Pedagógicas"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Interesses, pontos fortes, ritmo de aprendizado..."
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
                Declaro ser o pai, a mãe ou o responsável legal por este estudante, ou ter autorização
                expressa de quem seja, e consinto com o tratamento dos dados dele para organizar e registrar
                suas atividades educacionais na plataforma, conforme a{' '}
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
                  Política de Privacidade
                </button>
                .{' '}
                {!hasReadConsentText && !consentLoading && (
                  <span data-testid="learner-consent-hint" style={{ fontSize: '0.8125rem', opacity: 0.75 }}>
                    (Abra e leia o documento até o final para habilitar o aceite.)
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
          title="Consentimento para tratamento de dados do educando"
          maxWidth="md"
          footer={
            <Button variant="secondary" onClick={() => setShowFullConsentText(false)}>
              Fechar
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
              Documento não disponível no momento. Tente novamente mais tarde.
            </p>
          )}
        </Modal>
      )}
    </Modal>
  );
}
