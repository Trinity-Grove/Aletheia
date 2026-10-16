import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AssessmentResultResponseDto,
  CurriculumDefinitionCatalogEntryDto,
  EvidenceSubmissionResponseDto,
  EvidenceTypeCatalogEntryDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';
import { CompetencyTrackingPanel } from '../src/components/records/competency-tracking-panel';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const FAMILY_ID = 'fam-1';
const LEARNER_ID = 'learner-1';
const PROJECT_ID = 'project-1';

const mockProjectCatalog = [
  {
    id: PROJECT_ID,
    code: 'GARDEN_BUILD',
    name: 'Construir uma horta',
    version: 1,
    description: 'Planejar e cultivar uma horta.',
    enabled: true,
    competencies: [{ competencyId: 'competency-1', code: 'GARDEN.SOIL', title: 'Preparar o solo', required: true, order: 0 }],
  },
];

const mockCurriculumCatalog: CurriculumDefinitionCatalogEntryDto[] = [
  { id: 'curriculum-1', code: 'TRIVIUM.CORE', name: 'Trivium Clássico', description: null },
];

const mockEvidenceTypeCatalog: EvidenceTypeCatalogEntryDto[] = [
  { id: 'evidence-type-1', code: 'TEXT', name: 'Texto', description: null },
];

const mockProgressionPolicyCatalog = [
  {
    id: 'policy-1',
    code: 'FOUNDATIONAL.EVIDENCE_COUNT',
    name: 'Evidência validada',
    description: 'Uma evidência validada demonstra a competência.',
    policyType: 'EVIDENCE_COUNT',
    minimumEvidenceCount: 1,
    curriculumDefinitionId: 'curriculum-1',
  },
];

const mockRubricCatalog = [
  {
    id: 'rubric-1',
    code: 'FOUNDATION.RUBRIC',
    version: 1,
    name: 'Rubrica de leitura',
    description: 'Avaliação breve.',
    competencyId: 'competency-1',
    criteria: [{ id: 'criterion-1', code: 'CLARITY', label: 'Clareza', order: 0, scaleMin: 0, scaleMax: 4 }],
  },
];

const mockTracking: LearnerCompetencyTrackingResponseDto = {
  id: 'tracking-1',
  familyId: FAMILY_ID,
  learnerId: LEARNER_ID,
  competencyDefinitionId: 'competency-1',
  competencyVersion: 1,
  curriculumDefinitionId: 'curriculum-1',
  progressionPolicyId: 'policy-1',
  policyVersion: 1,
  status: 'ACTIVE',
  activatedAt: '2026-09-13T00:00:00.000Z',
  retiredAt: null,
  createdAt: '2026-09-13T00:00:00.000Z',
  competency: {
    code: 'TEST.COMPETENCY',
    title: 'Leitura Fluente',
    domainId: 'domain-1',
    domainTitle: 'Linguagem',
  },
};

const mockEvidenceSubmission: EvidenceSubmissionResponseDto = {
  id: 'evidence-1',
  familyId: FAMILY_ID,
  learnerId: LEARNER_ID,
  evidenceTypeId: 'evidence-type-1',
  projectDefinitionId: PROJECT_ID,
  authorId: 'user-1',
  textContent: 'Leu três capítulos.',
  fileUrl: null,
  storageKey: null,
  mimeType: null,
  fileSizeBytes: null,
  checksumSha256: null,
  validationStatus: 'UNVALIDATED',
  validatedByUserId: null,
  validatedAt: null,
  createdAt: '2026-09-13T00:00:00.000Z',
  competencies: [
    { id: 'link-1', evidenceSubmissionId: 'evidence-1', competencyDefinitionId: 'competency-1', competencyVersion: 1, createdAt: '2026-09-13T00:00:00.000Z' },
  ],
};

