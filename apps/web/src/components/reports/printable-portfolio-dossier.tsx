'use client';

import React from 'react';
import { AletheiaIcon, Button, IconButton } from '@aletheia/ui';
import type {
  LearningPortfolioDossierDto,
  OfficialReportResponseDto,
} from '@aletheia/contracts';

export interface PrintablePortfolioDossierProps {
  report: OfficialReportResponseDto;
  dossier?: LearningPortfolioDossierDto | null | undefined;
  onExportCsv?: ((reportId: string) => void) | undefined;
  onExportPdf?: ((reportId: string) => void) | undefined;
  onPrint?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
}

export const LEGAL_DISCLAIMER_TEXT =
  'Atestamos a fidelidade dos registros pedagógicos acima descritos em conformidade com as diretrizes do plano educacional familiar. Este documento comprova o histórico de atividades e avaliações realizadas no âmbito familiar através da plataforma Aletheia; não constitui salvo-conduto estatal ou atestado de não abandono intelectual emitido por autoridade pública.';

export function PrintablePortfolioDossier({
  report,
  dossier: initialDossier,
  onExportCsv,
  onExportPdf,
  onPrint,
  onClose,
}: PrintablePortfolioDossierProps) {
  const content = (initialDossier ?? report.content) as Partial<LearningPortfolioDossierDto>;

  const familyOrgName =
    content.familyOrganizationName || 'Academia Familiar de Educação Domiciliar';
  const learnerName =
    content.learnerName || report.learnerName || 'Educando';
  const academicYearTitle =
    content.academicYearTitle || report.academicYearTitle || 'Ano Letivo Vigente';
  const generatedDate = content.generatedDate || report.generatedAt.slice(0, 10);
  const portfolioItems = content.portfolioItems || [];
  const learningHighlights = content.learningHighlights || [];
  const generalNotes = content.generalNotes || report.content?.notes;
  const documentHash = report.documentHash || report.id;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv(report.id);
    }
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf(report.id);
    }
  };

  return (
    <div
      data-testid="printable-portfolio-dossier-view"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Action Bar (Hidden during print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-light)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--color-indigo-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="palette" size={20} />
          </span>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Visualização de Dossiê do Portfólio
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onExportPdf && (
            <Button
              variant="secondary"
              data-testid="download-pdf-btn"
              onClick={handleExportPdf}
              leftIcon={<AletheiaIcon name="file-text" size={16} />}
            >
              Baixar PDF
            </Button>
          )}
          {onExportCsv && (
            <Button
              variant="secondary"
              data-testid="download-csv-btn"
              onClick={handleExportCsv}
              leftIcon={<AletheiaIcon name="download" size={16} />}
            >
              Baixar CSV
            </Button>
          )}
          <Button
            data-testid="print-dossier-btn"
            onClick={handlePrint}
            leftIcon={<AletheiaIcon name="printer" size={16} />}
          >
            Imprimir / Salvar PDF
          </Button>
          {onClose && (
            <IconButton data-testid="close-dossier-btn" onClick={onClose} aria-label="Fechar">
              <AletheiaIcon name="x" size={16} />
            </IconButton>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div
        id="official-dossier-document"
        style={{
          border: '2px solid var(--text-secondary)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface)',
          fontFamily: 'serif, Georgia, Times, serif',
          lineHeight: 1.5,
        }}
      >
        {/* Header */}
        <header
          style={{
            textAlign: 'center',
            borderBottom: '2px double var(--text-secondary)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            data-testid="dossier-organization-name"
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            {familyOrgName}
          </div>
          <div
            data-testid="dossier-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            {report.title || 'Dossiê do Portfólio de Aprendizagem'}
          </div>

          {documentHash && (
            <div
              data-testid="dossier-document-hash"
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--text-muted)',
              }}
            >
              Autenticidade SHA-256: {documentHash}
            </div>
          )}
        </header>

        {/* Learner Info */}
        <section
          data-testid="dossier-learner-info"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--sage-soft)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.75rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
              Educando(a)
            </span>
            <strong data-testid="dossier-learner-name">{learnerName}</strong>
          </div>
          {content.learnerBirthDate && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                Data de Nascimento
              </span>
              <strong data-testid="dossier-learner-birth">{content.learnerBirthDate}</strong>
            </div>
          )}
          {content.gradeLevel && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                Nível / Ciclo
              </span>
              <strong data-testid="dossier-grade-level">{content.gradeLevel}</strong>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
              Ano Letivo
            </span>
            <strong data-testid="dossier-academic-year">{academicYearTitle}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
              Data de Emissão
            </span>
            <strong data-testid="dossier-generated-date">{generatedDate}</strong>
          </div>
        </section>

        {/* Section 1: Portfolio Items */}
        <section style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            Trabalhos e Obras em Destaque no Portfólio ({portfolioItems.length})
          </h3>

          {portfolioItems.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Nenhum item de portfólio selecionado para este período.
            </p>
          ) : (
            <div data-testid="dossier-portfolio-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {portfolioItems.map((item, idx) => (
                <div
                  key={idx}
                  data-testid={`dossier-portfolio-item-${idx}`}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.date}
                    </span>
                  </div>

                  {item.evidenceTypeName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-indigo-600)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Tipo: {item.evidenceTypeName}
                    </div>
                  )}

                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>

                  {item.competencyNames && item.competencyNames.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {item.competencyNames.map((comp, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '0.6875rem',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-indigo-50)',
                            color: 'var(--color-indigo-700)',
                            border: '1px solid var(--color-indigo-200)',
                          }}
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Learning Highlights */}
        {learningHighlights.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              Registros e Narrações Pedagógicas em Destaque ({learningHighlights.length})
            </h3>

            <div data-testid="dossier-learning-highlights" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {learningHighlights.map((hl, idx) => (
                <div
                  key={idx}
                  data-testid={`dossier-highlight-${idx}`}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--sage-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{hl.subjectName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hl.date}</span>
                  </div>
                  <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    &ldquo;{hl.notes}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* General Notes */}
        {generalNotes && (
          <section
            data-testid="dossier-general-notes"
            style={{
              marginBottom: '2rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.25rem',
                margin: '0 0 0.5rem 0',
              }}
            >
              Observações Pedagógicas Gerais
            </h3>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
              {generalNotes}
            </p>
          </section>
        )}

        {/* Legal Non-Repudiation Disclaimer */}
        <section
          data-testid="dossier-legal-disclaimer"
          style={{
            marginTop: '2rem',
            padding: '0.875rem 1rem',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--color-amber-50, #fffbeb)',
            lineHeight: 1.4,
          }}
        >
          <strong>Ressalva Jurídica:</strong> {LEGAL_DISCLAIMER_TEXT}
        </section>

        {/* Signatures */}
        <section
          data-testid="dossier-signatures"
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
          }}
        >
          <div>
            <div style={{ borderBottom: '1px solid var(--border-medium)', marginBottom: '0.5rem', height: '2rem' }} />
            <span style={{ fontWeight: 700 }}>Responsável Legal / Educador Titular</span>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Assinatura</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid var(--border-medium)', marginBottom: '0.5rem', height: '2rem' }} />
            <span style={{ fontWeight: 700 }}>Coordenador Pedagógico / Responsável</span>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Data: ____/____/________</div>
          </div>
        </section>
      </div>
    </div>
  );
}
