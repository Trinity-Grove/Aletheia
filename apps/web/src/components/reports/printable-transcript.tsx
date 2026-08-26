'use client';

import React from 'react';
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
        backgroundColor: '#FFFFFF',
        color: '#111827',
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
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📜</span>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Visualização de Histórico Escolar Oficial
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            data-testid="download-csv-btn"
            onClick={handleExportCsv}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            📥 Baixar CSV
          </button>
          <button
            type="button"
            data-testid="print-transcript-btn"
            onClick={handlePrint}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            🖨️ Imprimir / Salvar PDF
          </button>
          {onClose && (
            <button
              type="button"
              data-testid="close-transcript-btn"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#FFFFFF',
                color: '#6B7280',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div
        id="official-transcript-document"
        style={{
          border: '2px solid #374151',
          padding: '2.5rem',
          borderRadius: '0.25rem',
          backgroundColor: '#FFFFFF',
          fontFamily: 'serif, Georgia, Times, serif',
          lineHeight: 1.5,
        }}
      >
        {/* Official School Header */}
        <header
          style={{
            textAlign: 'center',
            borderBottom: '2px double #4B5563',
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
              color: '#1F2937',
              marginBottom: '0.25rem',
            }}
          >
            {familyOrgName}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#4B5563', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Registro Educacional Familiar & Portfólio de Formação Integral
          </div>
          <h1
            data-testid="transcript-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#111827',
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
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            padding: '1rem 1.25rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: '#4B5563' }}>Educando: </span>
            <span data-testid="transcript-learner-name" style={{ fontWeight: 800, color: '#111827' }}>
              {learnerName}
            </span>
          </div>
          {content.learnerBirthDate && (
            <div>
              <span style={{ fontWeight: 700, color: '#4B5563' }}>Data de Nascimento: </span>
              <span data-testid="transcript-learner-birth">{content.learnerBirthDate}</span>
            </div>
          )}
          <div>
            <span style={{ fontWeight: 700, color: '#4B5563' }}>Ciclo / Série: </span>
            <span data-testid="transcript-grade-level" style={{ fontWeight: 600 }}>
              {content.gradeLevel || 'Ensino Fundamental'}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 700, color: '#4B5563' }}>Ano Acadêmico: </span>
            <span data-testid="transcript-academic-year" style={{ fontWeight: 600 }}>
              {academicYearTitle}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 700, color: '#4B5563' }}>Data de Emissão: </span>
            <span data-testid="transcript-issue-date">{generatedDate}</span>
          </div>
        </section>

        {/* Grading Scale Banner */}
        <div
          data-testid="transcript-grading-scale"
          style={{
            backgroundColor: '#F3F4F6',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.8125rem',
            color: '#374151',
            marginBottom: '1.25rem',
            borderLeft: '4px solid #3B82F6',
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
              borderBottom: '1px solid #9CA3AF',
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
              <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #9CA3AF' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #D1D5DB' }}>
                  Disciplina
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>
                  Avaliações
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>
                  Domínio Médio
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>
                  Nota / Conceito
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #D1D5DB' }}>
                  Síntese Avaliativa
                </th>
              </tr>
            </thead>
            <tbody>
              {subjectGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6B7280', border: '1px solid #D1D5DB' }}>
                    Nenhuma disciplina avaliada neste período letivo.
                  </td>
                </tr>
              ) : (
                subjectGrades.map((grade) => (
                  <tr
                    key={grade.subjectId}
                    data-testid={`subject-grade-row-${grade.subjectId}`}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 600, border: '1px solid #D1D5DB' }}>
                      {grade.subjectName}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>
                      {grade.evaluationCount}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #D1D5DB' }}>
                      {grade.averageMasteryLevel || '—'}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid #D1D5DB',
                        color: '#1E3A8A',
                      }}
                    >
                      {grade.calculatedGrade}
                      {grade.letterGrade ? ` (${grade.letterGrade})` : ''}
                      {grade.numericGrade !== null && grade.numericGrade !== undefined
                        ? ` [${grade.numericGrade}]`
                        : ''}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8125rem', border: '1px solid #D1D5DB' }}>
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
              backgroundColor: '#FAFAFA',
              border: '1px solid #E5E7EB',
              padding: '1rem',
              borderRadius: '0.25rem',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                margin: '0 0 0.5rem 0',
                color: '#374151',
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
                <strong style={{ color: attendanceSummary.isCompliant ? '#059669' : '#D97706' }}>
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
              color: '#374151',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                borderBottom: '1px solid #E5E7EB',
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
            <div style={{ borderBottom: '1px solid #4B5563', marginBottom: '0.5rem', height: '2rem' }} />
            <span style={{ fontWeight: 700 }}>Responsável Legal / Educador Titular</span>
            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Assinatura</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #4B5563', marginBottom: '0.5rem', height: '2rem' }} />
            <span style={{ fontWeight: 700 }}>Coordenador Pedagógico / Responsável</span>
            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Data: ____/____/________</div>
          </div>
        </section>
      </div>
    </div>
  );
}
