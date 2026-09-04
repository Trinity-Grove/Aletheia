'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon, Alert, Button, Checkbox, EmptyState, IconButton, Input, Modal, Select, Textarea } from '@aletheia/ui';
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
  onExportPdf?: ((reportId: string) => Promise<void>) | undefined;
}

export function ReportGeneratorView({
  reports,
  learners,
  activeLearnerId,
  onGenerateReport,
  onDeleteReport,
  onExportCsv,
  onExportPdf,
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
  const [generateError, setGenerateError] = useState<string | null>(null);

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
    setGenerateError(null);
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
    setGenerateError(null);
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
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Falha ao gerar relatório oficial.');
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
          <Select
            data-testid="filter-report-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'Todos os tipos de relatório' },
              ...Object.entries(REPORT_TYPE_CONFIG).map(([k, item]) => ({ value: k, label: item.label })),
            ]}
          />
        </div>

        <Can action="generate_transcripts">
          <Button
            data-testid="open-generate-report-btn"
            onClick={handleOpenModal}
            leftIcon={<AletheiaIcon name="file-text" size={16} />}
          >
            Gerar Relatório Oficial
          </Button>
        </Can>
      </div>

      {/* Reports Feed / Grid */}
      {filteredReports.length === 0 ? (
        <EmptyState
          data-testid="reports-empty-state"
          icon={<AletheiaIcon name="file-text" size={40} style={{ color: 'var(--sage)' }} />}
          title="Nenhum relatório oficial gerado ainda"
          description="Emita históricos escolares oficiais, sumários de presença para conformidade legal e dossiês do portfólio dos educandos."
          action={
            <Can action="generate_transcripts">
              <Button data-testid="empty-generate-report-btn" onClick={handleOpenModal}>
                Gerar Primeiro Histórico
              </Button>
            </Can>
          }
        />
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
                  <Button
                    size="sm"
                    data-testid={`view-report-btn-${report.id}`}
                    onClick={() => setSelectedReportForView(report)}
                    leftIcon={<AletheiaIcon name="eye" size={14} />}
                  >
                    Visualizar
                  </Button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid={`export-csv-btn-${report.id}`}
                      onClick={() => onExportCsv(report.id)}
                      title="Exportar CSV"
                      leftIcon={<AletheiaIcon name="download" size={14} />}
                    >
                      CSV
                    </Button>

                    {onExportPdf && report.type === 'ACADEMIC_TRANSCRIPT' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        data-testid={`export-pdf-btn-${report.id}`}
                        onClick={() => onExportPdf(report.id)}
                        title="Baixar PDF"
                        leftIcon={<AletheiaIcon name="file-text" size={14} />}
                      >
                        PDF
                      </Button>
                    )}

                    <Can action="delete_learners">
                      <IconButton
                        size="sm"
                        data-testid={`delete-report-btn-${report.id}`}
                        onClick={() => {
                          if (window.confirm('Excluir este relatório oficial? Esta ação não pode ser desfeita.')) {
                            onDeleteReport(report.id);
                          }
                        }}
                        title="Excluir Relatório"
                        aria-label="Excluir Relatório"
                      >
                        <AletheiaIcon name="trash-2" size={14} />
                      </IconButton>
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
        <div data-testid="generate-report-modal">
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title="Gerar Relatório / Histórico Oficial"
            footer={
              <>
                <Button variant="secondary" data-testid="cancel-report-btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" form="generate-report-form" data-testid="generate-report-btn" isLoading={isGenerating}>
                  Gerar Relatório
                </Button>
              </>
            }
          >
            <form id="generate-report-form" onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {generateError && (
                <Alert variant="error" data-testid="generate-report-form-error">
                  {generateError}
                </Alert>
              )}
              <Select
                label="Educando *"
                data-testid="report-learner-select"
                value={selectedLearnerId}
                onChange={(e) => handleLearnerChange(e.target.value)}
                options={learners.map((l) => ({ value: l.id, label: `${l.preferredName || l.firstName} ${l.lastName || ''}` }))}
              />

              <Select
                label="Tipo de Relatório *"
                data-testid="report-type-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                options={Object.entries(REPORT_TYPE_CONFIG).map(([k, item]) => ({ value: k, label: item.label }))}
              />

              <Input
                label="Título do Documento *"
                data-testid="report-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Histórico Escolar Oficial - Ano Letivo 2026"
              />

              <Select
                label="Critério de Escala de Notas / Domínio *"
                data-testid="report-grading-scale-select"
                value={gradingScale}
                onChange={(e) => setGradingScale(e.target.value as GradingScale)}
                options={Object.entries(GRADING_SCALE_LABELS).map(([k, label]) => ({ value: k, label }))}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Checkbox
                  data-testid="report-include-attendance-checkbox"
                  checked={includeAttendance}
                  onChange={(e) => setIncludeAttendance(e.target.checked)}
                  label="Incluir Sumário de Frequência e Carga Horária Cumprida"
                />

                <Checkbox
                  data-testid="report-include-portfolio-checkbox"
                  checked={includePortfolioHighlights}
                  onChange={(e) => setIncludePortfolioHighlights(e.target.checked)}
                  label="Incluir Destaques e Evidências do Portfólio"
                />
              </div>

              <Textarea
                label="Observações Gerais Pedagógicas / Notações"
                data-testid="report-notes-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: O educando demonstrou excelente avanço em hábitos de concentração e reverência nas narrações bíblicas."
              />
            </form>
          </Modal>
        </div>
      )}

      {/* Preview Modal */}
      {selectedReportForView && (
        <div data-testid="report-preview-modal">
          <Modal isOpen={true} onClose={() => setSelectedReportForView(null)} maxWidth="2xl">
            <PrintableTranscript
              report={selectedReportForView}
              onExportCsv={onExportCsv}
              onClose={() => setSelectedReportForView(null)}
            />
          </Modal>
        </div>
      )}
    </div>
  );
}
