'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import {
  ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES,
  FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES,
  type CurriculumPackResponseDto,
  type FamilyCurriculumPackMediaResponseDto,
  type FamilyCurriculumPackMediaUploadUrlResponseDto,
  type FamilyCurriculumPackResponseDto,
  type FamilyCurriculumPackRevisionResponseDto,
} from '@aletheia/contracts';
import { getApiAuthToken } from '../../lib/api';

export interface FamilyCurriculumPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  installedPack: FamilyCurriculumPackResponseDto | null;
  catalogPack?: CurriculumPackResponseDto | null | undefined;
  onPackUpdated?: (_updatedPack: FamilyCurriculumPackResponseDto) => void;
}

function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '');
      return id || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.replace('/embed/', '') || null;
      }
    }
  } catch {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] ?? null : null;
  }
  return null;
}

export function FamilyCurriculumPackModal({
  isOpen,
  onClose,
  familyId,
  installedPack,
  catalogPack,
  onPackUpdated,
}: FamilyCurriculumPackModalProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'revisions' | 'editor'>('media');

  // Media state
  const [mediaList, setMediaList] = useState<FamilyCurriculumPackMediaResponseDto[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSuccess, setMediaSuccess] = useState<string | null>(null);

  // New media form state
  const [mediaSourceType, setMediaSourceType] = useState<'EXTERNAL_URL' | 'UPLOAD'>('EXTERNAL_URL');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('DOCUMENT');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submittingMedia, setSubmittingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // Revisions state
  const [revisionsList, setRevisionsList] = useState<FamilyCurriculumPackRevisionResponseDto[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const packName = catalogPack?.name || installedPack?.sourcePackCode || 'Pacote Curricular';

  const loadMedia = async () => {
    if (!installedPack) return;
    try {
      setLoadingMedia(true);
      setMediaError(null);
      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/media`,
        { credentials: 'include' }
      );
      if (res && res.ok) {
        const data = await res.json();
        setMediaList(Array.isArray(data) ? data : []);
      }
    } catch {
      setMediaError('Falha ao carregar mídias complementares.');
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadRevisions = async () => {
    if (!installedPack) return;
    try {
      setLoadingRevisions(true);
      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/revisions`,
        { credentials: 'include' }
      );
      if (res && res.ok) {
        const data = await res.json();
        setRevisionsList(Array.isArray(data) ? data : []);
      }
    } catch {
      // Revisions non-blocking
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Current pack state (keeps track of revision increments)
  const [currentPack, setCurrentPack] = useState<FamilyCurriculumPackResponseDto | null>(installedPack);

  // Editor state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFamilyNotes, setEditFamilyNotes] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && installedPack) {
      setCurrentPack(installedPack);
      const doc = (installedPack.document as any) || {};
      setEditName(doc.pack?.name || catalogPack?.name || installedPack.sourcePackCode || '');
      setEditDescription(doc.pack?.description || catalogPack?.description || '');
      setEditFamilyNotes(doc.pack?.metadata?.familyNotes || '');
      setEditItems(Array.isArray(doc.items) ? doc.items : []);
      setEditError(null);
      setEditSuccess(null);
      setActiveTab('media');
      setMediaTitle('');
      setMediaUrl('');
      setMediaDescription('');
      setMediaType('DOCUMENT');
      setMediaError(null);
      setMediaSuccess(null);
      void loadMedia();
      void loadRevisions();
    }
  }, [isOpen, installedPack?.id, installedPack?.revision]);

  const handleSaveRevision = async () => {
    const targetPack = currentPack || installedPack;
    if (!targetPack) return;
    if (!editName.trim()) {
      setEditError('O nome do pacote não pode ficar vazio.');
      return;
    }

    setIsSavingRevision(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const existingDoc = (targetPack.document as any) || {};
      const updatedDoc = {
        formatVersion: existingDoc.formatVersion || '1.0.0',
        exportedAt: new Date().toISOString(),
        pack: {
          code: existingDoc.pack?.code || targetPack.sourcePackCode,
          version: existingDoc.pack?.version || targetPack.sourcePackVersion,
          status: existingDoc.pack?.status || 'PUBLISHED',
          schemaVersion: existingDoc.pack?.schemaVersion || '1.0.0',
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          metadata: {
            ...(existingDoc.pack?.metadata || {}),
            familyNotes: editFamilyNotes.trim() || undefined,
            lastEditedAt: new Date().toISOString(),
          },
        },
        dependencies: existingDoc.dependencies || [],
        items: editItems,
      };

      const authToken = getApiAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum-packs/${targetPack.id}`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ document: updatedDoc }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao salvar nova revisão do pacote.');
      }

      const updated: FamilyCurriculumPackResponseDto = await res.json();
      setCurrentPack(updated);
      setEditSuccess('Nova revisão do pacote salva com sucesso!');

      if (onPackUpdated) {
        onPackUpdated(updated);
      }

      void loadRevisions();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Erro ao salvar revisão.');
    } finally {
      setIsSavingRevision(false);
    }
  };

  if (!installedPack) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES) {
      setFileError('Arquivo muito grande (máximo 25MB).');
      setSelectedFile(null);
      return;
    }
    if (!(ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES as readonly string[]).includes(file.type)) {
      setFileError('Formato de arquivo não suportado. Use imagens (PNG/JPEG/WebP), vídeos (MP4/WebM) ou PDF.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    if (!mediaTitle.trim()) {
      setMediaTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (file.type.startsWith('image/')) {
      setMediaType('IMAGE');
    } else if (file.type.startsWith('video/')) {
      setMediaType('VIDEO');
    } else if (file.type === 'application/pdf') {
      setMediaType('DOCUMENT');
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) {
      setMediaError('O título da mídia é obrigatório.');
      return;
    }

    if (mediaSourceType === 'EXTERNAL_URL') {
      if (!mediaUrl.trim() || !mediaUrl.startsWith('https://')) {
        setMediaError('A URL deve ser válida e usar o protocolo seguro HTTPS (https://).');
        return;
      }

      try {
        setSubmittingMedia(true);
        setMediaError(null);
        const res = await fetch(
          `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sourceType: 'EXTERNAL_URL',
              mediaType,
              title: mediaTitle.trim(),
              url: mediaUrl.trim(),
              description: mediaDescription.trim() || undefined,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Falha ao anexar mídia ao pacote.');
        }

        const created: FamilyCurriculumPackMediaResponseDto = await res.json();
        setMediaList((prev) => [created, ...prev]);
        setMediaTitle('');
        setMediaUrl('');
        setMediaDescription('');
        setMediaSuccess('Mídia complementar anexada com sucesso!');
        setTimeout(() => setMediaSuccess(null), 4000);
      } catch (err: unknown) {
        setMediaError(err instanceof Error ? err.message : 'Falha ao anexar mídia.');
      } finally {
        setSubmittingMedia(false);
      }
    } else {
      if (!selectedFile) {
        setMediaError('Por favor selecione um arquivo para upload.');
        return;
      }
      if (selectedFile.size > FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES) {
        setMediaError('Arquivo muito grande (máximo 25MB).');
        return;
      }

      try {
        setSubmittingMedia(true);
        setMediaError(null);

        const uploadUrlRes = await fetch(
          `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/media/upload-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              mediaType,
              title: mediaTitle.trim(),
              description: mediaDescription.trim() || undefined,
              fileName: selectedFile.name,
              mimeType: selectedFile.type,
              fileSizeBytes: selectedFile.size,
            }),
          }
        );

        if (!uploadUrlRes.ok) {
          const err = await uploadUrlRes.json().catch(() => ({}));
          throw new Error(err.message || 'Falha ao preparar upload.');
        }

        const { mediaId, uploadUrl }: FamilyCurriculumPackMediaUploadUrlResponseDto = await uploadUrlRes.json();

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile,
        });

        if (!putRes.ok) {
          throw new Error('Falha ao enviar arquivo para o armazenamento.');
        }

        const confirmRes = await fetch(
          `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/media/${mediaId}/confirm-upload`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!confirmRes.ok) {
          const err = await confirmRes.json().catch(() => ({}));
          throw new Error(err.message || 'Falha ao confirmar envio do arquivo.');
        }

        const created: FamilyCurriculumPackMediaResponseDto = await confirmRes.json();
        setMediaList((prev) => [created, ...prev]);
        setMediaTitle('');
        setSelectedFile(null);
        setMediaDescription('');
        setMediaSuccess('Mídia complementar anexada com sucesso!');
        setTimeout(() => setMediaSuccess(null), 4000);
      } catch (err: unknown) {
        setMediaError(err instanceof Error ? err.message : 'Falha ao anexar mídia.');
      } finally {
        setSubmittingMedia(false);
      }
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      setDeletingMediaId(mediaId);
      setMediaError(null);
      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum-packs/${installedPack.id}/media/${mediaId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao remover mídia.');
      }

      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      setMediaSuccess('Mídia removida com sucesso.');
      setTimeout(() => setMediaSuccess(null), 3000);
    } catch (err: unknown) {
      setMediaError(err instanceof Error ? err.message : 'Erro ao remover mídia.');
    } finally {
      setDeletingMediaId(null);
    }
  };

  const mediaTypeOptions = [
    { value: 'DOCUMENT', label: 'Documento (PDF, Texto)' },
    { value: 'IMAGE', label: 'Imagem / Infográfico' },
    { value: 'VIDEO', label: 'Vídeo / Aula Externa' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gerenciar Pacote — ${packName}`}
      description="Gerencie as mídias complementares da família e acompanhe o histórico de revisões."
      maxWidth="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div data-testid="family-pack-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {mediaError && (
          <Alert variant="error" data-testid="pack-modal-error">
            {mediaError}
          </Alert>
        )}

        {mediaSuccess && (
          <Alert variant="success" data-testid="pack-modal-success">
            {mediaSuccess}
          </Alert>
        )}

        {/* Tab selector */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'media'}
            data-testid="pack-modal-tab-media"
            onClick={() => setActiveTab('media')}
            style={{
              padding: '0.625rem 1rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'media' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'media' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              marginBottom: '-2px',
            }}
          >
            Mídias & Anexos ({mediaList.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'revisions'}
            data-testid="pack-modal-tab-revisions"
            onClick={() => setActiveTab('revisions')}
            style={{
              padding: '0.625rem 1rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'revisions' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'revisions' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              marginBottom: '-2px',
            }}
          >
            Histórico de Revisões ({revisionsList.length || (currentPack?.revision ?? installedPack.revision)})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'editor'}
            data-testid="pack-modal-tab-editor"
            onClick={() => setActiveTab('editor')}
            style={{
              padding: '0.625rem 1rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'editor' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'editor' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              marginBottom: '-2px',
            }}
          >
            Personalizar Conteúdo ✏️
          </button>
        </div>

        {/* Tab 1: Mídias */}
        {activeTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Form de Anexar Mídia */}
            <form
              onSubmit={handleAddMedia}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
                  Anexar Novo Material ou Link Complementar
                </span>

                {/* Seletor de Modo: Link Externo vs Upload */}
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    type="button"
                    data-testid="pack-media-source-external-btn"
                    onClick={() => {
                      setMediaSourceType('EXTERNAL_URL');
                      setFileError(null);
                    }}
                    style={{
                      padding: '0.3rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      borderColor: mediaSourceType === 'EXTERNAL_URL' ? 'var(--forest)' : 'var(--border-light)',
                      backgroundColor: mediaSourceType === 'EXTERNAL_URL' ? 'var(--forest)' : 'var(--bg-surface)',
                      color: mediaSourceType === 'EXTERNAL_URL' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    🌐 Link Externo / YouTube
                  </button>
                  <button
                    type="button"
                    data-testid="pack-media-source-upload-btn"
                    onClick={() => {
                      setMediaSourceType('UPLOAD');
                      setFileError(null);
                    }}
                    style={{
                      padding: '0.3rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      borderColor: mediaSourceType === 'UPLOAD' ? 'var(--forest)' : 'var(--border-light)',
                      backgroundColor: mediaSourceType === 'UPLOAD' ? 'var(--forest)' : 'var(--bg-surface)',
                      color: mediaSourceType === 'UPLOAD' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    📤 Upload de Arquivo
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <Select
                  label="Tipo de Mídia *"
                  data-testid="pack-media-type-select"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'IMAGE' | 'VIDEO' | 'DOCUMENT')}
                  options={mediaTypeOptions}
                  required
                />

                <Input
                  label="Título do Material *"
                  data-testid="pack-media-title-input"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="Ex: Guia de Leitura Complementar em PDF"
                  required
                />
              </div>

              {mediaSourceType === 'EXTERNAL_URL' ? (
                <Input
                  type="url"
                  label="URL do Arquivo / Link (HTTPS) *"
                  data-testid="pack-media-url-input"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://meudrive.com/arquivo.pdf ou https://youtube.com/watch?v=..."
                  required
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Arquivo para Upload (Máx. 25MB) *
                  </label>
                  <input
                    type="file"
                    data-testid="pack-media-file-input"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf"
                    onChange={handleFileChange}
                    style={{
                      fontSize: '0.8125rem',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  />
                  {fileError && (
                    <Alert variant="error">
                      {fileError}
                    </Alert>
                  )}
                  {selectedFile && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--forest)', fontWeight: 600 }}>
                      Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              )}

              <Textarea
                label="Descrição (opcional)"
                data-testid="pack-media-description-input"
                value={mediaDescription}
                onChange={(e) => setMediaDescription(e.target.value)}
                rows={2}
                placeholder="Breve nota sobre o conteúdo deste material..."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="add-pack-media-btn"
                  isLoading={submittingMedia}
                >
                  Anexar Mídia 📎
                </Button>
              </div>
            </form>

            {/* Lista de Mídias Anexadas */}
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)', display: 'block', marginBottom: '0.75rem' }}>
                Mídias Complementares da Família
              </span>

              {loadingMedia ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                  Carregando mídias...
                </div>
              ) : mediaList.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhuma mídia complementar anexada a este pacote ainda.
                </div>
              ) : (
                <div data-testid="pack-media-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {mediaList.map((media) => {
                    const ytId = extractYouTubeVideoId(media.url);

                    return (
                      <div
                        key={media.id}
                        data-testid={`pack-media-item-${media.id}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          padding: '1rem',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        {/* Header: Badge, Title & Delete button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Badge variant="indigo" size="sm">
                              {media.mediaType}
                            </Badge>
                            <Badge variant="slate" size="sm">
                              {media.sourceType === 'UPLOAD' ? 'Arquivo' : 'Link Web'}
                            </Badge>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: 'var(--forest)',
                              }}
                            >
                              {media.title}
                            </span>
                          </div>

                          <Button
                            variant="danger"
                            size="sm"
                            data-testid={`delete-pack-media-btn-${media.id}`}
                            isLoading={deletingMediaId === media.id}
                            onClick={() => handleDeleteMedia(media.id)}
                          >
                            Excluir
                          </Button>
                        </div>

                        {media.description && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {media.description}
                          </div>
                        )}

                        {/* Embedded Media Previews & Players */}
                        {media.mediaType === 'IMAGE' && media.url && (
                          <div style={{ marginTop: '0.25rem', maxHeight: '240px', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                            <img
                              data-testid={`pack-media-image-preview-${media.id}`}
                              src={media.url}
                              alt={media.title}
                              style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                            />
                          </div>
                        )}

                        {media.mediaType === 'VIDEO' && media.url && (
                          <div style={{ marginTop: '0.25rem' }}>
                            {ytId ? (
                              <div style={{ width: '100%', maxWidth: '480px', aspectRatio: '16/9' }}>
                                <iframe
                                  data-testid={`pack-media-youtube-player-${media.id}`}
                                  src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                                  title={media.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius-md)' }}
                                />
                              </div>
                            ) : (
                              <div style={{ maxWidth: '480px' }}>
                                <video
                                  data-testid={`pack-media-video-player-${media.id}`}
                                  src={media.url}
                                  controls
                                  preload="metadata"
                                  style={{ width: '100%', maxHeight: '240px', borderRadius: 'var(--radius-md)', backgroundColor: '#000' }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {media.mediaType === 'DOCUMENT' && media.url && (
                          <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <a
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`pack-media-document-link-${media.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                fontSize: '0.8125rem',
                                color: 'var(--forest)',
                                fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              📄 Abrir Documento em Nova Aba ↗
                            </a>
                            {media.sizeBytes && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({Math.round(media.sizeBytes / 1024)} KB)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Histórico de Revisões */}
        {activeTab === 'revisions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
              Linha do Tempo de Revisões
            </span>

            {loadingRevisions ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                Carregando histórico...
              </div>
            ) : revisionsList.length === 0 ? (
              <div
                data-testid="pack-revisions-list"
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--forest)' }}>
                  Revisão Atual: {installedPack.revision}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Instalado em: {new Date(installedPack.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ) : (
              <div data-testid="pack-revisions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {revisionsList.map((rev) => (
                  <div
                    key={rev.id}
                    data-testid={`pack-revision-item-${rev.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
                        Revisão {rev.revision}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Gravado em: {new Date(rev.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(rev.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant={rev.revision === installedPack.revision ? 'emerald' : 'slate'} size="sm">
                      {rev.revision === installedPack.revision ? 'Atual' : 'Histórico'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Personalizar Conteúdo */}
        {activeTab === 'editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--sage-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--forest)' }}>Adaptação Pedagógica Familiar:</strong> Personalize o título, orientações práticas e notas de estudo desta cópia do pacote. Cada alteração gera uma nova revisão imutável no histórico da sua família.
            </div>

            {editError && (
              <Alert variant="error" data-testid="pack-edit-error-alert">
                {editError}
              </Alert>
            )}

            {editSuccess && (
              <Alert variant="success" data-testid="pack-edit-success-alert">
                {editSuccess}
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Nome do Pacote (Personalizado) *"
                data-testid="pack-edit-name-input"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editError) setEditError(null);
                }}
                required
              />

              <div>
                <label
                  htmlFor="pack-edit-description-input"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--forest)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Descrição / Objetivo Familiar
                </label>
                <Textarea
                  id="pack-edit-description-input"
                  data-testid="pack-edit-description-input"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descreva como este pacote será aplicado no plano da sua família..."
                />
              </div>

              <div>
                <label
                  htmlFor="pack-edit-notes-input"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--forest)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Notas de Orientação Familiar (Pedagógicas & Práticas)
                </label>
                <Textarea
                  id="pack-edit-notes-input"
                  data-testid="pack-edit-notes-input"
                  rows={4}
                  value={editFamilyNotes}
                  onChange={(e) => setEditFamilyNotes(e.target.value)}
                  placeholder="Ex: Focar nas lições práticas às terças-feiras; utilizar tradução ARA nas leituras..."
                />
              </div>

              {/* Items List / Overview if items exist */}
              {editItems.length > 0 && (
                <div>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--forest)', marginBottom: '0.5rem' }}>
                    Itens Curriculares Inclusos ({editItems.length}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {editItems.map((item, idx) => (
                      <div
                        key={item.code || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.content?.title || item.content?.name || item.code}
                        </span>
                        <Badge variant="slate" size="sm">
                          {item.definitionType || 'ITEM'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  variant="primary"
                  data-testid="save-pack-revision-btn"
                  onClick={handleSaveRevision}
                  isLoading={isSavingRevision}
                  disabled={isSavingRevision}
                  style={{ fontWeight: 600 }}
                >
                  Salvar Nova Revisão
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
