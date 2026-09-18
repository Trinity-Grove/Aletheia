'use client';

import React, { useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState } from '@aletheia/ui';
import type { ComparePassageResponseDto, ComparePassageResultDto } from '@aletheia/contracts';
import { getApiAuthToken } from '../../lib/api';
import { useAuth } from '../../lib/auth/auth-context';

export interface TranslationOption {
  code: string;
  name: string;
  language: string;
  philosophy: string;
}

export const AVAILABLE_TRANSLATIONS: TranslationOption[] = [
  {
    code: 'ARC',
    name: 'Almeida Revista e Corrigida',
    language: 'pt',
    philosophy: 'Equivalência Formal Tradicional',
  },
  {
    code: 'ARA',
    name: 'Almeida Revista e Atualizada',
    language: 'pt',
    philosophy: 'Equivalência Formal',
  },
  {
    code: 'NAA',
    name: 'Nova Almeida Atualizada',
    language: 'pt',
    philosophy: 'Equivalência Formal Moderna',
  },
  {
    code: 'NVI',
    name: 'Nova Versão Internacional',
    language: 'pt',
    philosophy: 'Equivalência Dinâmica',
  },
  {
    code: 'NVT',
    name: 'Nova Versão Transformadora',
    language: 'pt',
    philosophy: 'Equivalência Dinâmica Contemporânea',
  },
];

export const QUICK_REFERENCES = ['João 1:1', 'Salmos 23:1', 'Romanos 8:28', 'Gênesis 1:1'];

export interface BibleTranslationCompareViewProps {
  familyId?: string;
  initialReference?: string;
  initialTranslations?: string[];
}

