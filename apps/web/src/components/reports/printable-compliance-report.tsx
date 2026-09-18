'use client';

import React from 'react';
import { AletheiaIcon, Button, IconButton } from '@aletheia/ui';
import type {
  AnnualComplianceReportDto,
  OfficialReportResponseDto,
} from '@aletheia/contracts';

export interface PrintableComplianceReportProps {
  report: OfficialReportResponseDto;
  compliance?: AnnualComplianceReportDto | null | undefined;
  onExportCsv?: ((reportId: string) => void) | undefined;
  onExportPdf?: ((reportId: string) => void) | undefined;
  onPrint?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
}

export const LEGAL_DISCLAIMER_TEXT =
  'Atestamos a fidelidade dos registros pedagógicos acima descritos em conformidade com as diretrizes do plano educacional familiar. Este documento comprova o histórico de atividades e avaliações realizadas no âmbito familiar através da plataforma Aletheia; não constitui salvo-conduto estatal ou atestado de não abandono intelectual emitido por autoridade pública.';

export function PrintableComplianceReport({
  report,
  compliance: initialCompliance,
  onExportCsv,
  onExportPdf,
  onPrint,
  onClose,
}: PrintableComplianceReportProps) {
  const content = (initialCompliance ?? report.content) as Partial<AnnualComplianceReportDto>;

  const familyOrgName =
    content.familyOrganizationName || 'Academia Familiar de Educação Domiciliar';
  const learnerName =
    content.learnerName || report.learnerName || 'Educando';
  const academicYearTitle =
    content.academicYearTitle || report.academicYearTitle || 'Ano Letivo Vigente';
  const generatedDate = content.generatedDate || report.generatedAt.slice(0, 10);
  const jurisdiction = content.jurisdiction;
  const attendance = content.attendanceCompliance;
  const curriculumProgress = content.curriculumProgress || [];
  const generalNotes = content.generalNotes || report.content?.notes;
  const legalDisclaimer = content.legalDisclaimer || LEGAL_DISCLAIMER_TEXT;
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
      data-testid="printable-compliance-report-view"
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
          <span style={{ color: 'var(--color-amber-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="landmark" size={20} />
          </span>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Visualização de Relatório de Conformidade Legal
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
            data-testid="print-compliance-btn"
            onClick={handlePrint}
            leftIcon={<AletheiaIcon name="printer" size={16} />}
          >
            Imprimir / Salvar PDF
          </Button>
          {onClose && (
            <IconButton data-testid="close-compliance-btn" onClick={onClose} aria-label="Fechar">
              <AletheiaIcon name="x" size={16} />
            </IconButton>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div
        id="official-compliance-document"
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
            data-testid="compliance-organization-name"
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
            data-testid="compliance-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            {report.title || 'Relatório Anual de Cumprimento Legal e Conformidade'}
          </div>

          {documentHash && (
            <div
              data-testid="compliance-document-hash"
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
          data-testid="compliance-learner-info"
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
            <strong data-testid="compliance-learner-name">{learnerName}</strong>
          </div>
          {content.learnerBirthDate && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                Data de Nascimento
              </span>
              <strong data-testid="compliance-learner-birth">{content.learnerBirthDate}</strong>
            </div>
          )}
          {content.gradeLevel && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                Nível / Ciclo
              </span>
              <strong data-testid="compliance-grade-level">{content.gradeLevel}</strong>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
              Ano Letivo
            </span>
            <strong data-testid="compliance-academic-year">{academicYearTitle}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
              Data de Emissão
            </span>
            <strong data-testid="compliance-generated-date">{generatedDate}</strong>
          </div>
        </section>

        {/* Jurisdiction & Statutory Framework */}
        {jurisdiction && (
          <section
            data-testid="compliance-jurisdiction-info"
            style={{
              marginBottom: '1.75rem',
              padding: '1rem',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                margin: '0 0 0.5rem 0',
                color: 'var(--text-primary)',
              }}
            >
              Marco Referencial e Jurisdição Aplicada
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div>
                Jurisdição: <strong data-testid="compliance-jurisdiction-name">{jurisdiction.name}</strong> ({jurisdiction.code} v{jurisdiction.version})
              </div>
              {jurisdiction.minInstructionalDays != null && (
                <div>
                  Meta Mínima de Dias: <strong>{jurisdiction.minInstructionalDays} dias</strong>
                </div>
              )}
              {jurisdiction.minInstructionalHours != null && (
                <div>
                  Meta Mínima de Horas: <strong>{jurisdiction.minInstructionalHours} h</strong>
                </div>
              )}
              {jurisdiction.officialSource && (
                <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Fonte Oficial: {jurisdiction.officialSource}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attendance & Time Compliance */}
        {attendance && (
          <section
            data-testid="compliance-attendance-summary"
            style={{
              marginBottom: '1.75rem',
              padding: '1rem',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                margin: '0 0 0.75rem 0',
              }}
            >
              Cumprimento de Frequência e Carga Horária
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                Dias Cumpridos: <strong>{attendance.loggedDays}</strong>
                {attendance.requiredDays != null && ` / ${attendance.requiredDays}`}
              </div>
              <div>
                Horas Cumpridas: <strong>{attendance.loggedHours} h</strong>
                {attendance.requiredHours != null && ` / ${attendance.requiredHours} h`}
              </div>
              <div>
                Situação:{' '}
                <strong
                  data-testid="compliance-status-badge"
                  style={{
                    color: attendance.isCompliant
                      ? 'var(--color-emerald-600)'
                      : 'var(--color-amber-600)',
                  }}
                >
                  {attendance.isCompliant ? 'CONFORME ÀS METAS' : 'EM ANDAMENTO'}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* Curricular Progress Table */}
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
            Progresso Curricular por Disciplina
          </h3>

          {curriculumProgress.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Nenhum dado curricular registrado para este período.
            </p>
          ) : (
            <table
              data-testid="compliance-curriculum-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.8125rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--text-primary)' }}>
                  <th style={{ padding: '0.5rem 0.25rem' }}>Disciplina</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Avaliações</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Nível de Domínio</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>Conceito / Nota</th>
                </tr>
              </thead>
              <tbody>
                {curriculumProgress.map((item, idx) => (
                  <tr
                    key={idx}
                    data-testid={`compliance-curriculum-row-${idx}`}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600 }}>
                      {item.subjectName}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                      {item.evaluatedCount}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                      {item.averageMasteryLevel || '-'}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', fontWeight: 700 }}>
                      {item.calculatedGrade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* General Notes */}
        {generalNotes && (
          <section
            data-testid="compliance-general-notes"
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

        {/* Legal Disclaimer */}
        <section
          data-testid="compliance-legal-disclaimer"
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
          <strong>Ressalva Jurídica:</strong> {legalDisclaimer}
        </section>

        {/* Signatures */}
        <section
          data-testid="compliance-signatures"
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
