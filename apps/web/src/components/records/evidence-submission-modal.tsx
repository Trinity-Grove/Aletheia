'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
import {
  ALLOWED_PORTFOLIO_MIME_TYPES,
  PORTFOLIO_MAX_FILE_SIZE_BYTES,
  type CreateEvidenceSubmissionDto,
  type EvidenceTypeCatalogEntryDto,
  type LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';

export type EvidenceSubmissionFormValues = Omit<CreateEvidenceSubmissionDto, 'learnerId'>;

export interface EvidenceSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: EvidenceSubmissionFormValues, file?: File | null) => Promise<void>;
  evidenceTypeCatalog: EvidenceTypeCatalogEntryDto[];
  trackedCompetencies: LearnerCompetencyTrackingResponseDto[];
  initialCompetencyDefinitionId?: string | null | undefined;
  onUploadFile?: ((file: File) => Promise<{ fileUrl: string; storageKey?: string; mimeType?: string; fileSizeBytes?: number }>) | undefined;
}

// Submits evidence against one or more tracked competencies (issue #126
// item 3), using the already-built, already-tested EvidenceSubmission API
// from Fase 2. This is the successor to the Diario de Aprendizagem's
// creation UI for the competency-tracking flow -- additive, alongside the
// existing Diario tab, not a replacement of it in this PR.
//
// Enhanced with direct file upload support (images, audios, videos, PDFs up to 25MB)
// aligned with PortfolioItemModal and FamilyCurriculumPackModal.
export function EvidenceSubmissionModal({
  isOpen,
  onClose,
  onSave,
  evidenceTypeCatalog,
  trackedCompetencies,
  initialCompetencyDefinitionId,
  onUploadFile,
}: EvidenceSubmissionModalProps) {
  const [evidenceTypeId, setEvidenceTypeId] = useState('');
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([]);
  const [textContent, setTextContent] = useState('');
  const [sourceType, setSourceType] = useState<'UPLOAD' | 'EXTERNAL_URL'>('UPLOAD');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEvidenceTypeId(evidenceTypeCatalog.length > 0 ? evidenceTypeCatalog[0]!.id : '');
      setSelectedCompetencyIds(initialCompetencyDefinitionId ? [initialCompetencyDefinitionId] : []);
      setTextContent('');
      setSourceType('UPLOAD');
      setFileUrl('');
      setSelectedFile(null);
      setFileError(null);
      setError(null);
    }
  }, [isOpen, initialCompetencyDefinitionId, evidenceTypeCatalog]);

  const toggleCompetency = (id: string) => {
    setSelectedCompetencyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!(ALLOWED_PORTFOLIO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setFileError('Tipo de arquivo não suportado. Use imagens (PNG/JPEG/WebP/GIF), áudios (MP3/WAV/MP4), vídeos (MP4/WebM) ou PDF.');
      setSelectedFile(null);
      return;
    }
    if (file.size > PORTFOLIO_MAX_FILE_SIZE_BYTES) {
      setFileError(`Arquivo muito grande (máximo ${Math.floor(PORTFOLIO_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB).`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTypeId || selectedCompetencyIds.length === 0) return;

    const hasText = Boolean(textContent.trim());
    const hasUrl = sourceType === 'EXTERNAL_URL' && Boolean(fileUrl.trim());
    const hasFile = sourceType === 'UPLOAD' && Boolean(selectedFile);

    if (!hasText && !hasUrl && !hasFile) {
      setError('Informe um texto, link ou selecione um arquivo como evidência.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let finalFileUrl = sourceType === 'EXTERNAL_URL' && fileUrl.trim() ? fileUrl.trim() : null;
      let storageKey: string | null = null;
      let mimeType: string | null = selectedFile ? selectedFile.type : null;
      let fileSizeBytes: number | null = selectedFile ? selectedFile.size : null;

      if (sourceType === 'UPLOAD' && selectedFile && onUploadFile) {
        const uploadResult = await onUploadFile(selectedFile);
        finalFileUrl = uploadResult.fileUrl;
        storageKey = uploadResult.storageKey || null;
        if (uploadResult.mimeType) mimeType = uploadResult.mimeType;
        if (uploadResult.fileSizeBytes) fileSizeBytes = uploadResult.fileSizeBytes;
      }

      await onSave(
        {
          evidenceTypeId,
          competencies: selectedCompetencyIds.map((competencyDefinitionId) => ({ competencyDefinitionId })),
          textContent: textContent.trim() || null,
          fileUrl: finalFileUrl,
          storageKey,
          mimeType,
          fileSizeBytes,
        },
        selectedFile,
      );
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

        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
            Arquivo da Evidência
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              data-testid="evidence-source-upload-btn"
              onClick={() => {
                setSourceType('UPLOAD');
                setFileError(null);
              }}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: sourceType === 'UPLOAD' ? 'var(--forest)' : 'var(--border-light)',
                backgroundColor: sourceType === 'UPLOAD' ? 'var(--forest)' : 'var(--bg-surface)',
                color: sourceType === 'UPLOAD' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📤 Upload Direto
            </button>
            <button
              type="button"
              data-testid="evidence-source-url-btn"
              onClick={() => {
                setSourceType('EXTERNAL_URL');
                setFileError(null);
              }}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: sourceType === 'EXTERNAL_URL' ? 'var(--forest)' : 'var(--border-light)',
                backgroundColor: sourceType === 'EXTERNAL_URL' ? 'var(--forest)' : 'var(--bg-surface)',
                color: sourceType === 'EXTERNAL_URL' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🌐 Link Externo (HTTPS)
            </button>
          </div>

          {sourceType === 'UPLOAD' ? (
            <div>
              <input
                type="file"
                data-testid="evidence-file-input"
                accept={ALLOWED_PORTFOLIO_MIME_TYPES.join(',')}
                onChange={handleFileChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-light)',
                  backgroundColor: 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Formatos aceitos: Imagens (PNG/JPG/WebP/GIF), Áudios (MP3/WAV), Vídeos (MP4/WebM) e PDF (máx. 25MB)
              </span>
              {fileError && (
                <div
                  data-testid="evidence-file-error"
                  style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.75rem', marginTop: '0.25rem' }}
                >
                  {fileError}
                </div>
              )}
              {selectedFile && !fileError && (
                <div
                  data-testid="evidence-selected-file-info"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.375rem',
                    padding: '0.375rem 0.625rem',
                    backgroundColor: 'var(--color-slate-50, #f8fafc)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span>
                    📎 <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Input
              label="Link do arquivo / URL"
              data-testid="evidence-file-url-input"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
