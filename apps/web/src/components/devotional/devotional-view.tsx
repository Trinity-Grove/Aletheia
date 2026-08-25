'use client';

import React from 'react';
import type { DailyDevotionalResponseDto } from '@aletheia/contracts';

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
      {/* Date Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleShiftDate(-1)}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          >
            &larr; Ontem
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleToday}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleShiftDate(1)}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
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
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="button"
            data-testid="edit-devotional-btn"
            onClick={onEdit}
            className="btn btn-primary"
            style={{ padding: '0.375rem 0.875rem', fontSize: '0.875rem' }}
          >
            {devotional ? 'Editar Devocional' : 'Criar Devocional'}
          </button>
        </div>
      </div>

      {!devotional ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px dashed #E5E7EB',
            borderRadius: '0.75rem',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
            Nenhum devocional registrado para esta data ({currentDate}).
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            Reúna a família, faça a leitura da Palavra e registre as reflexões e orações de hoje!
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-primary"
            style={{ padding: '0.625rem 1.25rem' }}
          >
            Criar Devocional do Dia
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Scripture Reading Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#4F46E5',
                  letterSpacing: '0.05em',
                }}
              >
                Leitura Bíblica
              </span>
              {devotional.bibleVersionId && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: '#EEF2FF',
                    color: '#4338CA',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {devotional.bibleVersionId}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#111827' }}>
              {devotional.bibleReference}
            </h2>
            {devotional.passageText ? (
              <blockquote
                style={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: '#F9FAFB',
                  borderLeft: '4px solid #4F46E5',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#374151',
                  fontStyle: 'italic',
                  whiteSpace: 'pre-line',
                }}
              >
                {devotional.passageText}
              </blockquote>
            ) : null}
          </div>

          {/* Reflection and Discussion Questions Card */}
          {(devotional.reflection || devotional.discussionQuestions) && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                padding: '1.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#059669',
                  letterSpacing: '0.05em',
                }}
              >
                Reflexão & Conversa em Família
              </span>
              {devotional.reflection && (
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: '#1F2937',
                    marginTop: '0.75rem',
                    marginBottom: devotional.discussionQuestions ? '1.25rem' : '0',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {devotional.reflection}
                </p>
              )}

              {devotional.discussionQuestions && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.875rem', color: '#065F46', marginBottom: '0.5rem' }}>
                    Perguntas para Diálogo:
                  </strong>
                  <div style={{ fontSize: '0.9375rem', color: '#047857', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                    {devotional.discussionQuestions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Memory Verse Card */}
          {devotional.memoryVerse && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#2563EB',
                  letterSpacing: '0.05em',
                }}
              >
                Versículo para Memorização
              </span>
              <p
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: '#1E40AF',
                  margin: '0.5rem 0 0 0',
                  lineHeight: '1.5',
                }}
              >
                {devotional.memoryVerse}
              </p>
            </div>
          )}

          {/* Hymn/Song and Practical Application */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {devotional.hymnOrSong && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#7C3AED',
                    letterSpacing: '0.05em',
                  }}
                >
                  Hino / Louvor do Dia
                </span>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#4C1D95', margin: '0.5rem 0 0 0' }}>
                  {devotional.hymnOrSong}
                </p>
              </div>
            )}

            {devotional.practicalApplication && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#D97706',
                    letterSpacing: '0.05em',
                  }}
                >
                  Aplicação Prática
                </span>
                <p style={{ fontSize: '0.9375rem', color: '#78350F', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                  {devotional.practicalApplication}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
