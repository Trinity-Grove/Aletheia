'use client';

import React from 'react';
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
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
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
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
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
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#1E293B',
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
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
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
              borderRadius: '0.375rem',
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
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
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#4338CA',
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(67, 56, 202, 0.2)',
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
            backgroundColor: '#FFFFFF',
            border: '2px dashed #CBD5E1',
            borderRadius: '1rem',
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
              borderRadius: '9999px',
              backgroundColor: '#FFFBEB',
              border: '2px solid #FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)',
            }}
          >
            📖
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.375rem 0' }}>
              Nenhum devocional registrado para esta data ({currentDate})
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '28rem', margin: 0 }}>
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
                borderRadius: '0.5rem',
                backgroundColor: '#4338CA',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px 0 rgba(67, 56, 202, 0.2)',
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
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '1rem',
              padding: '1.75rem',
              boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
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
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
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
                  borderRadius: '9999px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 2px rgba(217, 119, 6, 0.1)',
                }}
              >
                <span>👑</span> Leitura Bíblica & Aliança
              </div>

              {devotional.bibleVersionId && (
                <span
                  data-testid="bible-version-badge"
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: '#EEF2FF',
                    color: '#4338CA',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '0.375rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: '1px solid #E0E7FF',
                  }}
                >
                  📖 Versão: {devotional.bibleVersionId}
                </span>
              )}
            </div>

            <h2
              data-testid="scripture-reference-heading"
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: '0 0 1rem 0',
                color: '#0F172A',
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
                  backgroundColor: '#F8FAFC',
                  borderLeft: '4px solid #D97706',
                  borderRadius: '0 0.5rem 0.5rem 0',
                  fontSize: '1.0625rem',
                  lineHeight: '1.7',
                  color: '#1E293B',
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
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 2px 4px -1px rgba(15, 23, 42, 0.04)',
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
                    color: '#047857',
                    backgroundColor: '#ECFDF5',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    border: '1px solid #D1FAE5',
                  }}
                >
                  🌿 Reflexão & Conversa em Família
                </span>
              </div>

              {devotional.reflection && (
                <p
                  data-testid="reflection-text"
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: '1.65',
                    color: '#334155',
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
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '0.625rem',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      color: '#166534',
                      marginBottom: '0.5rem',
                    }}
                  >
                    💬 Perguntas para Diálogo Familiar:
                  </strong>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#15803D',
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
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '1rem',
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
                  color: '#1D4ED8',
                  letterSpacing: '0.025em',
                }}
              >
                🧠 Versículo para Memorização
              </span>
              <p
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: '#1E40AF',
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
                    backgroundColor: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '1rem',
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
                      color: '#7E22CE',
                      letterSpacing: '0.025em',
                    }}
                  >
                    🎵 Hino / Louvor do Dia
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#581C87', margin: 0 }}>
                    {devotional.hymnOrSong}
                  </p>
                </div>
              )}

              {devotional.practicalApplication && (
                <div
                  data-testid="practical-application-card"
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '1rem',
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
                      color: '#B45309',
                      letterSpacing: '0.025em',
                    }}
                  >
                    🌱 Aplicação Prática
                  </span>
                  <p style={{ fontSize: '0.9375rem', color: '#78350F', margin: 0, lineHeight: '1.5' }}>
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
