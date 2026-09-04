'use client';

import React from 'react';
import { AletheiaIcon, Button, IconButton } from '@aletheia/ui';
import type {
  AcademicTranscriptDto,
  GradingScale,
  OfficialReportResponseDto,
} from '@aletheia/contracts';

export const GRADING_SCALE_LABELS: Record<GradingScale, string> = {
  MASTERY_QUALITATIVE: 'Escala Qualitativa de Domínio (Exposição → Autonomia → Domínio)',
  LETTER_A_F: 'Conceito Letrado Tradicional (A, B, C, D, F)',
  NUMERIC_0_10: 'Escala Numérica Decimal (0.0 a 10.0)',
  NUMERIC_0_100: 'Escala Numérica Percentual (0 a 100)',
  NARRATIVE: 'Avaliação Descritiva e Narrativa Contínua',
};

export interface PrintableTranscriptProps {
  report: OfficialReportResponseDto;
  transcript?: AcademicTranscriptDto | null | undefined;
  onExportCsv?: ((reportId: string) => void) | undefined;
  onPrint?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
}

export function PrintableTranscript({
  report,
  transcript: initialTranscript,
  onExportCsv,
  onPrint,
  onClose,
}: PrintableTranscriptProps) {
  const content = (initialTranscript ?? report.content) as Partial<AcademicTranscriptDto>;

  const familyOrgName =
    content.familyOrganizationName || 'Academia de Educação Domiciliar Cristã';
  const learnerName =
    content.learnerName || report.learnerName || 'Educando';
  const academicYearTitle =
    content.academicYearTitle || report.academicYearTitle || 'Ano Letivo Vigente';
  const generatedDate = content.generatedDate || report.generatedAt.slice(0, 10);
  const gradingScale = content.gradingScale || report.gradingScale;
  const subjectGrades = content.subjectGrades || [];
  const attendanceSummary = content.attendanceSummary;
  const generalNotes = content.generalNotes || report.content?.notes;

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

  return (
    <div
      data-testid="printable-transcript-view"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Top Action Bar (Hidden during actual print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--color-indigo-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="file-text" size={20} />
          </span>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Visualização de Histórico Escolar Oficial
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            data-testid="download-csv-btn"
            onClick={handleExportCsv}
            leftIcon={<AletheiaIcon name="download" size={16} />}
          >
            Baixar CSV
          </Button>
          <Button
            data-testid="print-transcript-btn"
            onClick={handlePrint}
            leftIcon={<AletheiaIcon name="printer" size={16} />}
          >
            Imprimir / Salvar PDF
          </Button>
          {onClose && (
            <IconButton data-testid="close-transcript-btn" onClick={onClose} aria-label="Fechar">
              <AletheiaIcon name="x" size={16} />
            </IconButton>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div
        id="official-transcript-document"
        style={{
          border: '2px solid var(--text-secondary)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface)',
          fontFamily: 'serif, Georgia, Times, serif',
          lineHeight: 1.5,
        }}
      >
        {/* Official School Header */}
        <header
          style={{
            textAlign: 'center',
            borderBottom: '2px double var(--text-secondary)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            data-testid="transcript-organization-name"
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
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Registro Educacional Familiar & Portfólio de Formação Integral
          </div>
          <h1
            data-testid="transcript-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: '0.5rem 0 0 0',
              textDecoration: 'underline',
            }}
          >
            {report.title}
          </h1>
        </header>

        {/* Learner Info Grid */}
        <section
          data-testid="transcript-learner-info"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--sage-soft)',
            border: '1px solid var(--border-light)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Educando: </span>
            <span data-testid="transcript-learner-name" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              {learnerName}
            </span>
          </div>
          {content.learnerBirthDate && (
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Data de Nascimento: </span>
              <span data-testid="transcript-learner-birth">{content.learnerBirthDate}</span>
            </div>
          )}
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Ciclo / Série: </span>
            <span data-testid="transcript-grade-level" style={{ fontWeight: 600 }}>
              {content.gradeLevel || 'Ensino Fundamental'}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Ano Acadêmico: </span>
            <span data-testid="transcript-academic-year" style={{ fontWeight: 600 }}>
              {academicYearTitle}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Data de Emissão: </span>
            <span data-testid="transcript-issue-date">{generatedDate}</span>
          </div>
        </section>

        {/* Grading Scale Banner */}
        <div
          data-testid="transcript-grading-scale"
          style={{
            backgroundColor: 'var(--sage-soft)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            borderLeft: '4px solid var(--color-indigo-600)',
          }}
        >
          <strong>Critério de Avaliação Adotado: </strong>
          {GRADING_SCALE_LABELS[gradingScale] || gradingScale}
        </div>

        {/* Subject Grades Table */}
        <section style={{ marginBottom: '1.75rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--border-medium)',
              paddingBottom: '0.25rem',
              marginBottom: '0.75rem',
            }}
          >
            Disciplinas & Avaliações Acadêmicas
          </h3>

          <table
            data-testid="subject-grades-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--sage-soft)', borderBottom: '2px solid var(--border-medium)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border-medium)' }}>
                  Disciplina
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
                  Avaliações
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
                  Domínio Médio
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
                  Nota / Conceito
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border-medium)' }}>
                  Síntese Avaliativa
                </th>
              </tr>
            </thead>
            <tbody>
              {subjectGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-medium)' }}>
                    Nenhuma disciplina avaliada neste período letivo.
                  </td>
                </tr>
              ) : (
                subjectGrades.map((grade) => (
                  <tr
                    key={grade.subjectId}
                    data-testid={`subject-grade-row-${grade.subjectId}`}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 600, border: '1px solid var(--border-medium)' }}>
                      {grade.subjectName}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
                      {grade.evaluationCount}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid var(--border-medium)' }}>
                      {grade.averageMasteryLevel || '—'}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid var(--border-medium)',
                        color: 'var(--color-indigo-700)',
                      }}
                    >
                      {grade.calculatedGrade}
                      {grade.letterGrade ? ` (${grade.letterGrade})` : ''}
                      {grade.numericGrade !== null && grade.numericGrade !== undefined
                        ? ` [${grade.numericGrade}]`
                        : ''}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8125rem', border: '1px solid var(--border-medium)' }}>
                      {grade.narrativeSummary || 'Progresso satisfatório de acordo com o plano curricular.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Attendance Summary Section */}
        {attendanceSummary && (
          <section
            data-testid="transcript-attendance-summary"
            style={{
              marginBottom: '1.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                margin: '0 0 0.5rem 0',
                color: 'var(--text-secondary)',
              }}
            >
              Registro de Frequência & Carga Horária
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
                Dias Letivos Totais: <strong>{attendanceSummary.totalDaysLogged}</strong>
              </div>
              <div>
                Dias Presentes: <strong>{attendanceSummary.presentDays}</strong>
              </div>
              <div>
                Ausências: <strong>{attendanceSummary.absentDays}</strong>
              </div>
              <div>
                Horas Cumpridas: <strong>{attendanceSummary.totalHoursLogged} h</strong>
              </div>
              <div>
                Situação:{' '}
                <strong style={{ color: attendanceSummary.isCompliant ? 'var(--color-emerald-600)' : 'var(--color-amber-600)' }}>
                  {attendanceSummary.isCompliant ? 'Conforme Metas' : 'Em Andamento'}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* General Notes */}
        {generalNotes && (
          <section
            data-testid="transcript-general-notes"
            style={{
              marginBottom: '1.75rem',
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
              Observações Gerais & Formação do Caráter
            </h3>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
              {generalNotes}
            </p>
          </section>
        )}

        {/* Official Signatures */}
        <section
          data-testid="transcript-signatures"
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
