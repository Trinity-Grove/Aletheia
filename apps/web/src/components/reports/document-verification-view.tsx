'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Button, Input } from '@aletheia/ui';
import type { ReportVerificationResponseDto } from '@aletheia/contracts';
import { REPORT_TYPE_CONFIG } from './report-generator-view';

export interface DocumentVerificationViewProps {
  initialIdentifier?: string | null | undefined;
  onVerify?: ((identifier: string) => Promise<ReportVerificationResponseDto>) | undefined;
}

export function DocumentVerificationView({
  initialIdentifier,
  onVerify,
}: DocumentVerificationViewProps) {
  const [identifier, setIdentifier] = useState(initialIdentifier ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReportVerificationResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeVerify = async (queryId: string) => {
    const trimmed = queryId.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setError(null);
    try {
      if (onVerify) {
        const res = await onVerify(trimmed);
        setResult(res);
      } else {
        const response = await fetch(`/api/v1/reports/verify/${encodeURIComponent(trimmed)}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Falha ao conectar com o serviço de verificação.');
        }
        const data: ReportVerificationResponseDto = await response.json();
        setResult(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro na verificação de autenticidade.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialIdentifier && initialIdentifier.trim()) {
      executeVerify(initialIdentifier);
    }
  }, [initialIdentifier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerify(identifier);
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-indigo-600)',
            marginBottom: '0.75rem',
          }}
        >
          <AletheiaIcon name="shield-check" size={32} />
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Aletheia Verificações
          </span>
        </div>

        <h1
          data-testid="document-verification-title"
          style={{
            fontSize: '1.875rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          Verificação Pública de Autenticidade
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px', marginInline: 'auto' }}>
          Consulte e confirme a validade criptográfica de históricos escolares, sumários de presença e dossiês educacionais emitidos pela plataforma.
        </p>
      </div>

      {/* Search Bar / Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Input
          label="Identificador do Documento ou Hash Criptográfico SHA-256"
          data-testid="verification-input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Ex.: 4ab4391b... (64 caracteres hexadecimais) ou UUID do relatório"
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            data-testid="verify-btn"
            isLoading={isLoading}
            leftIcon={<AletheiaIcon name="search" size={16} />}
          >
            Verificar Autenticidade
          </Button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" data-testid="verification-error-alert">
          {error}
        </Alert>
      )}

      {/* Results View */}
      {result && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {result.status === 'VERIFIED' && (
            <div
              data-testid="verified-report-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--color-emerald-500, #10b981)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {/* Authenticity Badge */}
              <div
                data-testid="verification-badge-verified"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--color-emerald-50, #ecfdf5)',
                  color: 'var(--color-emerald-800, #065f46)',
                  border: '1px solid var(--color-emerald-300, #6ee7b7)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  alignSelf: 'flex-start',
                }}
              >
                <AletheiaIcon name="check-circle" size={18} style={{ color: 'var(--color-emerald-600, #059669)' }} />
                DOCUMENTO VERIFICADO & AUTÊNTICO
              </div>

              <div>
                <h2
                  data-testid="verified-report-title"
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    margin: '0 0 0.5rem 0',
                    color: 'var(--text-primary)',
                  }}
                >
                  {result.title || 'Relatório Oficial Aletheia'}
                </h2>

                {result.reportType && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-indigo-600)', fontWeight: 600 }}>
                    Tipo: {REPORT_TYPE_CONFIG[result.reportType]?.label || result.reportType}
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--sage-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Educando(a)
                  </span>
                  <strong data-testid="verified-learner-name">{result.learnerName || 'Educando Registrado'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Organização / Família
                  </span>
                  <strong data-testid="verified-organization-name">
                    {result.familyOrganizationName || 'Academia Familiar Registrada'}
                  </strong>
                </div>

                {result.academicYearTitle && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Ano Letivo
                    </span>
                    <strong data-testid="verified-academic-year">{result.academicYearTitle}</strong>
                  </div>
                )}

                {result.generatedAt && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Data de Emissão
                    </span>
                    <strong data-testid="verified-generated-date">{result.generatedAt.slice(0, 10)}</strong>
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Hash Criptográfico SHA-256
                  </span>
                  <code
                    data-testid="verified-document-hash"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {result.documentHash}
                  </code>
                </div>
              </div>

              {/* Legal Non-Repudiation Disclaimer */}
              <div
                data-testid="verification-legal-disclaimer"
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-amber-50, #fffbeb)',
                  border: '1px solid var(--color-amber-200, #fde68a)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-amber-900, #78350f)',
                  lineHeight: 1.5,
                }}
              >
                <strong>Ressalva Jurídica:</strong> {result.legalDisclaimer}
              </div>
            </div>
          )}

          {result.status === 'NOT_FOUND' && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                data-testid="verification-badge-not-found"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--color-amber-50, #fffbeb)',
                  color: 'var(--color-amber-800, #92400e)',
                  border: '1px solid var(--color-amber-300, #fcd34d)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                <AletheiaIcon name="alert-circle" size={18} style={{ color: 'var(--color-amber-600, #d97706)' }} />
                DOCUMENTO NÃO ENCONTRADO
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '500px' }}>
                Nenhum registro educacional oficial foi localizado para este código ou hash criptográfico. Verifique se o identificador digitado está correto.
              </p>
            </div>
          )}

          {result.status === 'INVALID' && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--color-rose-500, #f43f5e)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                data-testid="verification-badge-invalid"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--color-rose-50, #fff1f2)',
                  color: 'var(--color-rose-800, #9f1239)',
                  border: '1px solid var(--color-rose-300, #fecdd3)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                <AletheiaIcon name="x-circle" size={18} style={{ color: 'var(--color-rose-600, #e11d48)' }} />
                DOCUMENTO INVÁLIDO OU INTEGRIDADE VIOLADA
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '500px' }}>
                Integridade do documento inválida ou incompatível com a assinatura registrada. O conteúdo pode ter sido alterado ou corrompido após a emissão.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
