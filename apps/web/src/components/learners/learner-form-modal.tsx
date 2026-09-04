'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea, useToast } from '@aletheia/ui';
import type { CreateLearnerDto, EducationalStage, LearnerResponseDto } from '@aletheia/contracts';

export interface LearnerFormModalProps {
  isOpen: boolean;
  initialData?: LearnerResponseDto | null;
  onClose: () => void;
  onSubmit: (_data: CreateLearnerDto) => Promise<void> | void;
}

const STAGE_OPTIONS: { value: EducationalStage; label: string }[] = [
  { value: 'EARLY_YEARS', label: 'Educação Infantil (Early Years)' },
  { value: 'PRIMARY_GRAMMAR', label: 'Ensino Fundamental I (Grammar)' },
  { value: 'MIDDLE_LOGIC', label: 'Ensino Fundamental II (Logic)' },
  { value: 'HIGH_RHETORIC', label: 'Ensino Médio (Rhetoric)' },
  { value: 'OTHER', label: 'Outro' },
];

export function LearnerFormModal({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}: LearnerFormModalProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [stage, setStage] = useState<EducationalStage>('PRIMARY_GRAMMAR');
  const [customGrade, setCustomGrade] = useState('');
  const [avatarColor, setAvatarColor] = useState('#3B82F6');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPreferredName(initialData.preferredName || '');
      setBirthDate(initialData.birthDate || '');
      setStage(initialData.stage || 'PRIMARY_GRAMMAR');
      setCustomGrade(initialData.customGrade || '');
      setAvatarColor(initialData.avatarColor || '#3B82F6');
      setSpecialNeeds(initialData.specialNeeds || '');
      setNotes(initialData.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setPreferredName('');
      setBirthDate('');
      setStage('PRIMARY_GRAMMAR');
      setCustomGrade('');
      setAvatarColor('#3B82F6');
      setSpecialNeeds('');
      setNotes('');
    }
    setSubmitError(null);
    setFirstNameError(null);
    setBirthDateError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextFirstNameError = firstName.trim() ? null : 'Nome é obrigatório.';
    const nextBirthDateError = birthDate ? null : 'Data de nascimento é obrigatória.';
    setFirstNameError(nextFirstNameError);
    setBirthDateError(nextBirthDateError);

    if (nextFirstNameError || nextBirthDateError) {
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
      </form>
    </Modal>
  );
}
