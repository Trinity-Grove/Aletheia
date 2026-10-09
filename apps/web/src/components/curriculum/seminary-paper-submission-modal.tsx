'use client';

import React, { useEffect, useState } from 'react';
import {
  SEMINARY_EVIDENCE_TYPE_CODES,
  type SeminaryDiscipline,
  type SeminaryEvidenceTypeCode,
} from '@aletheia/contracts';
import { Button, Modal, Alert } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface SeminaryPaperSubmissionData {
  disciplineCode: string;
  evidenceTypeCode: SeminaryEvidenceTypeCode;
  title: string;
  textContent: string;
  fileUrl?: string | null | undefined;
}

export interface SeminaryPaperSubmissionModalProps {
  isOpen: boolean;
  onClose(): void;
  discipline: SeminaryDiscipline | null;
  onSubmit(data: SeminaryPaperSubmissionData): Promise<void>;
}

const EVIDENCE_TYPE_LABELS: Record<SeminaryEvidenceTypeCode, string> = {
  THEOLOGICAL_ESSAY: 'Ensaio Teológico',
  EXEGESIS_PAPER: 'Artigo Exegético',
  BOOK_REVIEW: 'Resenha Crítica',
  ORAL_DEFENSE: 'Defesa Oral',
  THEOLOGICAL_DEBATE: 'Debate Teológico',
};

export function SeminaryPaperSubmissionModal({
  isOpen,
  onClose,
  discipline,
  onSubmit,
}: SeminaryPaperSubmissionModalProps) {
  const { t } = useLocale();

  const [evidenceTypeCode, setEvidenceTypeCode] = useState<SeminaryEvidenceTypeCode>(
    discipline?.suggestedEvidenceTypes?.[0] ?? 'THEOLOGICAL_ESSAY'
  );
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize or reset form when discipline changes or modal is opened
  useEffect(() => {
    if (isOpen) {
      setEvidenceTypeCode(discipline?.suggestedEvidenceTypes?.[0] ?? 'THEOLOGICAL_ESSAY');
      setTitle('');
      setTextContent('');
      setFileUrl('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, discipline]);

  if (!isOpen || !discipline) return null;

  const isFormValid = title.trim().length > 0 && textContent.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        disciplineCode: discipline.code,
        evidenceTypeCode,
        title: title.trim(),
        textContent: textContent.trim(),
        fileUrl: fileUrl.trim() ? fileUrl.trim() : null,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao processar submissão do trabalho acadêmico';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--gold-dark)',
              letterSpacing: '0.05em',
            }}
          >
            {t('curriculum.seminary.cycleLabel', { cycle: discipline.cycle })}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)' }}>
            {discipline.name}
          </span>
        </div>
      }
      description={
        <span>
          Submissão de produção acadêmica e evidência de aprendizado para a disciplina{' '}
          <strong>{discipline.competencyCode}</strong>.
        </span>
      }
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginTop: '0.5rem',
        }}
      >
        {error && (
          <div data-testid="paper-submission-error">
            <Alert variant="error" title={t('curriculum.seminaryPaperModal.submissionErrorTitle')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Evidence Type Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label
            htmlFor="evidence-type-select"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Formato de Trabalho Acadêmico
          </label>
          <select
            id="evidence-type-select"
            data-testid="evidence-type-select"
            value={evidenceTypeCode}
            onChange={(e) => setEvidenceTypeCode(e.target.value as SeminaryEvidenceTypeCode)}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          >
            {SEMINARY_EVIDENCE_TYPE_CODES.map((code) => (
              <option key={code} value={code}>
                {EVIDENCE_TYPE_LABELS[code]} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* Title Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label
            htmlFor="paper-title-input"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Título do Trabalho <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
          </label>
          <input
            id="paper-title-input"
            data-testid="paper-title-input"
            type="text"
            placeholder={t('curriculum.seminaryPaperModal.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Text Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label
            htmlFor="paper-content-textarea"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Conteúdo / Síntese do Trabalho <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
          </label>
          <textarea
            id="paper-content-textarea"
            data-testid="paper-content-textarea"
            placeholder={t('curriculum.seminaryPaperModal.textPlaceholder')}
            rows={8}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* File URL Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label
            htmlFor="paper-file-url-input"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            URL do Documento / Anexo PDF (opcional)
          </label>
          <input
            id="paper-file-url-input"
            data-testid="paper-file-url-input"
            type="url"
            placeholder="https://exemplo.com/documentos/trabalho-teologico.pdf"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            marginTop: '0.5rem',
          }}
        >
          <Button
            type="button"
            variant="outline"
            data-testid="cancel-paper-submission-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            data-testid="save-paper-submission-btn"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Submissão'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
