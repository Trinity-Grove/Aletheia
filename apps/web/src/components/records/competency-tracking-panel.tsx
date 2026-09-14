'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState, Select } from '@aletheia/ui';
import type {
  AssessmentResultResponseDto,
  CurriculumDefinitionCatalogEntryDto,
  EvidenceSubmissionResponseDto,
  EvidenceTypeCatalogEntryDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';
import { EvidenceSubmissionModal, type EvidenceSubmissionFormValues } from './evidence-submission-modal';

export interface CompetencyTrackingPanelProps {
  familyId: string;
  learnerId: string | null;
}

// Family-facing competency tracking UI (issue #126 item 3): activates a
// CurriculumDefinition for the active learner, lists the resulting
// tracked competencies, and lets a family submit evidence / see
// assessment results against them -- using the already-built,
// already-tested EvidenceSubmission/AssessmentResult API from Fase 2.
//
// This is the successor path to the old "apply a template creates
// Subjects+LearningObjectives" flow. It is deliberately additive: it does
// not call or replace applyTemplate, and it lives alongside (not instead
// of) the existing Diario de Aprendizagem tab on this same page -- the
// human's explicit instruction is that hiding/retiring that old flow is a
// separate, human-reviewed step, not bundled into this PR.
export function CompetencyTrackingPanel({ familyId, learnerId }: CompetencyTrackingPanelProps) {
  const [curriculumCatalog, setCurriculumCatalog] = useState<CurriculumDefinitionCatalogEntryDto[]>([]);
  const [evidenceTypeCatalog, setEvidenceTypeCatalog] = useState<EvidenceTypeCatalogEntryDto[]>([]);
  const [trackedCompetencies, setTrackedCompetencies] = useState<LearnerCompetencyTrackingResponseDto[]>([]);
  const [evidenceSubmissions, setEvidenceSubmissions] = useState<EvidenceSubmissionResponseDto[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceModalInitialCompetencyId, setEvidenceModalInitialCompetencyId] = useState<string | null>(null);

  const loadCatalogs = useCallback(async () => {
    const [curriculumRes, evidenceTypeRes] = await Promise.all([
      fetch(`/api/v1/families/${familyId}/curriculum/curriculum-definitions/catalog`, { credentials: 'include' }),
      fetch(`/api/v1/families/${familyId}/curriculum/evidence-types/catalog`, { credentials: 'include' }),
    ]);
    if (curriculumRes.ok) setCurriculumCatalog(await curriculumRes.json());
    if (evidenceTypeRes.ok) setEvidenceTypeCatalog(await evidenceTypeRes.json());
  }, [familyId]);

  const loadLearnerData = useCallback(async () => {
    if (!learnerId) {
      setTrackedCompetencies([]);
      setEvidenceSubmissions([]);
      setAssessmentResults([]);
      return;
    }
    const [trackingRes, evidenceRes, assessmentRes] = await Promise.all([
      fetch(`/api/v1/families/${familyId}/curriculum/competency-tracking?learnerId=${learnerId}`, {
        credentials: 'include',
      }),
      fetch(`/api/v1/families/${familyId}/curriculum/evidence-submissions?learnerId=${learnerId}`, {
        credentials: 'include',
      }),
      fetch(`/api/v1/families/${familyId}/curriculum/assessment-results?learnerId=${learnerId}`, {
        credentials: 'include',
      }),
    ]);
    if (trackingRes.ok) setTrackedCompetencies(await trackingRes.json());
    if (evidenceRes.ok) setEvidenceSubmissions(await evidenceRes.json());
    if (assessmentRes.ok) setAssessmentResults(await assessmentRes.json());
  }, [familyId, learnerId]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      try {
        await Promise.all([loadCatalogs(), loadLearnerData()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [loadCatalogs, loadLearnerData]);

  const handleActivate = async () => {
    if (!learnerId || !selectedCurriculumId) return;
    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/competency-tracking/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ learnerId, curriculumDefinitionId: selectedCurriculumId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao ativar currículo.');
      }
      const result = await res.json();
      setActivationSuccess(
        result.createdCount > 0
          ? `${result.createdCount} competência(s) ativada(s) para acompanhamento.`
          : 'Este currículo já estava totalmente ativo para este educando.',
      );
      await loadLearnerData();
    } catch (err) {
      setActivationError(err instanceof Error ? err.message : 'Falha ao ativar currículo.');
    } finally {
      setActivating(false);
    }
  };

  const handleRetire = async (trackingId: string) => {
    try {
      const res = await fetch(
        `/api/v1/families/${familyId}/curriculum/competency-tracking/${trackingId}/retire`,
        { method: 'PATCH', credentials: 'include' },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao retirar competência.');
      }
      await loadLearnerData();
    } catch {
      // Silently ignore -- the row simply stays as-is if this fails; no
      // destructive side effect to worry about.
    }
  };

  const handleOpenEvidenceModal = (competencyDefinitionId?: string) => {
    setEvidenceModalInitialCompetencyId(competencyDefinitionId ?? null);
    setIsEvidenceModalOpen(true);
  };

  const handleSaveEvidence = async (dto: EvidenceSubmissionFormValues) => {
    if (!learnerId) throw new Error('Selecione um educando primeiro.');
    const res = await fetch(`/api/v1/families/${familyId}/curriculum/evidence-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...dto, learnerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao enviar evidência.');
    }
    await loadLearnerData();
  };

  if (!learnerId) {
    return (
      <Card style={{ padding: '1.75rem' }}>
        <EmptyState
          title="Selecione um educando"
          description="Escolha um educando para ativar currículos e acompanhar competências."
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card data-testid="competency-tracking-loading" style={{ padding: '1.75rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Carregando competências...</div>
      </Card>
    );
  }

  const activeTrackings = trackedCompetencies.filter((t) => t.status === 'ACTIVE');
  const retiredTrackings = trackedCompetencies.filter((t) => t.status === 'RETIRED');

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Card data-testid="activate-curriculum-card" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Ativar Currículo
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Ativar um currículo publicado cria o conjunto de competências que este educando vai acompanhar. Pode ser
            repetido sem duplicar -- competências já ativas simplesmente permanecem como estão.
          </p>
        </div>

        {activationSuccess && (
          <Alert variant="success" data-testid="activation-success-alert" style={{ marginBottom: '1.25rem' }}>
            {activationSuccess}
          </Alert>
        )}
        {activationError && (
          <Alert variant="error" data-testid="activation-error-alert" style={{ marginBottom: '1.25rem' }}>
            {activationError}
          </Alert>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <Select
              label="Currículo Publicado"
              data-testid="curriculum-catalog-select"
              value={selectedCurriculumId}
              onChange={(e) => setSelectedCurriculumId(e.target.value)}
              disabled={activating || curriculumCatalog.length === 0}
              options={[
                { value: '', label: curriculumCatalog.length === 0 ? 'Nenhum currículo publicado' : 'Selecione...' },
                ...curriculumCatalog.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Button
            type="button"
            data-testid="activate-curriculum-btn"
            onClick={handleActivate}
            isLoading={activating}
            disabled={!selectedCurriculumId}
          >
            Ativar
          </Button>
        </div>
      </Card>

      <Card data-testid="tracked-competencies-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Competências Acompanhadas
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              O conjunto de trabalho deste educando, vindo dos currículos ativados.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            data-testid="open-evidence-modal-btn"
            onClick={() => handleOpenEvidenceModal()}
            disabled={activeTrackings.length === 0}
          >
            Enviar Evidência
          </Button>
        </div>

        {activeTrackings.length === 0 ? (
          <EmptyState
            title="Nenhuma competência ativa"
            description="Ative um currículo publicado acima para começar a acompanhar competências para este educando."
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.625rem' }} data-testid="active-competency-list">
            {activeTrackings.map((tracking) => (
              <div
                key={tracking.id}
                data-testid={`tracked-competency-${tracking.competencyDefinitionId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {tracking.competency.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {tracking.competency.domainTitle} -- v{tracking.competencyVersion}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Badge variant="emerald" data-testid={`tracked-competency-status-${tracking.competencyDefinitionId}`}>
                    Ativa
                  </Badge>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    data-testid={`evidence-for-competency-${tracking.competencyDefinitionId}`}
                    onClick={() => handleOpenEvidenceModal(tracking.competencyDefinitionId)}
                  >
                    Enviar Evidência
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    data-testid={`retire-competency-${tracking.competencyDefinitionId}`}
                    onClick={() => handleRetire(tracking.id)}
                  >
                    Retirar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {retiredTrackings.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Competências Retiradas
            </div>
            <div style={{ display: 'grid', gap: '0.375rem' }} data-testid="retired-competency-list">
              {retiredTrackings.map((tracking) => (
                <div key={tracking.id} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {tracking.competency.title} ({tracking.competency.domainTitle})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card data-testid="evidence-submissions-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.25rem 0' }}>
          Evidências Enviadas
        </h2>
        {evidenceSubmissions.length === 0 ? (
          <EmptyState
            title="Nenhuma evidência enviada"
            description="Evidências enviadas para as competências acompanhadas aparecerão aqui."
          />
        ) : (
          <div style={{ display: 'grid', gap: '0.625rem' }} data-testid="evidence-submission-list">
            {evidenceSubmissions.map((submission) => (
              <div
                key={submission.id}
                data-testid={`evidence-submission-${submission.id}`}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {submission.textContent || submission.fileUrl || 'Evidência sem descrição'}
                  </span>
                  <Badge
                    variant={
                      submission.validationStatus === 'VALIDATED'
                        ? 'emerald'
                        : submission.validationStatus === 'REJECTED'
                          ? 'rose'
                          : 'slate'
                    }
                  >
                    {submission.validationStatus === 'VALIDATED'
                      ? 'Validada'
                      : submission.validationStatus === 'REJECTED'
                        ? 'Rejeitada'
                        : 'Aguardando validação'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {submission.competencies.length} competência(s) vinculada(s) --{' '}
                  {new Date(submission.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {assessmentResults.length > 0 && (
        <Card data-testid="assessment-results-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.25rem 0' }}>
            Avaliações
          </h2>
          <div style={{ display: 'grid', gap: '0.625rem' }} data-testid="assessment-result-list">
            {assessmentResults.map((result) => {
              const average =
                result.scores.length > 0
                  ? result.scores.reduce((sum, s) => sum + s.score, 0) / result.scores.length
                  : null;
              return (
                <div
                  key={result.id}
                  data-testid={`assessment-result-${result.id}`}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Avaliação ({result.assessorType}) {average !== null ? `-- média ${average.toFixed(1)}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {new Date(result.createdAt).toLocaleDateString('pt-BR')}
                    {result.notes ? ` -- ${result.notes}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <EvidenceSubmissionModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        onSave={handleSaveEvidence}
        evidenceTypeCatalog={evidenceTypeCatalog}
        trackedCompetencies={trackedCompetencies}
        initialCompetencyDefinitionId={evidenceModalInitialCompetencyId}
      />
    </div>
  );
}
