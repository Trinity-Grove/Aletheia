'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, EmptyState, Input, Modal, Select } from '@aletheia/ui';
import type {
  PortfolioItemResponseDto,
  LearnerSummaryDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { EVIDENCE_TYPE_CONFIG } from './portfolio-item-modal';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PortfolioGalleryViewProps {
  items: PortfolioItemResponseDto[];
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  activeLearnerId: string | null;
  onOpenAddItem(): void;
  onEditItem(item: PortfolioItemResponseDto): void;
  onDeleteItem(itemId: string): void;
  onResolveMediaUrl?(itemId: string): Promise<string | null>;
}

interface PortfolioMediaPreviewProps {
  item: PortfolioItemResponseDto;
  resolvedUrl: string | undefined;
  isLoading: boolean;
  hasError: boolean;
  onRequestMedia: (() => void) | undefined;
  typeConfig: { label: string; icon: React.ReactNode };
  translate: (key: string) => string;
  children?: React.ReactNode;
}

interface PortfolioMediaDialogProps {
  item: PortfolioItemResponseDto;
  mediaUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry(): void;
  onClose(): void;
  translate: (key: string) => string;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PortfolioMediaDialog({
  item,
  mediaUrl,
  isLoading,
  hasError,
  onRetry,
  onClose,
  translate,
}: PortfolioMediaDialogProps) {
  const fileSize = formatFileSize(item.fileSizeBytes);
  const fileDetails = [item.mimeType, fileSize].filter(Boolean).join(' · ');

  return (
    <Modal isOpen onClose={onClose} title={item.title} maxWidth="xl">
      <div data-testid={`portfolio-media-dialog-content-${item.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div role="status" data-testid={`portfolio-media-modal-loading-${item.id}`} aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {translate('records.portfolio.states.mediaLoading')}
          </div>
        ) : hasError || !mediaUrl ? (
          <Alert variant="error" data-testid={`portfolio-media-modal-error-${item.id}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span>{translate('records.portfolio.states.mediaUnavailable')}</span>
              <Button size="sm" variant="outline" data-testid={`retry-media-preview-${item.id}`} onClick={onRetry}>
                {translate('records.portfolio.retryMedia')}
              </Button>
            </div>
          </Alert>
        ) : item.type === 'IMAGE' ? (
          <img
            src={mediaUrl}
            alt={item.title}
            data-testid={`portfolio-image-preview-${item.id}`}
            style={{ display: 'block', width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
        ) : item.type === 'AUDIO' ? (
          <audio
            controls
            preload="metadata"
            src={mediaUrl}
            aria-label={item.title}
            data-testid={`portfolio-audio-player-${item.id}`}
            style={{ width: '100%' }}
          />
        ) : item.type === 'VIDEO' ? (
          <video
            controls
            playsInline
            preload="metadata"
            src={mediaUrl}
            aria-label={item.title}
            data-testid={`portfolio-video-player-${item.id}`}
            style={{ display: 'block', width: '100%', maxHeight: '70vh', backgroundColor: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
          />
        ) : item.type === 'DOCUMENT' || item.type === 'CERTIFICATE' ? (
          <div
            data-testid={`portfolio-document-preview-${item.id}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}
          >
            <AletheiaIcon name="file-text" size={32} style={{ color: 'var(--forest)' }} />
            <strong>{item.title}</strong>
            {fileDetails && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{fileDetails}</span>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="ui-button ui-button--outline ui-button--sm">
                {translate('records.portfolio.openMedia')}
              </a>
              <a href={mediaUrl} download={item.title} className="ui-button ui-button--primary ui-button--sm">
                {translate('records.portfolio.downloadMedia')}
              </a>
            </div>
          </div>
        ) : (
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="ui-button ui-button--primary ui-button--sm">
            {translate('records.portfolio.openMedia')}
          </a>
        )}
      </div>
    </Modal>
  );
}

function PortfolioMediaPreview({
  item,
  resolvedUrl,
  isLoading,
  hasError,
  onRequestMedia,
  typeConfig,
  translate,
  children,
}: PortfolioMediaPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(item.fileUrl || resolvedUrl));
  const [imageLoadError, setImageLoadError] = useState(false);
  const mediaUrl = item.fileUrl ?? resolvedUrl;

  useEffect(() => {
    setImageLoadError(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (item.type !== 'IMAGE' || mediaUrl || !onRequestMedia) return;
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [item.type, mediaUrl, onRequestMedia]);

  useEffect(() => {
    if (shouldLoad && !mediaUrl && !isLoading && !hasError) {
      onRequestMedia?.();
    }
  }, [hasError, isLoading, mediaUrl, onRequestMedia, shouldLoad]);

  return (
    <div
      ref={containerRef}
      data-testid={`portfolio-media-preview-${item.id}`}
      onMouseEnter={() => setShouldLoad(true)}
      onFocus={() => setShouldLoad(true)}
      style={{
        height: '160px',
        backgroundColor: 'var(--sage-soft)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {item.type === 'IMAGE' && mediaUrl && !imageLoadError ? (
        <img
          src={mediaUrl}
          alt={item.title}
          loading="lazy"
          onError={() => setImageLoadError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : isLoading ? (
        <div role="status" data-testid={`portfolio-media-loading-${item.id}`} style={{ color: 'var(--text-secondary)' }}>
          {translate('records.portfolio.states.mediaLoading')}
        </div>
      ) : hasError || imageLoadError ? (
        <div role="status" data-testid={`portfolio-media-error-${item.id}`} style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          <AletheiaIcon name="image-off" size={28} />
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {translate('records.portfolio.states.mediaUnavailable')}
          </div>
        </div>
      ) : item.type === 'TEXT' && item.textContent ? (
        <div
          style={{
            padding: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}
        >
          “{item.textContent}”
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '2.5rem' }}>{typeConfig.icon}</span>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 600 }}>
            {translate(`records.evidenceTypes.${item.type.toLowerCase()}`) || typeConfig.label}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function PortfolioGalleryView({
  items,
  learners,
  subjects,
  activeLearnerId,
  onOpenAddItem,
  onEditItem,
  onDeleteItem,
  onResolveMediaUrl,
}: PortfolioGalleryViewProps) {
  const { t, formatDate } = useLocale();
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterOnlyHighlights, setFilterOnlyHighlights] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState<Record<string, string>>({});
  const [mediaLoadingIds, setMediaLoadingIds] = useState<Set<string>>(new Set());
  const [mediaErrorIds, setMediaErrorIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<PortfolioItemResponseDto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const resolveMediaUrl = useCallback(async (item: PortfolioItemResponseDto): Promise<string | null> => {
    if (item.fileUrl) return item.fileUrl;
    if (!onResolveMediaUrl) return null;

    setMediaLoadingIds((current) => new Set(current).add(item.id));
    setMediaErrorIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });

    const resolvedUrl = await onResolveMediaUrl(item.id);
    setMediaLoadingIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });

    if (resolvedUrl) {
      setResolvedMediaUrls((current) => ({ ...current, [item.id]: resolvedUrl }));
      return resolvedUrl;
    }

    setMediaErrorIds((current) => new Set(current).add(item.id));
    return null;
  }, [onResolveMediaUrl]);

  const handleOpenMedia = useCallback(async (item: PortfolioItemResponseDto) => {
    const mediaUrl = await resolveMediaUrl(item);
    if (mediaUrl) {
      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
    }
  }, [resolveMediaUrl]);

  const handlePreviewMedia = useCallback(async (item: PortfolioItemResponseDto) => {
    setPreviewItem(item);
    setPreviewUrl(item.fileUrl ?? resolvedMediaUrls[item.id] ?? null);
    if (item.fileUrl || resolvedMediaUrls[item.id]) {
      setPreviewState('ready');
      return;
    }

    setPreviewState('loading');
    const mediaUrl = await resolveMediaUrl(item);
    setPreviewUrl(mediaUrl);
    setPreviewState(mediaUrl ? 'ready' : 'error');
  }, [resolveMediaUrl, resolvedMediaUrls]);

  const handleRetryPreview = useCallback(() => {
    if (previewItem) void handlePreviewMedia(previewItem);
  }, [handlePreviewMedia, previewItem]);

  // Collect all distinct tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeLearnerId && item.learnerId !== activeLearnerId) return false;
      if (filterType && item.type !== filterType) return false;
      if (filterSubject && item.subjectId !== filterSubject) return false;
      if (filterOnlyHighlights && !item.isHighlight) return false;
      if (selectedTag && !item.tags?.includes(selectedTag)) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const textMatch = item.textContent?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !textMatch) return false;
      }
      return true;
    });
  }, [items, activeLearnerId, filterType, filterSubject, filterOnlyHighlights, selectedTag, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Can
        action="view_portfolio"
        fallback={
          <div
            data-testid="portfolio-read-only-state"
            role="status"
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>{t('records.portfolio.states.readOnlyTitle')}</strong>
            <span> {t('records.portfolio.states.readOnlyDescription')}</span>
          </div>
        }
      >
        {null}
      </Can>

      {/* Portfolio Banner & Highlights count */}
      <div
        data-testid="portfolio-header-banner"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
            {t('records.portfolio.title')}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            {t('records.portfolio.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div data-testid="portfolio-count-stats" style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('records.portfolio.worksCount', { count: filteredItems.length })}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-amber-700)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <AletheiaIcon name="sparkles" size={12} style={{ color: 'var(--color-amber-600)' }} />
              <span>{t('records.portfolio.highlightsCount', { count: items.filter((i) => i.isHighlight).length })}</span>
            </div>
          </div>

          <Can action="create_portfolio_items">
            <Button data-testid="open-add-portfolio-btn" onClick={onOpenAddItem}>
              {t('records.portfolio.addEvidenceBtn')}
            </Button>
          </Can>
        </div>
      </div>

      {/* Control Bar: Filters, Tags, and Search */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div className="portfolio-filter-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            type="text"
            data-testid="search-portfolio-input"
            placeholder={t('records.portfolio.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 'min(180px, 100%)', width: '100%' }}
          />

          <Select
            data-testid="filter-portfolio-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: t('records.portfolio.allTypes') },
              ...Object.entries(EVIDENCE_TYPE_CONFIG).map(([k, item]) => ({
                value: k,
                label: t(`records.evidenceTypes.${k.toLowerCase()}` as any) || item.label,
              })),
            ]}
          />

          <Select
            data-testid="filter-portfolio-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            options={[
              { value: '', label: t('records.portfolio.allSubjects') },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          {/* Highlights toggle button */}
          <Button
            variant={filterOnlyHighlights ? 'secondary' : 'outline'}
            data-testid="toggle-highlights-filter"
            onClick={() => setFilterOnlyHighlights((prev) => !prev)}
            leftIcon={<AletheiaIcon name="sparkles" size={14} />}
          >
            {t('records.portfolio.onlyHighlights')}
          </Button>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div data-testid="portfolio-tag-cloud" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('records.portfolio.tagsLabel')}</span>
            <button
              type="button"
              data-testid="tag-filter-all"
              onClick={() => setSelectedTag('')}
              style={{
                background: selectedTag === '' ? 'var(--color-indigo-600)' : 'var(--sage-soft)',
                color: selectedTag === '' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('records.portfolio.allTags')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                data-testid={`tag-filter-btn-${tag}`}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                style={{
                  background: selectedTag === tag ? 'var(--color-indigo-600)' : 'var(--sage-soft)',
                  color: selectedTag === tag ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Portfolio items */}
      {filteredItems.length === 0 ? (
        filterType || filterSubject || filterOnlyHighlights || selectedTag || searchTerm ? (
          <EmptyState
            data-testid="portfolio-no-results-state"
            icon={<AletheiaIcon name="search-x" size={40} style={{ color: 'var(--color-amber-600)' }} />}
            title={t('records.portfolio.states.noResultsTitle')}
            description={t('records.portfolio.states.noResultsDescription')}
            action={
              <Button
                data-testid="clear-portfolio-filters-btn"
                variant="outline"
                onClick={() => {
                  setFilterType('');
                  setFilterSubject('');
                  setFilterOnlyHighlights(false);
                  setSelectedTag('');
                  setSearchTerm('');
                }}
              >
                {t('records.portfolio.states.clearFilters')}
              </Button>
            }
          />
        ) : (
        <EmptyState
          data-testid="portfolio-empty-state"
          icon={<AletheiaIcon name="palette" size={40} style={{ color: 'var(--color-amber-600)' }} />}
          title={t('records.portfolio.emptyTitle')}
          description={t('records.portfolio.emptyDesc')}
          action={
            <Can action="create_portfolio_items">
              <Button data-testid="empty-add-portfolio-btn" onClick={onOpenAddItem}>
                {t('records.portfolio.addFirstWork')}
              </Button>
            </Can>
          }
        />
        )
      ) : (
        <div
          data-testid="portfolio-gallery-grid"
          className="portfolio-gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredItems.map((item) => {
            const typeConfig = EVIDENCE_TYPE_CONFIG[item.type] || {
              label: item.type,
              icon: <AletheiaIcon name="paperclip" size={16} />,
            };
            const learner = learners.find((l) => l.id === item.learnerId);

            return (
              <article
                key={item.id}
                data-testid={`portfolio-card-${item.id}`}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: item.isHighlight ? '2px solid var(--color-amber-600)' : '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Media Preview Box */}
                <PortfolioMediaPreview
                  item={item}
                  resolvedUrl={resolvedMediaUrls[item.id]}
                  isLoading={mediaLoadingIds.has(item.id)}
                  hasError={mediaErrorIds.has(item.id)}
                  onRequestMedia={item.type === 'IMAGE' && onResolveMediaUrl ? () => void resolveMediaUrl(item) : undefined}
                  typeConfig={typeConfig}
                  translate={(key) => t(key as any)}
                >

                  {/* Highlight Star Badge */}
                  {item.isHighlight && (
                    <Badge
                      data-testid={`portfolio-highlight-badge-${item.id}`}
                      variant="amber"
                      size="sm"
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                    >
                      <AletheiaIcon name="sparkles" size={11} style={{ color: 'var(--color-amber-600)' }} />
                      <span>{t('records.portfolio.highlightBadge')}</span>
                    </Badge>
                  )}
                </PortfolioMediaPreview>

                {/* Card Details */}
                <div
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flexGrow: 1,
                  }}
                >
                  {/* Learner & Subject */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {learner && (
                      <Badge variant="indigo" size="sm">
                        <AletheiaIcon name="graduation-cap" size={10} />
                        <span>{learner.preferredName || learner.firstName}</span>
                      </Badge>
                    )}
                    {item.subjectName && (
                      <Badge variant="slate" size="sm">
                        <AletheiaIcon name="book-open" size={10} />
                        <span>{item.subjectName}</span>
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    data-testid={`portfolio-title-${item.id}`}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p
                      data-testid={`portfolio-description-${item.id}`}
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Date */}
                  {item.capturedAt && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AletheiaIcon name="calendar" size={10} />
                      <span>{formatDate(new Date(item.capturedAt))}</span>
                    </span>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          data-testid={`portfolio-tag-${item.id}-${tag}`}
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--color-indigo-600)',
                            backgroundColor: 'var(--color-indigo-50)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="portfolio-card-action-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--sage-soft)',
                    }}
                  >
                    <div className="portfolio-card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      {(item.fileUrl || item.mimeType) && (
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`preview-media-btn-${item.id}`}
                          onClick={() => void handlePreviewMedia(item)}
                        >
                          {t('records.portfolio.previewMedia')}
                        </Button>
                      )}
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`view-file-link-${item.id}`}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--forest)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {t('records.portfolio.openMedia')}
                      </a>
                    ) : item.mimeType && onResolveMediaUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`view-file-link-${item.id}`}
                        onClick={() => void handleOpenMedia(item)}
                      >
                        {t('records.portfolio.openMedia')}
                      </Button>
                    ) : (
                      <div />
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Can action="edit_portfolio_items">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`edit-portfolio-btn-${item.id}`}
                          onClick={() => onEditItem(item)}
                        >
                          {t('records.portfolio.editBtn')}
                        </Button>
                      </Can>
                      <Can action="delete_portfolio_items">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`delete-portfolio-btn-${item.id}`}
                          onClick={() => {
                            if (window.confirm(t('records.portfolio.confirmDelete'))) {
                              onDeleteItem(item.id);
                            }
                          }}
                          style={{ color: 'var(--color-rose-600)' }}
                        >
                          {t('records.portfolio.deleteBtn')}
                        </Button>
                      </Can>
                    </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {previewItem && (
        <PortfolioMediaDialog
          item={previewItem}
          mediaUrl={previewUrl}
          isLoading={previewState === 'loading'}
          hasError={previewState === 'error'}
          onRetry={handleRetryPreview}
          onClose={() => {
            setPreviewItem(null);
            setPreviewUrl(null);
            setPreviewState('idle');
          }}
          translate={(key) => t(key as any)}
        />
      )}
    </div>
  );
}
