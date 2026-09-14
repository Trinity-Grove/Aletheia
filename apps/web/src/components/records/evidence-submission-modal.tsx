'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type {
  CreateEvidenceSubmissionDto,
  EvidenceTypeCatalogEntryDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';

export type EvidenceSubmissionFormValues = Omit<CreateEvidenceSubmissionDto, 'learnerId'>;

export interface EvidenceSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: EvidenceSubmissionFormValues) => Promise<void>;
  evidenceTypeCatalog: EvidenceTypeCatalogEntryDto[];
  trackedCompetencies: LearnerCompetencyTrackingResponseDto[];
  initialCompetencyDefinitionId?: string | null | undefined;
}

// Submits evidence against one or more tracked competencies (issue #126
// item 3), using the already-built, already-tested EvidenceSubmission API
// from Fase 2. This is the successor to the Diario de Aprendizagem's
// creation UI for the competency-tracking flow -- additive, alongside the
// existing Diario tab, not a replacement of it in this PR.
export function EvidenceSubmissionModal({
  isOpen,
  onClose,
  onSave,
  evidenceTypeCatalog,
  trackedCompetencies,
  initialCompetencyDefinitionId,
}: EvidenceSubmissionModalProps) {
  const [evidenceTypeId, setEvidenceTypeId] = useState('');
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const [textContent, setTextContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEvidenceTypeId(evidenceTypeCatalog.length > 0 ? evidenceTypeCatalog[0]!.id : '');
      setSelectedCompetencyIds(initialCompetencyDefinitionId ? [initialCompetencyDefinitionId] : []);
      setTextContent('');
      setFileUrl('');
      setError(null);
    }
  }, [isOpen, initialCompetencyDefinitionId]);

  const toggleCompetency = (id: string) => {
    setSelectedCompetencyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTypeId || selectedCompetencyIds.length === 0) return;
    if (!textContent.trim() && !fileUrl.trim()) {
      setError('Informe um texto ou um link de arquivo como evidência.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        evidenceTypeId,
        competencies: selectedCompetencyIds.map((competencyDefinitionId) => ({ competencyDefinitionId })),
        textContent: textContent.trim() || null,
        fileUrl: fileUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar evidência.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCompetencies = trackedCompetencies.filter((t) => t.status === 'ACTIVE');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Evidência"
      description="Registre uma evidência de aprendizagem e vincule às competências acompanhadas correspondentes."
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" data-testid="cancel-evidence-submission-btn" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="evidence-submission-form"
            data-testid="save-evidence-submission-btn"
            isLoading={submitting}
            disabled={!evidenceTypeId || selectedCompetencyIds.length === 0}
          >
            Enviar Evidência
          </Button>
        </>
      }
    >
      <form
        id="evidence-submission-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {error && (
          <Alert variant="error" data-testid="evidence-submission-error">
            {error}
          </Alert>
        )}

        <Select
          label="Tipo de Evidência *"
          data-testid="evidence-type-select"
          value={evidenceTypeId}
          onChange={(e) => setEvidenceTypeId(e.target.value)}
          options={[
            { value: '', label: 'Selecione um tipo...' },
            ...evidenceTypeCatalog.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />

        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Competências relacionadas *
          </div>
          {activeCompetencies.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Nenhuma competência ativa acompanhada ainda -- ative um currículo primeiro.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {activeCompetencies.map((tracking) => (
                <Checkbox
                  key={tracking.id}
                  data-testid={`evidence-competency-checkbox-${tracking.competencyDefinitionId}`}
                  checked={selectedCompetencyIds.includes(tracking.competencyDefinitionId)}
                  onChange={() => toggleCompetency(tracking.competencyDefinitionId)}
                  label={`${tracking.competency.title} (${tracking.competency.domainTitle})`}
                />
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Descrição / Narração"
          data-testid="evidence-text-content-input"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          rows={4}
          placeholder="Ex: Narrou de volta o capítulo lido, com detalhes sobre..."
        />

        <Input
          label="Link do arquivo (opcional)"
          data-testid="evidence-file-url-input"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://..."
        />
      </form>
    </Modal>
  );
}
