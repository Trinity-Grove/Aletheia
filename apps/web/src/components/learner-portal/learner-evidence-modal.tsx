'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { LearnerTrackedCompetency } from './types';

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
      setError('Por favor, selecione uma competência.');
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setError('O título deve ter no mínimo 3 caracteres.');
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
        throw new Error(errData.message || 'Falha ao enviar evidência.');
      }

      onSuccess('Parabéns! Sua evidência foi enviada aos seus responsáveis para validação!');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar evidência.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeTrackings = trackings.filter((t) => t.status !== 'RETIRED');
  const trackingOptions = [
    { value: '', label: 'Selecione a competência...' },
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
    { value: 'WORK_SAMPLE', label: 'Amostra de Trabalho' },
    { value: 'PHOTO', label: 'Foto / Imagem' },
    { value: 'DOCUMENT', label: 'Documento Escrito' },
    { value: 'AUDIO', label: 'Gravação de Áudio' },
    { value: 'TEXT', label: 'Texto / Narração' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Trabalho ou Evidência"
      description="Envie o que você produziu para seus pais ou responsáveis revisarem."
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
            Cancelar
          </Button>
          <Button
            type="submit"
            form="learner-evidence-form"
            variant="primary"
            data-testid="submit-evidence-btn"
            isLoading={submitting}
          >
            Enviar Evidência
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
            label="Competência Relacionada *"
            data-testid="evidence-competency-select"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            options={trackingOptions}
            required
          />

          <Select
            label="Tipo de Evidência *"
            data-testid="evidence-type-select"
            value={evidenceTypeCode}
            onChange={(e) => setEvidenceTypeCode(e.target.value)}
            options={typeOptions}
            required
          />

          <Input
            label="Título do Trabalho *"
            data-testid="evidence-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Redação sobre a Grécia Antiga, Desenho Botânico..."
            required
          />

          <Textarea
            label="O que você aprendeu? (opcional)"
            data-testid="evidence-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Conte brevemente como realizou este trabalho e o que achou..."
          />

          <Input
            type="url"
            label="Link do arquivo ou trabalho (opcional)"
            data-testid="evidence-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/meu-trabalho"
          />

          <Textarea
            label="Recado para seus pais (opcional)"
            data-testid="evidence-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: Consegui concluir todas as questões sem ajuda!"
          />
        </form>
      </div>
    </Modal>
  );
}
