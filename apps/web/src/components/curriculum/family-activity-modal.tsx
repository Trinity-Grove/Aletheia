'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type { FamilyActivityResponseDto } from '@aletheia/contracts';

interface FamilyActivityModalProps {
  isOpen: boolean;
  familyId: string;
  activity: FamilyActivityResponseDto | null;
  onClose: () => void;
  onSaved: (activity: FamilyActivityResponseDto) => void;
}

export function FamilyActivityModal({
  isOpen,
  familyId,
  activity,
  onClose,
  onSaved,
}: FamilyActivityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [supervisionRequired, setSupervisionRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(activity?.name ?? '');
    setDescription(activity?.description ?? '');
    setVisibility(activity?.visibility ?? 'PRIVATE');
    setSupervisionRequired(activity?.supervisionRequired ?? false);
    setError(null);
  }, [isOpen, activity]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Dê um nome para a atividade.');
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
        throw new Error(err.message || 'Falha ao salvar a atividade.');
      }

      const saved: FamilyActivityResponseDto = await res.json();
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a atividade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
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
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)' }}>
          {activity ? 'Editar Atividade' : 'Criar Atividade da Família'}
        </h2>

        {error && <Alert variant="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Nome
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
            Descrição
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
            Requer supervisão de um adulto
          </label>

          <div>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Visibilidade
            </span>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Você decide se esta atividade fica só com a sua família ou visível para a comunidade.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                data-testid="family-activity-visibility-private"
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
                🔒 Privada
              </button>
              <button
                type="button"
                data-testid="family-activity-visibility-public"
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
                🌐 Pública
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            data-testid="family-activity-save-btn"
            onClick={handleSave}
            isLoading={saving}
          >
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}
