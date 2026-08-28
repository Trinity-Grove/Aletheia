'use client';

import React, { useMemo, useState } from 'react';
import { Palette, GraduationCap, BookOpen, Calendar, Paperclip, Star } from 'lucide-react';
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
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px solid #E5E7EB',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem 0' }}>
            Galeria de Evidências & Portfólio Vivo
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
            Guarde produções autorais, cadernos, desenhos da natureza, áudios de narração e conquistas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div data-testid="portfolio-count-stats" style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
              {filteredItems.length} obra(s)
            </span>
            <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={12} fill="#F59E0B" stroke="#D97706" />
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
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
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
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
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
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
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
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
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
              borderRadius: '0.375rem',
              border: filterOnlyHighlights ? '1px solid #F59E0B' : '1px solid #D1D5DB',
              backgroundColor: filterOnlyHighlights ? '#FEF3C7' : '#FFFFFF',
              color: filterOnlyHighlights ? '#92400E' : '#4B5563',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Star size={14} fill={filterOnlyHighlights ? '#F59E0B' : 'none'} stroke={filterOnlyHighlights ? '#D97706' : 'currentColor'} />
            <span>Apenas Destaques</span>
          </button>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div data-testid="portfolio-tag-cloud" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Tags:</span>
            <button
              type="button"
              data-testid="tag-filter-all"
              onClick={() => setSelectedTag('')}
              style={{
                background: selectedTag === '' ? '#3B82F6' : '#F3F4F6',
                color: selectedTag === '' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                borderRadius: '9999px',
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
                  background: selectedTag === tag ? '#3B82F6' : '#F3F4F6',
                  color: selectedTag === tag ? '#FFFFFF' : '#4B5563',
                  border: 'none',
                  borderRadius: '9999px',
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
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px dashed #D1D5DB',
          }}
        >
          <div style={{ color: '#F59E0B', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <Palette size={40} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
            Nenhuma evidência no portfólio
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Fotografe cadernos, desenhos da natureza, adicione áudios de narração e celebre a jornada educativa!
          </p>
          <Can action="upload_portfolio_items">
            <button
              type="button"
              data-testid="empty-add-portfolio-btn"
              onClick={onOpenAddItem}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: '0.375rem',
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
              icon: <Paperclip size={16} />,
            };
            const learner = learners.find((l) => l.id === item.learnerId);

            return (
              <article
                key={item.id}
                data-testid={`portfolio-card-${item.id}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  border: item.isHighlight ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                  boxShadow: item.isHighlight
                    ? '0 4px 6px -1px rgba(245, 158, 11, 0.15)'
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
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
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
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
                        color: '#334155',
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
                    <div style={{ textAlign: 'center', color: '#64748B' }}>
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
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #FCD34D',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Star size={11} fill="#F59E0B" stroke="#D97706" />
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
                          backgroundColor: '#EFF6FF',
                          color: '#1E40AF',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <GraduationCap size={10} />
                        <span>{learner.preferredName || learner.firstName}</span>
                      </span>
                    )}
                    {item.subjectName && (
                      <span
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <BookOpen size={10} />
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
                      color: '#111827',
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
                        color: '#4B5563',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Date */}
                  {item.capturedAt && (
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={10} />
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
                            color: '#4F46E5',
                            backgroundColor: '#EEF2FF',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
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
                      borderTop: '1px solid #F3F4F6',
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
                          color: '#2563EB',
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
                            color: '#2563EB',
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
                            color: '#DC2626',
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

