'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Editar Evidência de Portfólio' : 'Adicionar Evidência ao Portfólio'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" data-testid="cancel-portfolio-btn" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="portfolio-form" data-testid="save-portfolio-btn" isLoading={submitting}>
            {itemToEdit ? 'Salvar Alterações' : 'Salvar no Portfólio'}
          </Button>
        </>
      }
    >
      <form id="portfolio-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <Alert variant="error" data-testid="portfolio-form-error">
            {error}
          </Alert>
        )}

        {/* Learner & Evidence Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Educando *"
            data-testid="portfolio-learner-select"
            value={learnerId}
            onChange={(e) => setLearnerId(e.target.value)}
            options={[
              { value: '', label: 'Selecione o educando' },
              ...learners.map((l) => ({ value: l.id, label: l.preferredName || l.firstName })),
            ]}
          />

          <Select
            label="Tipo de Evidência *"
            data-testid="portfolio-type-select"
            value={type}
            onChange={(e) => setType(e.target.value as EvidenceType)}
            options={Object.entries(EVIDENCE_TYPE_CONFIG).map(([k, item]) => ({ value: k, label: item.label }))}
          />
        </div>

        <Input
          label="Título da Obra / Evidência *"
          data-testid="portfolio-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Desenho botânico da folha de Carvalho"
        />

        {/* Subject & Linked Record */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Disciplina Relacionada"
            data-testid="portfolio-subject-select"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={[
              { value: '', label: 'Sem disciplina vinculada' },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <Select
            label="Registro de Aprendizagem"
            data-testid="portfolio-record-select"
            value={learningRecordId}
            onChange={(e) => setLearningRecordId(e.target.value)}
            options={[
              { value: '', label: 'Nenhum registro vinculado' },
              ...records.map((r) => ({ value: r.id, label: `${r.title} (${r.date})` })),
            ]}
          />
        </div>

        {/* Media: file upload or external URL, depending on type */}
        {type === 'LINK' ? (
          <Input
            label="URL Externa"
            type="url"
            data-testid="portfolio-file-url-input"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://exemplo.com/fotos/desenho.jpg"
          />
        ) : FILE_EVIDENCE_TYPES.has(type) ? (
          <div>
            <Input
              label={`Arquivo ${itemToEdit?.mimeType ? '(substituir arquivo existente)' : ''}`}
              type="file"
              data-testid="portfolio-file-input"
              accept={ALLOWED_PORTFOLIO_MIME_TYPES.join(',')}
              onChange={handleFileChange}
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

        <Textarea
          label="Conteúdo em Texto / Transcrição da Narração"
          data-testid="portfolio-text-content-input"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          rows={3}
          placeholder="Texto digitado pelo educando, poema memorizado ou transcrição oral..."
        />

        <Textarea
          label="Comentários / Contexto da Produção"
          data-testid="portfolio-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Notas adicionais sobre a obra..."
        />

        {/* Date & Tags */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
          <Input
            label="Data da Produção"
            type="date"
            data-testid="portfolio-captured-date-input"
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
          />

          <Input
            label="Tags (separadas por vírgula)"
            data-testid="portfolio-tags-input"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Ex: botânica, aquarela, destaque"
          />
        </div>

        {/* Highlight Checkbox */}
        <div
          style={{
            backgroundColor: 'var(--color-amber-50)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.625rem 0.75rem',
          }}
        >
          <Checkbox
            data-testid="portfolio-highlight-checkbox"
            checked={isHighlight}
            onChange={(e) => setIsHighlight(e.target.checked)}
            label="Marcar como Destaque do Portfólio (Showcase)"
          />
        </div>
      </form>
    </Modal>
  );
}
