'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import {
  ALLOWED_PORTFOLIO_MIME_TYPES,
  PORTFOLIO_MAX_FILE_SIZE_BYTES,
  type CreatePortfolioItemDto,
  type PortfolioItemResponseDto,
  type LearnerSummaryDto,
  type SubjectResponseDto,
  type EvidenceType,
  type LearningRecordResponseDto,
} from '@aletheia/contracts';

const FILE_EVIDENCE_TYPES = new Set<EvidenceType>(['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'CERTIFICATE']);

export interface PortfolioItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreatePortfolioItemDto) => Promise<PortfolioItemResponseDto>;
  onUploadFile?: ((itemId: string, file: File) => Promise<void>) | undefined;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  records?: LearningRecordResponseDto[];
  itemToEdit?: PortfolioItemResponseDto | null | undefined;
  initialRecordId?: string | null | undefined;
  defaultLearnerId?: string | null | undefined;
}

export const EVIDENCE_TYPE_CONFIG: Record<
  EvidenceType,
  { label: string; icon: React.ReactNode }
> = {
  IMAGE: { label: 'Imagem / Foto do Caderno', icon: <AletheiaIcon name="image" size={16} /> },
  AUDIO: { label: 'Áudio / Narração Gravada', icon: <AletheiaIcon name="heart" size={16} /> },
  VIDEO: { label: 'Vídeo / Apresentação', icon: <AletheiaIcon name="sparkles" size={16} /> },
  DOCUMENT: { label: 'Documento / PDF / Redação', icon: <AletheiaIcon name="file-text" size={16} /> },
  LINK: { label: 'Link Externo', icon: <AletheiaIcon name="paperclip" size={16} /> },
  TEXT: { label: 'Texto / Citação / Transcrição', icon: <AletheiaIcon name="pencil" size={16} /> },
  CERTIFICATE: { label: 'Certificado / Conquista', icon: <AletheiaIcon name="sparkles" size={16} /> },
};

