'use client';

import React, { useEffect, useState } from 'react';
import type { CreateLearnerDto, EducationalStage, LearnerResponseDto } from '@aletheia/contracts';

export interface LearnerFormModalProps {
  isOpen: boolean;
  initialData?: LearnerResponseDto | null;
  onClose: () => void;
  onSubmit: (_data: CreateLearnerDto) => Promise<void> | void;
}

export function LearnerFormModal({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}: LearnerFormModalProps) {
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !birthDate) {
      setError('Nome e data de nascimento são obrigatórios.');
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
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar educando.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          maxWidth: '550px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {initialData ? 'Editar Educando' : 'Novo Educando'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="first-name">Primeiro Nome *</label>
            <input
              id="first-name"
              type="text"
              data-testid="learner-first-name-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex: Clara"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="last-name">Sobrenome</label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Silva"
              />
            </div>
            <div className="form-group">
              <label htmlFor="preferred-name">Nome Preferido / Apelido</label>
              <input
                id="preferred-name"
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Ex: Clarinha"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="birth-date">Data de Nascimento *</label>
              <input
                id="birth-date"
                type="date"
                data-testid="learner-birth-date-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="stage">Etapa Educacional</label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as EducationalStage)}
              >
                <option value="EARLY_YEARS">Educação Infantil (Early Years)</option>
                <option value="PRIMARY_GRAMMAR">Ensino Fundamental I (Grammar)</option>
                <option value="MIDDLE_LOGIC">Ensino Fundamental II (Logic)</option>
                <option value="HIGH_RHETORIC">Ensino Médio (Rhetoric)</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="custom-grade">Série / Grau Customizado</label>
              <input
                id="custom-grade"
                type="text"
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                placeholder="Ex: 3º Ano"
              />
            </div>
            <div className="form-group">
              <label htmlFor="avatar-color">Cor do Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="avatar-color"
                  type="color"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  style={{ width: '40px', height: '38px', padding: '0', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  placeholder="#3B82F6"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="special-needs">Necessidades Especiais / Adaptações</label>
            <textarea
              id="special-needs"
              rows={2}
              value={specialNeeds}
              onChange={(e) => setSpecialNeeds(e.target.value)}
              placeholder="Ex: Dislexia leve, necessidade de tempo adicional..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Anotações Pedagógicas</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interesses, pontos fortes, ritmo de aprendizado..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="learner-submit-btn"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Educando'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
