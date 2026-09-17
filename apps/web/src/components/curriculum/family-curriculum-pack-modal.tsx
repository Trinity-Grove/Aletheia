'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type {
  CurriculumPackResponseDto,
  FamilyCurriculumPackMediaResponseDto,
  FamilyCurriculumPackResponseDto,
  FamilyCurriculumPackRevisionResponseDto,
} from '@aletheia/contracts';

export interface FamilyCurriculumPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  installedPack: FamilyCurriculumPackResponseDto | null;
  catalogPack?: CurriculumPackResponseDto | null | undefined;
}

export function FamilyCurriculumPackModal({
  isOpen,
  onClose,
  familyId,
  installedPack,
  catalogPack,
}: FamilyCurriculumPackModalProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'revisions'>('media');

  // Media state
  const [mediaList, setMediaList] = useState<FamilyCurriculumPackMediaResponseDto[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaSuccess, setMediaSuccess] = useState<string | null>(null);

  // New media form state
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('DOCUMENT');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
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

  useEffect(() => {
    if (isOpen && installedPack) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, installedPack?.id]);

  if (!installedPack) return null;

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) {
      setMediaError('O título da mídia é obrigatório.');
      return;
    }

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
            Histórico de Revisões ({revisionsList.length || installedPack.revision})
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
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
                Anexar Novo Material ou Link Complementar
              </span>

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

              <Input
                type="url"
                label="URL do Arquivo / Link (HTTPS) *"
                data-testid="pack-media-url-input"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://meudrive.com/arquivo.pdf"
                required
              />

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
                <div data-testid="pack-media-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {mediaList.map((media) => (
                    <div
                      key={media.id}
                      data-testid={`pack-media-item-${media.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <Badge variant="indigo" size="sm">
                            {media.mediaType}
                          </Badge>
                          <a
                            href={media.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--forest)',
                              textDecoration: 'underline',
                              wordBreak: 'break-all',
                            }}
                          >
                            {media.title}
                          </a>
                        </div>
                        {media.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {media.description}
                          </div>
                        )}
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
                  ))}
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
      </div>
    </Modal>
  );
}