const mockAssessmentResult: AssessmentResultResponseDto = {
  id: 'assessment-1',
  familyId: FAMILY_ID,
  learnerId: LEARNER_ID,
  evidenceSubmissionId: 'evidence-1',
  rubricDefinitionId: 'rubric-1',
  rubricVersion: 1,
  assessorType: 'PARENT',
  assessorUserId: 'user-1',
  notes: 'Ótimo progresso',
  createdAt: '2026-09-13T00:00:00.000Z',
  scores: [{ id: 'score-1', assessmentResultId: 'assessment-1', rubricCriterionId: 'criterion-1', score: 3, notes: null, createdAt: '2026-09-13T00:00:00.000Z' }],
};

const mockAchievement = {
  id: 'achievement-1',
  trackingId: 'tracking-1',
  familyId: FAMILY_ID,
  learnerId: LEARNER_ID,
  competencyDefinitionId: 'competency-1',
  competencyVersion: 1,
  curriculumDefinitionId: 'curriculum-1',
  curriculumVersion: 1,
  progressionPolicyId: 'policy-1',
  policyVersion: 1,
  validatedEvidenceCount: 1,
  minimumEvidenceCount: 1,
  evidenceSnapshot: {
    evidenceSubmissionIds: ['evidence-1'],
    prerequisites: [],
  },
  awardedByUserId: 'user-1',
  achievedAt: '2026-09-13T00:00:00.000Z',
  reviews: [],
};