export function BibleTranslationCompareView({
  familyId: propFamilyId,
  initialReference = '',
  initialTranslations = ['ARC', 'ARA'],
}: BibleTranslationCompareViewProps) {
  const auth = useAuth();
  const effectiveFamilyId =
    propFamilyId ||
    auth?.activeFamilyId ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('aletheia_active_family_id') || localStorage.getItem('familyId')
      : null);

  const [reference, setReference] = useState(initialReference);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialTranslations);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparePassageResponseDto | null>(null);

  const toggleTranslation = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectQuickRef = (quickRef: string) => {
    setReference(quickRef);
    setError(null);
  };

  const handleCompare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedRef = reference.trim();
    if (!trimmedRef) {
      setError('Por favor, informe uma referência bíblica (ex: João 3:16).');
      return;
    }

    if (selectedCodes.length === 0) {
      setError('Selecione pelo menos uma tradução bíblica para comparar.');
      return;
    }

    if (!effectiveFamilyId) {
      setError('Família ativa não encontrada. Selecione uma família antes de comparar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authToken = getApiAuthToken();
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const queryParams = new URLSearchParams({
        reference: trimmedRef,
        translationCodes: selectedCodes.join(','),
      });

      const url = `/api/v1/families/${encodeURIComponent(effectiveFamilyId)}/curriculum/bible-translations/compare?${queryParams.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            'Não foi possível carregar a comparação para a referência informada.'
        );
      }

      const data: ComparePassageResponseDto = await res.json();
      setComparisonData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao comparar traduções bíblicas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid="bible-translation-compare-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
      }}
    >
      {/* Search and Translation Filters Panel */}
      <Card
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <form onSubmit={handleCompare} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              htmlFor="bible-reference-input"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--forest)',
                marginBottom: '0.5rem',
              }}
            >
              Referência Bíblica
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="bible-reference-input"
                data-testid="bible-reference-input"
                type="text"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: João 1:1, Salmos 23:1, Romanos 8:28..."
                style={{
                  flex: '1 1 260px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.9375rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <Button
                type="submit"
                variant="primary"
                data-testid="compare-btn"
                isLoading={isLoading}
                disabled={isLoading}
                style={{
                  padding: '0.625rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                }}
              >
                Comparar Traduções
              </Button>
            </div>

            {/* Quick suggestions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Sugestões rápidas:
              </span>
              {QUICK_REFERENCES.map((quickRef) => (
                <button
                  key={quickRef}
                  type="button"
                  data-testid={`quick-ref-${quickRef.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => handleSelectQuickRef(quickRef)}
                  style={{
                    backgroundColor: reference === quickRef ? 'var(--sage-soft)' : 'var(--bg-canvas)',
                    color: reference === quickRef ? 'var(--forest)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-full, 9999px)',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    fontWeight: reference === quickRef ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {quickRef}
                </button>
              ))}
            </div>
          </div>

          {/* Translation Selection Section */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <span
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Traduções para Comparação:
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {AVAILABLE_TRANSLATIONS.map((t) => {
                const isChecked = selectedCodes.includes(t.code);
                return (
                  <label
                    key={t.code}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isChecked ? 'var(--sage-soft)' : 'var(--bg-canvas)',
                      border: `1px solid ${isChecked ? 'var(--sage)' : 'var(--border-light)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      data-testid={`translation-checkbox-${t.code}`}
                      checked={isChecked}
                      onChange={() => toggleTranslation(t.code)}
                      style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: isChecked ? 'var(--forest)' : 'var(--text-primary)',
                          }}
                        >
                          {t.code}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--gold-dark)',
                            fontWeight: 600,
                          }}
                        >
                          • {t.philosophy.split(' ')[0]}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.3,
                        }}
                      >
                        {t.name}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Card>

      {/* Error alert */}
      {error && (
        <Alert variant="error" data-testid="compare-error-alert">
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          data-testid="compare-loading"
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              animation: 'pulse 1.5s infinite',
            }}
          >
            📖
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--forest)', fontSize: '1.0625rem' }}>
              Consultando traduções bíblicas...
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Buscando passagens e alinhando versões lado a lado.
            </div>
          </div>
        </div>
      )}

      {/* Empty State before search */}
      {!isLoading && !comparisonData && !error && (
        <div data-testid="compare-empty-state">
          <EmptyState
            icon={
              <div
                style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                📜
              </div>
            }
            title="Escolha uma passagem para comparar"
            description="Digite a referência desejada ou use uma das sugestões rápidas acima para visualizar e comparar as diferentes traduções lado a lado com toda a família."
          />
        </div>
      )}

      {/* Side-by-side comparison results grid */}
      {!isLoading && comparisonData && comparisonData.results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0 0.25rem',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.375rem',
                fontWeight: 600,
                color: 'var(--forest)',
              }}
            >
              Comparação: {comparisonData.reference}
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {comparisonData.results.length} traduç{comparisonData.results.length === 1 ? 'ão' : 'ões'} exibida{comparisonData.results.length === 1 ? '' : 's'}
            </span>
          </div>

          <div
            data-testid="bible-compare-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
              gap: '1.25rem',
              alignItems: 'stretch',
            }}
          >
            {comparisonData.results.map((item: ComparePassageResultDto) => (
              <Card
                key={item.translationCode}
                data-testid={`compare-card-${item.translationCode}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent top border */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'var(--forest)',
                  }}
                />

                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <div>
                    <Badge variant="emerald" size="md">
                      {item.translationCode}
                    </Badge>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--gold-dark)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {item.reference || comparisonData.reference}
                  </span>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h3
                    style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--forest)',
                    }}
                  >
                    {item.translationName}
                  </h3>
                </div>

                {/* Scripture Text Body */}
                <div
                  style={{
                    flex: '1 1 auto',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.0625rem',
                    lineHeight: 1.8,
                    color: 'var(--text-primary)',
                    fontStyle: 'normal',
                    backgroundColor: 'var(--bg-canvas)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {item.content ? (
                    item.content
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9375rem' }}>
                      Texto não disponível para esta referência.
                    </span>
                  )}
                </div>

                {/* Copyright / Licensing Footer */}
                {item.copyright && (
                  <div
                    data-testid={`compare-copyright-${item.translationCode}`}
                    style={{
                      marginTop: '1rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '0.5rem',
                    }}
                  >
                    {item.copyright}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
