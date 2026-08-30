'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { DailyDevotionalResponseDto } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface DevotionalViewProps {
  currentDate: string; // YYYY-MM-DD
  devotional?: DailyDevotionalResponseDto | null;
  onEdit: () => void;
  onDateChange: (_date: string) => void;
}

export function DevotionalView({
  currentDate,
  devotional,
  onEdit,
  onDateChange,
}: DevotionalViewProps) {
  const handleShiftDate = (days: number) => {
    const parts = currentDate.split('-');
    const year = Number(parts[0]) || 2026;
    const month = Number(parts[1]) || 1;
    const day = Number(parts[2]) || 1;
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  return (
    <div
      data-testid="devotional-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Date Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={() => handleShiftDate(-1)}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            &larr; Ontem
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={handleToday}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
            onClick={() => handleShiftDate(1)}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Amanhã &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="date"
            data-testid="devotional-date-picker"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          <Can action="manage_devotional">
            <button
              type="button"
              data-testid="edit-devotional-btn"
              onClick={onEdit}
              className="btn btn-primary ui-button ui-button--primary ui-button--sm"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--color-indigo-700)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {devotional ? 'Editar Devocional' : 'Criar Devocional'}
            </button>
          </Can>
        </div>
      </div>

      {!devotional ? (
        <div
          data-testid="devotional-empty-state"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-amber-50)',
              border: '2px solid var(--color-amber-100)',
              color: 'var(--color-amber-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <AletheiaIcon name="book-open" size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem 0' }}>
              Nenhum devocional registrado para esta data ({currentDate})
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '28rem', margin: 0 }}>
              Reúna a família ao redor da Palavra de Deus. Registre as passagens lidas, reflexões e orações de hoje.
            </p>
          </div>

          <Can action="manage_devotional">
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-primary ui-button ui-button--primary"
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-indigo-700)',
                color: 'var(--text-inverse)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                marginTop: '0.5rem',
              }}
            >
              Criar Devocional do Dia
            </button>
          </Can>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Scripture Reading Card with Gold Ribbon Badge */}
          <div
            data-testid="scripture-card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Gold / Amber Ribbon Accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--gold) 0%, var(--color-amber-600) 100%)',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {/* Gold Ribbon Badge */}
              <div
                data-testid="scripture-gold-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-amber-50)',
                  border: '1px solid var(--color-amber-100)',
                  color: 'var(--color-amber-700)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <AletheiaIcon name="sparkles" size={14} />
                <span>Leitura Bíblica & Aliança</span>
              </div>

              {devotional.bibleVersionId && (
                <span
                  data-testid="bible-version-badge"
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--color-indigo-50)',
                    color: 'var(--color-indigo-700)',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: '1px solid var(--color-indigo-100)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <AletheiaIcon name="book-open" size={12} />
                  <span>Versão: {devotional.bibleVersionId}</span>
                </span>
              )}
            </div>

            <h2
              data-testid="scripture-reference-heading"
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '0 0 1rem 0',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {devotional.bibleReference}
            </h2>

            {devotional.passageText && (
              <blockquote
                data-testid="scripture-passage-text"
                style={{
                  margin: 0,
                  padding: '1.25rem 1.5rem',
                  backgroundColor: 'var(--sage-soft)',
                  borderLeft: '4px solid var(--color-amber-600)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  fontSize: '1.0625rem',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  whiteSpace: 'pre-line',
                }}
              >
                “{devotional.passageText}”
              </blockquote>
            )}
          </div>

          {/* Reflection & Discussion Questions Card */}
          {(devotional.reflection || devotional.discussionQuestions) && (
            <div
              data-testid="reflection-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-emerald-700)',
                    backgroundColor: 'var(--color-emerald-50)',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-emerald-100)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <AletheiaIcon name="sprout" size={12} />
                  <span>Reflexão & Conversa em Família</span>
                </span>
              </div>

              {devotional.reflection && (
                <p
                  data-testid="reflection-text"
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: '1.65',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {devotional.reflection}
                </p>
              )}

              {devotional.discussionQuestions && (
                <div
                  data-testid="discussion-questions-box"
                  style={{
                    backgroundColor: 'var(--color-emerald-50)',
                    border: '1px solid var(--color-emerald-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <strong
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.875rem',
                      color: 'var(--color-emerald-700)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <AletheiaIcon name="file-text" size={14} />
                    <span>Perguntas para Diálogo Familiar:</span>
                  </strong>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-emerald-700)',
                      whiteSpace: 'pre-line',
                      lineHeight: '1.55',
                    }}
                  >
                    {devotional.discussionQuestions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Memory Verse Card */}
          {devotional.memoryVerse && (
            <div
              data-testid="memory-verse-card"
              style={{
                backgroundColor: 'var(--color-indigo-50)',
                border: '1px solid var(--color-indigo-100)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-indigo-700)',
                  letterSpacing: '0.025em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <AletheiaIcon name="lightbulb" size={14} />
                <span>Versículo para Memorização</span>
              </span>
              <p
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--color-indigo-700)',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {devotional.memoryVerse}
              </p>
            </div>
          )}

          {/* Hymn/Song and Practical Application Grid */}
          {(devotional.hymnOrSong || devotional.practicalApplication) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {devotional.hymnOrSong && (
                <div
                  data-testid="hymn-card"
                  style={{
                    backgroundColor: 'var(--color-indigo-50)',
                    border: '1px solid var(--color-indigo-100)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-indigo-700)',
                      letterSpacing: '0.025em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <AletheiaIcon name="heart" size={14} />
                    <span>Hino / Louvor do Dia</span>
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-indigo-700)', margin: 0 }}>
                    {devotional.hymnOrSong}
                  </p>
                </div>
              )}

              {devotional.practicalApplication && (
                <div
                  data-testid="practical-application-card"
                  style={{
                    backgroundColor: 'var(--color-amber-50)',
                    border: '1px solid var(--color-amber-100)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-amber-700)',
                      letterSpacing: '0.025em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <AletheiaIcon name="sprout" size={14} />
                    <span>Aplicação Prática</span>
                  </span>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-amber-700)', margin: 0, lineHeight: '1.5' }}>
                    {devotional.practicalApplication}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
