'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type {
  AuthorTrustTier,
  CurriculumPackResponseDto,
  FamilyCurriculumPackResponseDto,
} from '@aletheia/contracts';
import { FamilyCurriculumPackModal } from './family-curriculum-pack-modal';
import { CurriculumPackImportModal } from './curriculum-pack-import-modal';
import { CurriculumPackDetailModal } from './curriculum-pack-detail-modal';
import { AuthorTrustBadge } from './author-trust-badge';
import { PackReportModal } from './pack-report-modal';
import { PublishToCommunityModal } from './publish-to-community-modal';
import { MyAuthoredPacksPanel } from './my-authored-packs-panel';
import { useLocale } from '../../lib/i18n/locale-context';

interface CurriculumPacksGalleryProps {
  familyId: string;
}

export function CurriculumPacksGallery({ familyId }: CurriculumPacksGalleryProps) {
  const { t } = useLocale();
  const [catalogPacks, setCatalogPacks] = useState<CurriculumPackResponseDto[]>([]);
  const [installedPacks, setInstalledPacks] = useState<FamilyCurriculumPackResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [managingPack, setManagingPack] = useState<{
    installed: FamilyCurriculumPackResponseDto;
    catalog: CurriculumPackResponseDto | null;
  } | null>(null);
  const [selectedDetailPack, setSelectedDetailPack] = useState<CurriculumPackResponseDto | null>(null);
  const [reportingPack, setReportingPack] = useState<CurriculumPackResponseDto | null>(null);
  const [publishingPack, setPublishingPack] = useState<FamilyCurriculumPackResponseDto | null>(null);
  const [activeView, setActiveView] = useState<'catalog' | 'my-packs'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportingPackId, setExportingPackId] = useState<string | null>(null);

  const handleExportPack = async (pack: CurriculumPackResponseDto) => {
    try {
      setExportingPackId(pack.id);
      setError(null);
      const res = await fetch(`/api/v1/admin/curriculum-packs/${pack.id}/export`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Falha ao exportar pacote "${pack.name}".`);
      }

      const doc = await res.json();
      const jsonContent = JSON.stringify(doc, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `curriculum-pack-${pack.code}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg(`Pacote "${pack.name}" exportado com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar pacote.');
    } finally {
      setExportingPackId(null);
    }
  };

  const loadData = async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      setError(null);

      // Load catalog packs and family installed packs in parallel
      const [catRes, instRes] = await Promise.all([
        fetch(`/api/v1/families/${familyId}/curriculum-packs/available`, { credentials: 'include' }),
        fetch(`/api/v1/families/${familyId}/curriculum-packs`, { credentials: 'include' }),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalogPacks(Array.isArray(catData) ? catData : []);
      }

      if (instRes.ok) {
        const instData = await instRes.json();
        setInstalledPacks(Array.isArray(instData) ? instData : []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar catálogo de pacotes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [familyId]);

  const handleInstall = async (pack: CurriculumPackResponseDto) => {
    try {
      setInstallingId(pack.id);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/curriculum-packs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourcePackId: pack.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao instalar o pacote curricular.');
      }

      const installed: FamilyCurriculumPackResponseDto = await res.json();
      setInstalledPacks((prev) => [...prev, installed]);
      setSuccessMsg(`Pacote "${pack.name}" instalado com sucesso no currículo da sua família!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao instalar pacote.');
    } finally {
      setInstallingId(null);
    }
  };

  const installedPackMap = new Map<string, FamilyCurriculumPackResponseDto>(
    installedPacks.map((p) => [p.sourcePackId, p])
  );

  // Extract categories for filter tabs
  const categories = Array.from(
    new Set(
      catalogPacks
        .map((p) => (p.metadata as Record<string, any>)?.category as string)
        .filter(Boolean)
    )
  );

  const filteredPacks = catalogPacks.filter((pack) => {
    const meta = (pack.metadata as Record<string, any>) || {};
    const matchesSearch =
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pack.description && pack.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || meta.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div data-testid="curriculum-packs-gallery" style={{ display: 'grid', gap: '2rem' }}>
      {/* Header card */}
      <Card style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--sage-soft)',
                  color: 'var(--forest)',
                }}
              >
                Plugins & Extensões Curriculares
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--forest)', margin: '0.25rem 0 0 0' }}>
              Galeria de Pacotes Curriculares
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '44rem' }}>
              Enriqueça a jornada dos seus educandos com pacotes estruturados de conteúdo, objetivos de aprendizagem, competências e ofícios práticos com cosmovisão bíblica.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              data-testid="open-import-pack-modal-btn"
              onClick={() => setIsImportModalOpen(true)}
              style={{ fontWeight: 600 }}
            >
              📥 Importar Pacote Curricular
            </Button>
            <a
              href="/curriculum"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--forest)',
                textDecoration: 'underline',
              }}
            >
              ← Voltar ao Currículo
            </a>
          </div>
        </div>
      </Card>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Catalog vs. My Community Packs toggle */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          data-testid="curriculum-view-tab-catalog"
          onClick={() => setActiveView('catalog')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid',
            borderColor: activeView === 'catalog' ? 'var(--forest)' : 'var(--border-light)',
            backgroundColor: activeView === 'catalog' ? 'var(--forest)' : 'var(--bg-surface)',
            color: activeView === 'catalog' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          {t('curriculum.community.tabCatalog')}
        </button>
        <button
          type="button"
          data-testid="curriculum-view-tab-my-packs"
          onClick={() => setActiveView('my-packs')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid',
            borderColor: activeView === 'my-packs' ? 'var(--forest)' : 'var(--border-light)',
            backgroundColor: activeView === 'my-packs' ? 'var(--forest)' : 'var(--bg-surface)',
            color: activeView === 'my-packs' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          {t('curriculum.community.tabMyPacks')}
        </button>
      </div>

      {activeView === 'my-packs' ? (
        <MyAuthoredPacksPanel />
      ) : (
        <>
      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: selectedCategory === 'ALL' ? 'var(--forest)' : 'var(--border-light)',
              backgroundColor: selectedCategory === 'ALL' ? 'var(--forest)' : 'var(--bg-surface)',
              color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Todos ({catalogPacks.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--forest)' : 'var(--border-light)',
                backgroundColor: selectedCategory === cat ? 'var(--forest)' : 'var(--bg-surface)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '16rem' }}>
          <input
            type="search"
            placeholder="Buscar pacotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Grid of Packs */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Carregando pacotes curriculares...
        </div>
      ) : filteredPacks.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.125rem' }}>
            Nenhum pacote curricular encontrado
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Tente buscar com outros termos ou selecione outra categoria.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredPacks.map((pack) => {
            const isInstalled = installedPackMap.has(pack.id);
            const installedInstance = installedPackMap.get(pack.id);
            const meta = (pack.metadata as Record<string, any>) || {};
            const isWorking = installingId === pack.id;
            const authorTier = ((meta.authorTrustTier || meta.authorTier || meta.tier) as AuthorTrustTier) || 'NOVICE';
            const authorTrustScore = (meta.authorTrustScore ?? meta.trustScore) as number | null | undefined;

            return (
              <Card
                key={pack.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: isInstalled ? '1.5px solid var(--sage)' : '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {meta.category ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--gold-dark)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {meta.category}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Currículo Geral</span>
                      )}
                      <AuthorTrustBadge tier={authorTier} trustScore={authorTrustScore} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.375rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-canvas)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      v{pack.version}.0
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--forest)',
                      lineHeight: '1.3',
                    }}
                  >
                    {pack.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {pack.description || 'Pacote com objetivos e competências estruturados.'}
                  </p>

                  {/* Pills */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {meta.estimatedLessons && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-canvas)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        {meta.estimatedLessons} lições estimadas
                      </span>
                    )}
                    {Array.isArray(meta.targetStages) &&
                      meta.targetStages.map((st: string) => (
                        <span
                          key={st}
                          style={{
                            fontSize: '0.6875rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--forest)',
                            fontWeight: 600,
                          }}
                        >
                          {st}
                        </span>
                      ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {isInstalled ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <div
                        data-testid={`installed-badge-${pack.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--sage-soft)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--forest)',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>✓ Instalado no Currículo</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
                          Rev. {installedInstance?.revision ?? 1}
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        data-testid={`publish-to-community-btn-${pack.id}`}
                        onClick={() => setPublishingPack(installedInstance!)}
                        style={{ width: '100%', fontSize: '0.8125rem', fontWeight: 600 }}
                      >
                        {t('curriculum.community.publishBtn')}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        data-testid={`manage-pack-btn-${pack.id}`}
                        onClick={() => setManagingPack({ installed: installedInstance!, catalog: pack })}
                        style={{ width: '100%', fontSize: '0.8125rem', fontWeight: 600 }}
                      >
                        Gerenciar Pacote & Mídias ⚙️
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      data-testid={`install-pack-btn-${pack.id}`}
                      isLoading={isWorking}
                      onClick={() => handleInstall(pack)}
                      style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                      Instalar no Currículo
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid={`view-pack-detail-btn-${pack.id}`}
                    onClick={() => setSelectedDetailPack(pack)}
                    style={{ width: '100%', fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    Conhecer Pacote 🔍
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid={`export-pack-btn-${pack.id}`}
                    onClick={() => handleExportPack(pack)}
                    disabled={exportingPackId === pack.id}
                    isLoading={exportingPackId === pack.id}
                    style={{ width: '100%', fontSize: '0.8125rem', fontWeight: 500 }}
                  >
                    Exportar JSON 📤
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid={`report-pack-btn-${pack.id}`}
                    onClick={() => setReportingPack(pack)}
                    style={{ width: '100%', fontSize: '0.8125rem', fontWeight: 500 }}
                  >
                    🚩 {t('curriculum.moderation.reportBtnShort')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Modal de Detalhamento e Conhecimento do Pacote Curricular */}
      <CurriculumPackDetailModal
        isOpen={Boolean(selectedDetailPack)}
        pack={selectedDetailPack}
        isInstalled={selectedDetailPack ? installedPackMap.has(selectedDetailPack.id) : false}
        onClose={() => setSelectedDetailPack(null)}
        onInstall={(pack) => {
          setSelectedDetailPack(null);
          void handleInstall(pack);
        }}
      />

      {/* Modal de Gestão de Mídias e Detalhes do Pacote */}
      <FamilyCurriculumPackModal
        isOpen={Boolean(managingPack)}
        onClose={() => setManagingPack(null)}
        familyId={familyId}
        installedPack={managingPack?.installed ?? null}
        catalogPack={managingPack?.catalog ?? null}
        onPackUpdated={(updated) => {
          setInstalledPacks((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setManagingPack((prev) => (prev ? { ...prev, installed: updated } : null));
        }}
      />

      {/* Modal de Importação de Pacote Curricular */}
      <CurriculumPackImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={loadData}
      />

      {/* Modal de Denúncia do Pacote Curricular */}
      {reportingPack && (
        <PackReportModal
          isOpen={Boolean(reportingPack)}
          packId={reportingPack.id}
          packTitle={reportingPack.name}
          familyId={familyId}
          onClose={() => setReportingPack(null)}
        />
      )}

      {/* Modal de Publicação do Pacote na Comunidade */}
      {publishingPack && (
        <PublishToCommunityModal
          isOpen={Boolean(publishingPack)}
          familyId={familyId}
          familyCurriculumPackId={publishingPack.id}
          sourceName={publishingPack.document.pack.name}
          onClose={() => setPublishingPack(null)}
          onSuccess={() => {
            setSuccessMsg(t('curriculum.community.publishSuccessMsg'));
            setTimeout(() => setSuccessMsg(null), 5000);
          }}
        />
      )}
    </div>
  );
}