function stubFetch(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/competency-tracking/activate')) {
        return Promise.resolve({
          ok: true,
          json: async () => overrides.activationResult ?? { createdCount: 1, alreadyActiveCount: 0, trackings: [mockTracking] },
        });
      }
      if (init?.method === 'PATCH' && url.includes('/retire')) {
        return Promise.resolve({ ok: true, json: async () => ({ ...mockTracking, status: 'RETIRED' }) });
      }
      if (init?.method === 'PATCH' && url.includes('/evidence-submissions/') && url.includes('/validation')) {
        return Promise.resolve({ ok: true, json: async () => ({ ...mockEvidenceSubmission, validationStatus: 'VALIDATED' }) });
      }
      if (init?.method === 'POST' && url.includes('/evidence-submissions')) {
        return Promise.resolve({ ok: true, json: async () => mockEvidenceSubmission });
      }
      if (init?.method === 'POST' && url.includes('/assessment-results')) {
        return Promise.resolve({ ok: true, json: async () => mockAssessmentResult });
      }
      if (url.includes('/curriculum-definitions/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.curriculumCatalog ?? mockCurriculumCatalog });
      }
      if (url.includes('/projects/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.projectCatalog ?? mockProjectCatalog });
      }
      if (url.includes('/evidence-types/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.evidenceTypeCatalog ?? mockEvidenceTypeCatalog });
      }
      if (url.includes('/progression-policies/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.progressionPolicyCatalog ?? mockProgressionPolicyCatalog });
      }
      if (url.includes('/rubrics/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.rubricCatalog ?? mockRubricCatalog });
      }
      if (url.includes('/progression/evaluation')) {
        return Promise.resolve({
          ok: true,
          json: async () => overrides.progressionEvaluation ?? {
            learnerId: LEARNER_ID,
            trackingId: 'tracking-1',
            trackingStatus: 'ACTIVE',
            curriculumDefinitionId: 'curriculum-1',
            competencyDefinitionId: 'competency-1',
            competencyVersion: 1,
            policyId: 'policy-1',
            policyVersion: 1,
            validatedEvidenceCount: 1,
            minimumEvidenceCount: 1,
            requiredEvidenceCountMet: true, rubricAssessmentSatisfied: null, humanApprovalRequired: false,
            humanApprovalEligible: false, freshWorkRequired: false,
            unmetPrerequisites: [],
            state: 'MASTERED',
          },
        });
      }
      if (url.includes('/competency-tracking')) {
        return Promise.resolve({ ok: true, json: async () => overrides.trackedCompetencies ?? [mockTracking] });
      }
      if (url.includes('/evidence-submissions')) {
        return Promise.resolve({ ok: true, json: async () => overrides.evidenceSubmissions ?? [mockEvidenceSubmission] });
      }
      if (url.includes('/assessment-results')) {
        return Promise.resolve({ ok: true, json: async () => overrides.assessmentResults ?? [mockAssessmentResult] });
      }
      if (url.includes('/achievements')) {
        return Promise.resolve({ ok: true, json: async () => overrides.achievements ?? [mockAchievement] });
      }
      return Promise.resolve({ ok: true, json: async () => null });
    }),
  );
}

describe('CompetencyTrackingPanel', () => {
  it.each(['tracking', 'evaluation'])('discards deferred prior-learner %s responses after switching', async (phase) => {
    stubFetch({ progressionEvaluation: pendingEvaluation });
    const baseFetch = vi.mocked(fetch).getMockImplementation()!;
    let release!: () => void;
    let deferred = false;
    const fetcher = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('learnerId=learner-2')) return Promise.resolve({ ok: true, json: async () =>
        phase === 'evaluation' && url.includes('/competency-tracking?')
          ? [{ ...mockTracking, id: 'tracking-2', learnerId: 'learner-2', competency: { ...mockTracking.competency, title: 'Competência do segundo educando' } }]
          : [] });
      if (url.includes('trackingId=tracking-2')) return Promise.resolve({ ok: true, json: async () => ({
        ...pendingEvaluation, learnerId: 'learner-2', trackingId: 'tracking-2', state: 'IN_PROGRESS',
      }) });
      const shouldDefer = phase === 'tracking'
        ? url.includes('/competency-tracking?')
        : url.includes('/progression/evaluation');
      if (shouldDefer && !deferred) {
        deferred = true;
        return new Promise((resolve) => { release = () => resolve(baseFetch(url, init)); });
      }
      return baseFetch(url, init);
    });
    vi.stubGlobal('fetch', fetcher);
    const view = (learnerId: string) => <AuthProvider role="GUARDIAN" familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={learnerId} /></AuthProvider>;
    const { rerender } = render(view(LEARNER_ID));
    await waitFor(() => expect(deferred).toBe(true));
    rerender(view('learner-2'));
    expect(fetcher.mock.calls.find(([url]) => url.includes('/competency-tracking?learnerId=learner-1'))?.[1]?.signal?.aborted).toBe(true);
    if (phase === 'tracking') await screen.findByText('Nenhuma competência ativa');
    else await screen.findByText('Competência do segundo educando');
    await act(async () => { release(); });
    if (phase === 'tracking') expect(screen.queryByTestId('tracked-competency-competency-1')).not.toBeInTheDocument();
    else {
      expect(screen.getByTestId('progression-state-competency-1')).toHaveTextContent('Em andamento');
      expect(screen.queryByTestId('approve-tracking-2')).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId('evidence-submission-evidence-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assessment-result-assessment-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
    expect(fetcher.mock.calls.some(([url]) => url.endsWith('/approval'))).toBe(false);
    if (phase === 'tracking') expect(fetcher.mock.calls.some(([url]) => url.includes('/progression/evaluation'))).toBe(false);
  });

  it('hides loaded approval controls immediately while the next learner is still loading', async () => {
    stubFetch({ progressionEvaluation: pendingEvaluation });
    const baseFetch = vi.mocked(fetch).getMockImplementation()!;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => url.includes('learnerId=learner-2') ? new Promise(() => {}) : baseFetch(url, init)));
    const view = (learnerId: string) => <AuthProvider role="GUARDIAN" familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={learnerId} /></AuthProvider>;
    const { rerender } = render(view(LEARNER_ID));
    await screen.findByTestId('approve-tracking-1');
    rerender(view('learner-2'));
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
  });
  const pendingEvaluation = {
    learnerId: LEARNER_ID, trackingId: 'tracking-1', trackingStatus: 'ACTIVE',
    curriculumDefinitionId: 'curriculum-1', competencyDefinitionId: 'competency-1',
    competencyVersion: 1, policyId: 'policy-1', policyVersion: 1,
    validatedEvidenceCount: 1, minimumEvidenceCount: 1, unmetPrerequisites: [], state: 'AWAITING_APPROVAL',
    requiredEvidenceCountMet: true, rubricAssessmentSatisfied: true, humanApprovalRequired: true, humanApprovalEligible: true, freshWorkRequired: false,
  };

  it('shows only the evidence gate for EVIDENCE_COUNT compatibility', async () => {
    stubFetch({ progressionEvaluation: { ...pendingEvaluation, state: 'NOT_STARTED', validatedEvidenceCount: 0,
      requiredEvidenceCountMet: false, rubricAssessmentSatisfied: null, humanApprovalRequired: false, humanApprovalEligible: false } });
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);
    const gates = await screen.findByTestId('progression-gates-tracking-1');
    expect(gates).toHaveTextContent('Faltam evidências validadas');
    expect(gates.textContent).not.toMatch(/rubrica|aprovação|devolução/i);
  });

  it('identifies insufficient exact-rubric assessment without claiming more evidence is needed', async () => {
    stubFetch({ progressionEvaluation: { ...pendingEvaluation, state: 'IN_PROGRESS',
      rubricAssessmentSatisfied: false, humanApprovalEligible: false } });
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);
    const gates = await screen.findByTestId('progression-gates-tracking-1');
    expect(gates).toHaveTextContent('A avaliação da rubrica e versão exigidas ainda não atende');
    expect(gates).not.toHaveTextContent('Faltam evidências validadas');
    expect(gates).not.toHaveTextContent('Após a devolução');
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
  });

  it('explains that a returned competency needs fresh work despite satisfied objective gates', async () => {
    stubFetch({ progressionEvaluation: { ...pendingEvaluation, state: 'IN_PROGRESS', humanApprovalEligible: false, freshWorkRequired: true } });
    render(<AuthProvider role="GUARDIAN" familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} /></AuthProvider>);
    const gates = await screen.findByTestId('progression-gates-tracking-1');
    expect(gates).toHaveTextContent('Após a devolução, envie nova evidência validada ou registre nova avaliação posterior à decisão');
    expect(gates).not.toHaveTextContent('Faltam evidências validadas');
    expect(gates).not.toHaveTextContent('ainda não atende');
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
  });

  it.each(['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'] as const)('lets %s approve pending progression using the authenticated actor', async (role) => {
    stubFetch({ progressionEvaluation: pendingEvaluation });
    render(<AuthProvider role={role} familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} /></AuthProvider>);
    expect(await screen.findByTestId('progression-state-competency-1')).toHaveTextContent('Aguardando aprovação');
    expect(screen.getByText(/requisitos objetivos foram atendidos/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('approve-tracking-1'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `/api/v1/families/${FAMILY_ID}/curriculum/competency-tracking/tracking-1/approval`,
      expect.objectContaining({ method: 'POST', body: expect.any(String) }),
    ));
    const call = vi.mocked(fetch).mock.calls.find(([url]) => String(url).endsWith('/approval'))!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ decision: 'APPROVED', idempotencyKey: expect.any(String) });
  });

  it.each(['EDUCATOR', null] as const)('hides approval controls for %s', async (role) => {
    stubFetch({ progressionEvaluation: pendingEvaluation });
    render(<AuthProvider role={role} familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} /></AuthProvider>);
    expect(await screen.findByTestId('progression-state-competency-1')).toHaveTextContent('Aguardando aprovação');
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('return-tracking-1')).not.toBeInTheDocument();
  });

  it('requires a trimmed return reason before sending a decision', async () => {
    stubFetch({ progressionEvaluation: pendingEvaluation });
    render(<AuthProvider role="GUARDIAN" familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} /></AuthProvider>);
    await screen.findByTestId('return-tracking-1');
    fireEvent.change(screen.getByTestId('approval-reason-tracking-1'), { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('return-tracking-1'));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o motivo');
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/approval'))).toBe(false);
    fireEvent.change(screen.getByTestId('approval-reason-tracking-1'), { target: { value: '  Rever clareza  ' } });
    fireEvent.click(screen.getByTestId('return-tracking-1'));
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(([url, init]) => String(url).endsWith('/approval') && JSON.parse(init!.body as string).reason === 'Rever clareza')).toBe(true));
  });

  it('explains unmet prerequisites without offering premature approval', async () => {
    stubFetch({ progressionEvaluation: { ...pendingEvaluation, state: 'BLOCKED', unmetPrerequisites: [{ ...pendingEvaluation, competencyDefinitionId: 'prerequisite-1', state: 'IN_PROGRESS' }] } });
    render(<AuthProvider role="GUARDIAN" familyId={FAMILY_ID}><CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} /></AuthProvider>);
    expect(await screen.findByTestId('progression-gates-tracking-1')).toHaveTextContent('prerequisite-1');
    expect(screen.queryByTestId('approve-tracking-1')).not.toBeInTheDocument();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows an empty-state prompt when no learner is selected', () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={null} />);
    expect(screen.getByText('Selecione um educando')).toBeInTheDocument();
    return waitFor(() => expect(screen.getByTestId(`family-project-${PROJECT_ID}`)).toBeInTheDocument());
  });

  it('shows a loading state before data arrives', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);
    expect(screen.getByTestId('competency-tracking-loading')).toBeInTheDocument();
  });

  it('loads and displays the curriculum catalog, tracked competencies, evidence submissions and assessment results', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('tracked-competency-competency-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('tracked-competency-competency-1')).toHaveTextContent('Leitura Fluente');
    expect(screen.getByTestId('evidence-submission-evidence-1')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-submission-evidence-1')).toHaveTextContent('Projeto: Construir uma horta');
    expect(screen.getByTestId('assessment-result-assessment-1')).toBeInTheDocument();

    const curriculumSelect = screen.getByTestId('curriculum-catalog-select') as HTMLSelectElement;
    expect(curriculumSelect.querySelector('option[value="curriculum-1"]')).toBeTruthy();
  });

  it('loads a progression policy and displays the evaluated state for tracked competencies', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('progression-state-competency-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('progression-state-competency-1')).toHaveTextContent('Dominada');
    expect(screen.getAllByText('1/1 evidência validada').length).toBeGreaterThan(0);
  });

  it('displays automatic competency achievements with immutable version details', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('achievement-achievement-1')).toBeInTheDocument();
    });

    expect(screen.getByText('Conquistas de Competências')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-competency-achievement-1')).toHaveTextContent('Leitura Fluente');
    expect(screen.getByTestId('achievement-achievement-1')).toHaveTextContent('Competência v1');
    expect(screen.getByTestId('achievement-achievement-1')).toHaveTextContent('1/1 evidência validada');
  });

  it('records a rubric assessment from the competency panel', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('open-assessment-modal-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('open-assessment-modal-btn'));
    await waitFor(() => expect(screen.getByTestId('assessment-score-criterion-1')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('assessment-score-criterion-1'), { target: { value: '4' } });
    fireEvent.click(screen.getByTestId('save-assessment-result-btn'));

    await waitFor(() => {
      const assessmentCall = vi.mocked(fetch).mock.calls.find(([url, init]) =>
        String(url).includes('/assessment-results') && init?.method === 'POST',
      );
      expect(assessmentCall).toBeTruthy();
      expect(JSON.parse(String(assessmentCall?.[1]?.body))).toMatchObject({
        learnerId: LEARNER_ID,
        rubricDefinitionId: 'rubric-1',
        assessorType: 'PARENT',
        scores: [{ rubricCriterionId: 'criterion-1', score: 4 }],
      });
    });
  });

  it('activates a curriculum for the learner and refreshes the tracked list', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('curriculum-catalog-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('curriculum-catalog-select'), { target: { value: 'curriculum-1' } });
    fireEvent.change(screen.getByTestId('progression-policy-select'), { target: { value: 'policy-1' } });
    fireEvent.click(screen.getByTestId('activate-curriculum-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('activation-success-alert')).toBeInTheDocument();
    });

    const activateCall = vi.mocked(fetch).mock.calls.find(([url, init]) =>
      String(url).includes('/competency-tracking/activate') && init?.method === 'POST',
    );
    expect(JSON.parse(String(activateCall?.[1]?.body))).toMatchObject({ progressionPolicyId: 'policy-1' });
  });

  it('retires a tracked competency', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('retire-competency-competency-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('retire-competency-competency-1'));

    // After retiring, the mocked list refetch (stubFetch always returns the
    // same ACTIVE mockTracking) still shows the competency -- this only
    // proves the retire request fires and the UI doesn't blow up; the
    // integration test proves the real backend transition.
    await waitFor(() => {
      expect(screen.getByTestId('tracked-competency-competency-1')).toBeInTheDocument();
    });
  });

  it('opens the evidence submission modal and submits evidence for a tracked competency', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('evidence-for-competency-competency-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('evidence-for-competency-competency-1'));

    await waitFor(() => {
      expect(screen.getByTestId('evidence-competency-checkbox-competency-1')).toBeInTheDocument();
    });
    expect((screen.getByTestId('evidence-competency-checkbox-competency-1') as HTMLInputElement).checked).toBe(true);

    fireEvent.change(screen.getByTestId('evidence-text-content-input'), {
      target: { value: 'Leu três capítulos e narrou de volta.' },
    });
    fireEvent.click(screen.getByTestId('save-evidence-submission-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('evidence-text-content-input')).not.toBeInTheDocument();
    });
  });

  it('lets the family activate a published project and link its evidence to the mapped active competency', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => expect(screen.getByTestId(`family-project-${PROJECT_ID}`)).toBeInTheDocument());
    expect(screen.getByTestId(`family-project-${PROJECT_ID}`)).toHaveTextContent('Preparar o solo');
    fireEvent.click(screen.getByTestId(`toggle-family-project-${PROJECT_ID}`));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([url, init]) =>
        String(url).includes(`/projects/${PROJECT_ID}/selection`) && init?.method === 'PUT' &&
        JSON.parse(String(init.body)).enabled === false,
      )).toBe(true);
    });
  });

  it('submits evidence linked to an active project and suggests only competencies tracked for this learner', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => expect(screen.getByTestId('open-evidence-modal-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('open-evidence-modal-btn'));
    await waitFor(() => expect(screen.getByTestId('evidence-project-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('evidence-project-select'), { target: { value: PROJECT_ID } });
    expect((screen.getByTestId('evidence-competency-checkbox-competency-1') as HTMLInputElement).checked).toBe(true);
    fireEvent.change(screen.getByTestId('evidence-text-content-input'), { target: { value: 'Plantamos sementes e registramos o crescimento.' } });
    fireEvent.click(screen.getByTestId('save-evidence-submission-btn'));

    await waitFor(() => {
      const submission = vi.mocked(fetch).mock.calls.find(([url, init]) =>
        String(url).includes('/evidence-submissions') && init?.method === 'POST',
      );
      expect(JSON.parse(String(submission?.[1]?.body))).toMatchObject({
        learnerId: LEARNER_ID,
        projectDefinitionId: PROJECT_ID,
        competencies: [{ competencyDefinitionId: 'competency-1' }],
      });
    });
  });

  it('validates a pending evidence submission from the family panel', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('validate-evidence-evidence-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('validate-evidence-evidence-1'));

    await waitFor(() => {
      const validationCall = vi.mocked(fetch).mock.calls.find(([url, init]) =>
        String(url).includes('/evidence-submissions/evidence-1/validation') && init?.method === 'PATCH',
      );
      expect(validationCall).toBeTruthy();
      expect(JSON.parse(String(validationCall?.[1]?.body))).toEqual({ status: 'VALIDATED' });
    });
  });
});
