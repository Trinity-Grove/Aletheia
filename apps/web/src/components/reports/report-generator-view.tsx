'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  GenerateReportDto,
  GradingScale,
  LearnerSummaryDto,
  OfficialReportResponseDto,
  ReportType,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { PrintableTranscript, GRADING_SCALE_LABELS } from './printable-transcript';

export const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; icon: React.ReactNode; description: string; color: string }
> = {
  ACADEMIC_TRANSCRIPT: {
    label: 'Histórico Escolar Oficial',
    icon: <AletheiaIcon name="file-text" size={18} />,
    description: 'Disciplinas, notas/conceitos calculados, horas e frequência oficial.',
    color: 'var(--color-indigo-600)',
  },
  ATTENDANCE_SUMMARY: {
    label: 'Sumário de Frequência & Carga Horária',
    icon: <AletheiaIcon name="calendar" size={18} />,
    description: 'Dias letivos cumpridos e conformidade de horas anuais.',
    color: 'var(--color-emerald-600)',
  },
  LEARNING_PORTFOLIO_DOSSIER: {
    label: 'Dossiê do Portfólio de Aprendizagem',
    icon: <AletheiaIcon name="palette" size={18} />,
    description: 'Compilado de evidências, narrações e obras em destaque.',
    color: 'var(--color-indigo-700)',
  },
  ANNUAL_COMPLIANCE_REPORT: {
    label: 'Relatório Anual de Cumprimento Legal',
    icon: <AletheiaIcon name="landmark" size={18} />,
    description: 'Documento comprobatório consolidado para órgãos legais e arquivos familiares.',
    color: 'var(--color-amber-600)',
  },
};

export interface ReportGeneratorViewProps {
  reports: OfficialReportResponseDto[];
  learners: LearnerSummaryDto[];
  activeLearnerId: string | null;
  onGenerateReport: (dto: GenerateReportDto) => Promise<OfficialReportResponseDto | void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  onExportCsv: (reportId: string) => Promise<void>;
}