export function PortfolioItemModal({
  isOpen,
  onClose,
  onSave,
  onUploadFile,
  learners,
  subjects,
  records = [],
  itemToEdit,
  initialRecordId,
  defaultLearnerId,
}: PortfolioItemModalProps) {
  const [learnerId, setLearnerId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [learningRecordId, setLearningRecordId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EvidenceType>('IMAGE');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [capturedAt, setCapturedAt] = useState(() => new Date().toISOString().split('T')[0]!);
  const [isHighlight, setIsHighlight] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setLearnerId(itemToEdit.learnerId);
      setSubjectId(itemToEdit.subjectId || '');
      setLearningRecordId(itemToEdit.learningRecordId || '');
      setTitle(itemToEdit.title);
      setDescription(itemToEdit.description || '');
      setType(itemToEdit.type);
      setFileUrl(itemToEdit.fileUrl || '');
      setTextContent(itemToEdit.textContent || '');
      setCapturedAt(itemToEdit.capturedAt || new Date().toISOString().split('T')[0]!);
      setIsHighlight(itemToEdit.isHighlight);
      setTagsInput(itemToEdit.tags?.join(', ') || '');
    } else {
      const fallbackLearnerId = defaultLearnerId || (learners.length > 0 ? learners[0]!.id : '');
      setLearnerId(fallbackLearnerId);
      setSubjectId('');
      setLearningRecordId(initialRecordId || '');
      setTitle('');
      setDescription('');
      setType('IMAGE');
      setFileUrl('');
      setTextContent('');
      setCapturedAt(new Date().toISOString().split('T')[0]!);
      setIsHighlight(false);
      setTagsInput('');
    }
    setSelectedFile(null);
    setFileError(null);
    setError(null);
  }, [itemToEdit, isOpen, initialRecordId, defaultLearnerId, learners]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!(ALLOWED_PORTFOLIO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setFileError('Tipo de arquivo não suportado.');
      setSelectedFile(null);
      return;
    }
    if (file.size > PORTFOLIO_MAX_FILE_SIZE_BYTES) {
      setFileError(`Arquivo muito grande (máx. ${Math.floor(PORTFOLIO_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB).`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) {
      setError('Selecione um educando.');
      return;
    }
    if (!title.trim()) {
      setError('Informe o título do item de evidência.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const dto: CreatePortfolioItemDto = {
        learnerId,
        subjectId: subjectId || undefined,
        learningRecordId: learningRecordId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        fileUrl: type === 'LINK' ? fileUrl.trim() || undefined : undefined,
        textContent: textContent.trim() || undefined,
        capturedAt: capturedAt || undefined,
        isHighlight,
        tags: parsedTags,
      };

      const saved = await onSave(dto);
      if (selectedFile && onUploadFile) {
        await onUploadFile(saved.id, selectedFile);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar evidência';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="portfolio-item-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {itemToEdit ? 'Editar Evidência de Portfólio' : 'Adicionar Evidência ao Portfólio'}
          </h2>
          <button
            type="button"
            data-testid="close-portfolio-modal-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Fechar"
          >
            <AletheiaIcon name="x" size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {error && (
            <div
              data-testid="portfolio-form-error"
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-rose-50)',
                border: '1px solid var(--color-rose-100)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-rose-700)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Learner & Evidence Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="portfolio-learner-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Educando *
              </label>
              <select
                id="portfolio-learner-select"
                data-testid="portfolio-learner-select"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Selecione o educando</option>
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.preferredName || l.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="portfolio-type-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Tipo de Evidência *
              </label>
              <select
                id="portfolio-type-select"
                data-testid="portfolio-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as EvidenceType)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              >
                {Object.entries(EVIDENCE_TYPE_CONFIG).map(([k, item]) => (
                  <option key={k} value={k}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="portfolio-title-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
            >
              Título da Obra / Evidência *
            </label>
            <input
              id="portfolio-title-input"
              type="text"
              data-testid="portfolio-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenho botânico da folha de Carvalho"
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Subject & Linked Record */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="portfolio-subject-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Disciplina Relacionada
              </label>
              <select
                id="portfolio-subject-select"
                data-testid="portfolio-subject-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Sem disciplina vinculada</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="portfolio-record-select"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Registro de Aprendizagem
              </label>
              <select
                id="portfolio-record-select"
                data-testid="portfolio-record-select"
                value={learningRecordId}
                onChange={(e) => setLearningRecordId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">Nenhum registro vinculado</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media: file upload or external URL, depending on type */}
          {type === 'LINK' ? (
            <div>
              <label
                htmlFor="portfolio-file-url-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                URL Externa
              </label>
              <input
                id="portfolio-file-url-input"
                type="url"
                data-testid="portfolio-file-url-input"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://exemplo.com/fotos/desenho.jpg"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          ) : FILE_EVIDENCE_TYPES.has(type) ? (
            <div>
              <label
                htmlFor="portfolio-file-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Arquivo {itemToEdit?.mimeType ? '(substituir arquivo existente)' : ''}
              </label>
              <input
                id="portfolio-file-input"
                type="file"
                data-testid="portfolio-file-input"
                accept={ALLOWED_PORTFOLIO_MIME_TYPES.join(',')}
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              />
              {fileError && (
                <span data-testid="portfolio-file-error" style={{ fontSize: '0.8125rem', color: 'var(--color-rose-700)', marginTop: '0.25rem', display: 'block' }}>
                  {fileError}
                </span>
              )}
              {itemToEdit?.mimeType && !selectedFile && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  Arquivo atual: {itemToEdit.mimeType}
                </span>
              )}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="portfolio-text-content-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
            >
              Conteúdo em Texto / Transcrição da Narração
            </label>
            <textarea
              id="portfolio-text-content-input"
              data-testid="portfolio-text-content-input"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={3}
              placeholder="Texto digitado pelo educando, poema memorizado ou transcrição oral..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="portfolio-description-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
            >
              Comentários / Contexto da Produção
            </label>
            <textarea
              id="portfolio-description-input"
              data-testid="portfolio-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notas adicionais sobre a obra..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Date & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
            <div>
              <label
                htmlFor="portfolio-captured-date-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Data da Produção
              </label>
              <input
                id="portfolio-captured-date-input"
                type="date"
                data-testid="portfolio-captured-date-input"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="portfolio-tags-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
              >
                Tags (separadas por vírgula)
              </label>
              <input
                id="portfolio-tags-input"
                type="text"
                data-testid="portfolio-tags-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: botânica, aquarela, destaque"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          {/* Highlight Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-amber-700)',
              backgroundColor: 'var(--color-amber-50)',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              data-testid="portfolio-highlight-checkbox"
              checked={isHighlight}
              onChange={(e) => setIsHighlight(e.target.checked)}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="sparkles" size={14} style={{ color: isHighlight ? 'var(--color-amber-600)' : 'currentColor' }} />
              <span>Marcar como Destaque do Portfólio (Showcase)</span>
            </span>
          </label>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              data-testid="cancel-portfolio-btn"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="save-portfolio-btn"
              disabled={submitting}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Salvando...' : itemToEdit ? 'Salvar Alterações' : 'Salvar no Portfólio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
