'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, Card, Modal, Select, Textarea } from '@aletheia/ui';
import type {
  ComplianceEvaluationResponseDto,
  ComplianceEvaluationStatus,
  CreateManualComplianceOverrideDto,
} from '@aletheia/contracts';

export interface ComplianceEvaluationPanelProps {
  familyId: string;
  learnerId: string | null;
  academicYearId?: string | null;
  onOverrideRecorded?: () => void;
}

const statusBadgeConfig: Record<
  ComplianceEvaluationStatus,
  { label: string; variant: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate'; icon: React.ReactNode }
> = {
  COMPLIANT: {
    label: 'Conforme',
    variant: 'emerald',
    icon: <AletheiaIcon name="check" size={14} />,
  },
  IN_PROGRESS: {
    label: 'Em Andamento',
    variant: 'indigo',
    icon: <AletheiaIcon name="clock" size={14} />,
  },
  NON_COMPLIANT: {
    label: 'Não Conforme',
    variant: 'rose',
    icon: <AletheiaIcon name="x" size={14} />,
  },
  REVIEW_NEEDED: {
    label: 'Revisão Necessária',
    variant: 'amber',
    icon: <AletheiaIcon name="alert-triangle" size={14} />,
  },
  EXEMPT: {
    label: 'Isento',
    variant: 'slate',
    icon: <AletheiaIcon name="minus" size={14} />,
  },
};

const confidenceBadgeConfig = {
  ESTABLISHED: {
    label: 'Diretriz Consolidada',
    variant: 'emerald' as const,
  },
  CONTESTED: {
    label: 'Em Disputa Judicial',
    variant: 'amber' as const,
  },
  UNCERTAIN: {
    label: 'Alta Incerteza Jurídica',
    variant: 'rose' as const,
  },
};

export function ComplianceEvaluationPanel({
  familyId,
  learnerId,
  academicYearId,
  onOverrideRecorded,
}: ComplianceEvaluationPanelProps) {
  const [evaluation, setEvaluation] = useState<ComplianceEvaluationResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual override modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<ComplianceEvaluationStatus>('COMPLIANT');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const fetchEvaluation = useCallback(async () => {
    if (!learnerId) {
      setEvaluation(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('learnerId', learnerId);
      if (academicYearId) {
        params.append('academicYearId', academicYearId);
      }

      const res = await fetch(`/api/v1/families/${familyId}/compliance/evaluate?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Falha ao carregar avaliação de conformidade.');
      }

      const data = await res.json();
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao consultar conformidade.');
    } finally {
      setLoading(false);
    }
  }, [familyId, learnerId, academicYearId]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  const handleOpenOverrideModal = () => {
    setOverrideStatus(evaluation?.overallStatus || 'COMPLIANT');
    setOverrideReason('');
    setOverrideError(null);
    setIsOverrideModalOpen(true);
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) return;

    if (overrideReason.trim().length < 10) {
      setOverrideError('A justificativa da sobreposição manual deve conter pelo menos 10 caracteres.');
      return;
    }

    setOverrideSubmitting(true);
    setOverrideError(null);
    try {
      const payload: CreateManualComplianceOverrideDto = {
        learnerId,
        academicYearId: evaluation?.academicYearId || academicYearId || '',
        status: overrideStatus,
        reason: overrideReason.trim(),
      };

      const res = await fetch(`/api/v1/families/${familyId}/compliance/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Não foi possível salvar a sobreposição manual.');
      }

      setIsOverrideModalOpen(false);
      await fetchEvaluation();
      onOverrideRecorded?.();
    } catch (err: any) {
      setOverrideError(err.message || 'Erro ao registrar sobreposição.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  if (!learnerId) {
    return (
      <Card data-testid="compliance-panel-no-learner" className="p-6 text-center text-slate-500">
        <AletheiaIcon name="book-open" size={32} className="mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium">Selecione um educando para avaliar a conformidade legal e curricular.</p>
      </Card>
    );
  }

  if (loading && !evaluation) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <p className="text-sm animate-pulse">Avaliando conformidade e diretrizes normativas...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Erro de Avaliação">
        <p className="text-sm">{error}</p>
        <Button size="sm" variant="secondary" onClick={fetchEvaluation} className="mt-2">
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  if (!evaluation) {
    return null;
  }

  const overallBadge = statusBadgeConfig[evaluation.overallStatus];
  const confBadge = confidenceBadgeConfig[evaluation.jurisdiction.confidenceLevel];
  const isReviewNeeded = evaluation.overallStatus === 'REVIEW_NEEDED';

  return (
    <div data-testid="compliance-panel-content" className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Avaliação de Conformidade Legal
              </h2>
              <Badge variant={overallBadge.variant} className="flex items-center gap-1 font-semibold">
                {overallBadge.icon}
                {overallBadge.label}
              </Badge>
              {isReviewNeeded && (
                <Badge variant="rose" className="font-bold uppercase tracking-wider text-xs">
                  Revisão Obrigatória
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Educando: <span className="font-medium text-slate-700 dark:text-slate-300">{evaluation.learnerName}</span>
              {evaluation.academicYearTitle && (
                <> | Período: <span className="font-medium text-slate-700 dark:text-slate-300">{evaluation.academicYearTitle}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="open-override-btn"
              variant="secondary"
              size="sm"
              onClick={handleOpenOverrideModal}
              className="flex items-center gap-1.5"
            >
              <AletheiaIcon name="edit-3" size={14} />
              Sobreposição Manual
            </Button>
          </div>
        </div>

        {/* Jurisdiction & Status Summary Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jurisdição Aplicável</span>
              <Badge variant={confBadge.variant} size="sm">
                {confBadge.label}
              </Badge>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {`${evaluation.jurisdiction.name} (${evaluation.jurisdiction.code} v${evaluation.jurisdiction.version})`}
            </p>
            {evaluation.jurisdiction.officialSource && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={evaluation.jurisdiction.officialSource}>
                Ref: {evaluation.jurisdiction.officialSource}
              </p>
            )}
          </div>

          <div className="md:col-span-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Diagnóstico do Motor</span>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              {evaluation.statusSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Audited Manual Override Banner (if active) */}
      {evaluation.manualOverride && (
        <div
          data-testid="manual-override-banner"
          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
        >
          <div className="text-amber-600 dark:text-amber-400 mt-0.5">
            <AletheiaIcon name="alert-circle" size={20} />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Sobreposição Manual Ativa
              </span>
              <Badge variant={statusBadgeConfig[evaluation.manualOverride.status].variant} size="sm">
                {statusBadgeConfig[evaluation.manualOverride.status].label}
              </Badge>
              <span className="text-amber-700 dark:text-amber-400">
                por {evaluation.manualOverride.overriddenByName || 'Responsável'} em{' '}
                {new Date(evaluation.manualOverride.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              Motivo auditado: &ldquo;{evaluation.manualOverride.reason}&rdquo;
            </p>
            <p className="text-amber-600 dark:text-amber-400 mt-1">
              Esta sobreposição reflete decisão da família para registro interno e não altera determinações judiciais ou estatais.
            </p>
          </div>
        </div>
      )}

      {/* Criteria Breakdown Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Detalhamento de Critérios Estatutários
        </h3>

        {evaluation.criteriaBreakdown.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center text-sm text-slate-500">
            Nenhum critério específico foi cadastrado para esta jurisdição.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evaluation.criteriaBreakdown.map((criterion, idx) => {
              const critBadge = statusBadgeConfig[criterion.status];
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {criterion.label}
                      </span>
                      <Badge variant={critBadge.variant} size="sm" className="flex items-center gap-1 font-medium">
                        {critBadge.icon}
                        {critBadge.label}
                      </Badge>
                    </div>

                    {(criterion.currentValue !== undefined || criterion.targetValue !== undefined) && (
                      <div className="text-xs text-slate-500 mb-2 font-mono">
                        {criterion.currentValue !== null && (
                          <span>Registrado: <strong>{criterion.currentValue}</strong></span>
                        )}
                        {criterion.targetValue !== null && (
                          <span className="ml-2">| Mínimo: <strong>{criterion.targetValue}</strong></span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {criterion.explanation}
                    </p>
                  </div>

                  {criterion.ruleCitation && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                      Citação: {criterion.ruleCitation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mandatory Non-Repudiation Legal Disclaimer */}
      <div
        data-testid="compliance-legal-disclaimer"
        className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex items-start gap-3"
      >
        <div className="text-slate-500 mt-0.5">
          <AletheiaIcon name="shield" size={18} />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">Aviso Legal Obrigatório:</strong>
          {evaluation.legalDisclaimer}
        </div>
      </div>

      {/* Manual Override Dialog */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Registrar Sobreposição Manual de Conformidade"
        description="Permite que os responsáveis ajustem o status de conformidade indicando justificativa auditada para auto-organização familiar."
      >
        <form onSubmit={handleSubmitOverride} data-testid="override-modal" className="space-y-4">
          {overrideError && (
            <Alert variant="error">
              <p className="text-xs">{overrideError}</p>
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Novo Status de Conformidade
            </label>
            <Select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value as ComplianceEvaluationStatus)}
              options={[
                { value: 'COMPLIANT', label: 'Conforme (COMPLIANT)' },
                { value: 'IN_PROGRESS', label: 'Em Andamento (IN_PROGRESS)' },
                { value: 'NON_COMPLIANT', label: 'Não Conforme (NON_COMPLIANT)' },
                { value: 'REVIEW_NEEDED', label: 'Revisão Necessária (REVIEW_NEEDED)' },
                { value: 'EXEMPT', label: 'Isento (EXEMPT)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justificativa / Rationale Auditada (mínimo 10 caracteres) *
            </label>
            <Textarea
              data-testid="override-reason-input"
              rows={3}
              placeholder="Ex.: Comprovantes complementares arquivados fisicamente; validação em processo junto ao conselho..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              required
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            A sobreposição manual fica vinculada ao usuário autenticado com data e hora. Ela não gera imunidade estatal nem substitui pareceres legais.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
              disabled={overrideSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              data-testid="submit-override-btn"
              variant="primary"
              size="sm"
              disabled={overrideSubmitting}
            >
              {overrideSubmitting ? 'Salvando...' : 'Salvar Sobreposição'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
