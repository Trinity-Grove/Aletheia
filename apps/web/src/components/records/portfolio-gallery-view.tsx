'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  PortfolioItemResponseDto,
  LearnerSummaryDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { EVIDENCE_TYPE_CONFIG } from './portfolio-item-modal';

export interface PortfolioGalleryViewProps {
  items: PortfolioItemResponseDto[];
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  activeLearnerId: string | null;
  onOpenAddItem: () => void;
  onEditItem: (item: PortfolioItemResponseDto) => void;
  onDeleteItem: (itemId: string) => void;
}

export function PortfolioGalleryView({
  items,
  learners,
  subjects,
  activeLearnerId,
  onOpenAddItem,
  onEditItem,
  onDeleteItem,
}: PortfolioGalleryViewProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterOnlyHighlights, setFilterOnlyHighlights] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
            Galeria de Evidências & Portfólio Vivo
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Guarde produções autorais, cadernos, desenhos da natureza, áudios de narração e conquistas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div data-testid="portfolio-count-stats" style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {filteredItems.length} obra(s)
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-amber-700)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <AletheiaIcon name="sparkles" size={12} style={{ color: 'var(--color-amber-600)' }} />
              <span>{items.filter((i) => i.isHighlight).length} destaque(s)</span>
            </div>
          </div>

          <Can action="upload_portfolio_items">
            <button
              type="button"
              data-testid="open-add-portfolio-btn"
              onClick={onOpenAddItem}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              + Adicionar Evidência
            </button>
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            data-testid="search-portfolio-input"
            placeholder="Buscar no portfólio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              minWidth: '180px',
            }}
          />

          {/* Type Filter */}
          <select
            data-testid="filter-portfolio-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todos os tipos de evidência</option>
            {Object.entries(EVIDENCE_TYPE_CONFIG).map(([k, item]) => (
              <option key={k} value={k}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            data-testid="filter-portfolio-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Highlights toggle button */}
          <button
            type="button"
            data-testid="toggle-highlights-filter"
            onClick={() => setFilterOnlyHighlights((prev) => !prev)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: filterOnlyHighlights ? '1px solid var(--color-amber-600)' : '1px solid var(--border-medium)',
              backgroundColor: filterOnlyHighlights ? 'var(--color-amber-50)' : 'var(--bg-surface)',
              color: filterOnlyHighlights ? 'var(--color-amber-700)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <AletheiaIcon name="sparkles" size={14} style={{ color: filterOnlyHighlights ? 'var(--color-amber-600)' : 'currentColor' }} />
            <span>Apenas Destaques</span>
          </button>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div data-testid="portfolio-tag-cloud" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tags:</span>
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
              Todas
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
        <div
          data-testid="portfolio-empty-state"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div style={{ color: 'var(--color-amber-600)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="palette" size={40} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Nenhuma evidência no portfólio
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Fotografe cadernos, desenhos da natureza, adicione áudios de narração e celebre a jornada educativa!
          </p>
          <Can action="upload_portfolio_items">
            <button
              type="button"
              data-testid="empty-add-portfolio-btn"
              onClick={onOpenAddItem}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Adicionar Primeira Obra
            </button>
          </Can>
        </div>
      ) : (
        <div
          data-testid="portfolio-gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
                <div
                  data-testid={`portfolio-media-preview-${item.id}`}
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
                  {item.type === 'IMAGE' && item.fileUrl ? (
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
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
                        {typeConfig.label}
                      </div>
                    </div>
                  )}

                  {/* Highlight Star Badge */}
                  {item.isHighlight && (
                    <span
                      data-testid={`portfolio-highlight-badge-${item.id}`}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'var(--color-amber-50)',
                        color: 'var(--color-amber-700)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-amber-100)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <AletheiaIcon name="sparkles" size={11} style={{ color: 'var(--color-amber-600)' }} />
                      <span>Destaque</span>
                    </span>
                  )}
                </div>

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
                      <span
                        style={{
                          backgroundColor: 'var(--color-indigo-50)',
                          color: 'var(--color-indigo-700)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <AletheiaIcon name="graduation-cap" size={10} />
                        <span>{learner.preferredName || learner.firstName}</span>
                      </span>
                    )}
                    {item.subjectName && (
                      <span
                        style={{
                          backgroundColor: 'var(--sage-soft)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <AletheiaIcon name="book-open" size={10} />
                        <span>{item.subjectName}</span>
                      </span>
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
                      <span>{item.capturedAt}</span>
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
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--sage-soft)',
                    }}
                  >
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`view-file-link-${item.id}`}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--forest)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Abrir Mídia ↗
                      </a>
                    ) : (
                      <div />
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Can action="upload_portfolio_items">
                        <button
                          type="button"
                          data-testid={`edit-portfolio-btn-${item.id}`}
                          onClick={() => onEditItem(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--forest)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0.25rem',
                          }}
                        >
                          Editar
                        </button>
                      </Can>
                      <Can action="delete_learners">
                        <button
                          type="button"
                          data-testid={`delete-portfolio-btn-${item.id}`}
                          onClick={() => onDeleteItem(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-rose-600)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0.25rem',
                          }}
                        >
                          Excluir
                        </button>
                      </Can>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