export function ReportGeneratorView({
  reports,
  learners,
  activeLearnerId,
  onGenerateReport,
  onDeleteReport,
  onExportCsv,
}: ReportGeneratorViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReportForView, setSelectedReportForView] =
    useState<OfficialReportResponseDto | null>(null);

  // Form State
  const [selectedLearnerId, setSelectedLearnerId] = useState(
    activeLearnerId || (learners[0]?.id ?? '')
  );
  const [reportType, setReportType] = useState<ReportType>('ACADEMIC_TRANSCRIPT');
  const [title, setTitle] = useState('Histórico Escolar - Ano Letivo');
  const [gradingScale, setGradingScale] = useState<GradingScale>('MASTERY_QUALITATIVE');
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includePortfolioHighlights, setIncludePortfolioHighlights] = useState(true);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState<string>('');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeLearnerId && r.learnerId !== activeLearnerId) return false;
      if (filterType && r.type !== filterType) return false;
      return true;
    });
  }, [reports, activeLearnerId, filterType]);

  const handleOpenModal = () => {
    const defaultLearner = learners.find((l) => l.id === activeLearnerId) || learners[0];
    const learnerName = defaultLearner ? defaultLearner.preferredName || defaultLearner.firstName : '';
    setSelectedLearnerId(defaultLearner?.id ?? '');
    setReportType('ACADEMIC_TRANSCRIPT');
    setTitle(learnerName ? `Histórico Escolar - ${learnerName}` : 'Histórico Escolar Oficial');
    setGradingScale('MASTERY_QUALITATIVE');
    setIncludeAttendance(true);
    setIncludePortfolioHighlights(true);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleLearnerChange = (newLearnerId: string) => {
    setSelectedLearnerId(newLearnerId);
    const learner = learners.find((l) => l.id === newLearnerId);
    if (learner) {
      const name = learner.preferredName || learner.firstName;
      setTitle(`Histórico Escolar - ${name}`);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearnerId || !title.trim()) return;
    setIsGenerating(true);
    try {
      const dto: GenerateReportDto = {
        learnerId: selectedLearnerId,
        type: reportType,
        title: title.trim(),
        gradingScale,
        includeAttendance,
        includePortfolioHighlights,
        notes: notes.trim() ? notes.trim() : null,
      };
      const newReport = await onGenerateReport(dto);
      setIsModalOpen(false);
      if (newReport && typeof newReport === 'object' && 'id' in newReport) {
        setSelectedReportForView(newReport);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            data-testid="filter-report-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todos os tipos de relatório</option>
            {Object.entries(REPORT_TYPE_CONFIG).map(([k, item]) => (
              <option key={k} value={k}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <Can action="generate_transcripts">
          <button
            type="button"
            data-testid="open-generate-report-btn"
            onClick={handleOpenModal}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'var(--forest)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <AletheiaIcon name="file-text" size={16} />
            <span>Gerar Relatório Oficial</span>
          </button>
        </Can>
      </div>

      {/* Reports Feed / Grid */}
      {filteredReports.length === 0 ? (
        <div
          data-testid="reports-empty-state"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div style={{ color: 'var(--sage)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="file-text" size={40} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Nenhum relatório oficial gerado ainda
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Emita históricos escolares oficiais, sumários de presença para conformidade legal e dossiês do portfólio dos educandos.
          </p>
          <Can action="generate_transcripts">
            <button
              type="button"
              data-testid="empty-generate-report-btn"
              onClick={handleOpenModal}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Gerar Primeiro Histórico
            </button>
          </Can>
        </div>
      ) : (
        <div
          data-testid="reports-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredReports.map((report) => {
            const conf = REPORT_TYPE_CONFIG[report.type] || REPORT_TYPE_CONFIG.ACADEMIC_TRANSCRIPT;
            const learner = learners.find((l) => l.id === report.learnerId);
            const learnerDisplayName =
              report.learnerName || learner?.preferredName || learner?.firstName || 'Educando';

            return (
              <div
                key={report.id}
                data-testid={`report-card-${report.id}`}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-indigo-50)',
                        color: conf.color,
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {conf.icon} {conf.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {report.generatedAt.slice(0, 10)}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0.25rem 0',
                    }}
                  >
                    {report.title}
                  </h3>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <AletheiaIcon name="graduation-cap" size={14} style={{ color: 'var(--text-secondary)' }} />
                    <strong>{learnerDisplayName}</strong>
                    {report.academicYearTitle && ` • ${report.academicYearTitle}`}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Escala: {GRADING_SCALE_LABELS[report.gradingScale] || report.gradingScale}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--sage-soft)',
                  }}
                >
                  <button
                    type="button"
                    data-testid={`view-report-btn-${report.id}`}
                    onClick={() => setSelectedReportForView(report)}
                    style={{
                      padding: '0.4rem 0.875rem',
                      backgroundColor: 'var(--forest)',
                      color: 'var(--text-inverse)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <AletheiaIcon name="eye" size={14} />
                    <span>Visualizar</span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      data-testid={`export-csv-btn-${report.id}`}
                      onClick={() => onExportCsv(report.id)}
                      title="Exportar CSV"
                      style={{
                        padding: '0.4rem 0.625rem',
                        backgroundColor: 'var(--sage-soft)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <AletheiaIcon name="download" size={14} />
                      <span>CSV</span>
                    </button>

                    <Can action="delete_learners">
                      <button
                        type="button"
                        data-testid={`delete-report-btn-${report.id}`}
                        onClick={() => onDeleteReport(report.id)}
                        title="Excluir Relatório"
                        style={{
                          padding: '0.4rem 0.625rem',
                          backgroundColor: 'var(--color-rose-50)',
                          color: 'var(--color-rose-600)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-rose-100)',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        aria-label="Excluir Relatório"
                      >
                        <AletheiaIcon name="trash-2" size={14} />
                      </button>
                    </Can>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Report Modal */}
      {isModalOpen && (
        <div
          data-testid="generate-report-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Gerar Relatório / Histórico Oficial
            </h2>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Educando *
                </label>
                <select
                  data-testid="report-learner-select"
                  value={selectedLearnerId}
                  onChange={(e) => handleLearnerChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.preferredName || l.firstName} {l.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Tipo de Relatório *
                </label>
                <select
                  data-testid="report-type-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(REPORT_TYPE_CONFIG).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Título do Documento *
                </label>
                <input
                  type="text"
                  data-testid="report-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex.: Histórico Escolar Oficial - Ano Letivo 2026"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Critério de Escala de Notas / Domínio *
                </label>
                <select
                  data-testid="report-grading-scale-select"
                  value={gradingScale}
                  onChange={(e) => setGradingScale(e.target.value as GradingScale)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(GRADING_SCALE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    data-testid="report-include-attendance-checkbox"
                    checked={includeAttendance}
                    onChange={(e) => setIncludeAttendance(e.target.checked)}
                  />
                  Incluir Sumário de Frequência e Carga Horária Cumprida
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    data-testid="report-include-portfolio-checkbox"
                    checked={includePortfolioHighlights}
                    onChange={(e) => setIncludePortfolioHighlights(e.target.checked)}
                  />
                  Incluir Destaques e Evidências do Portfólio
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Observações Gerais Pedagógicas / Notações
                </label>
                <textarea
                  data-testid="report-notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: O educando demonstrou excelente avanço em hábitos de concentração e reverência nas narrações bíblicas."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  data-testid="cancel-report-btn"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="generate-report-btn"
                  disabled={isGenerating}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--forest)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isGenerating ? 'Gerando Documento...' : 'Gerar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedReportForView && (
        <div
          data-testid="report-preview-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <PrintableTranscript
              report={selectedReportForView}
              onExportCsv={onExportCsv}
              onClose={() => setSelectedReportForView(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
