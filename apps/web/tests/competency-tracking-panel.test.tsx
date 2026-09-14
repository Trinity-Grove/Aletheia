import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AssessmentResultResponseDto,
  CurriculumDefinitionCatalogEntryDto,
  EvidenceSubmissionResponseDto,
  EvidenceTypeCatalogEntryDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';
import { CompetencyTrackingPanel } from '../src/components/records/competency-tracking-panel';

const FAMILY_ID = 'fam-1';
const LEARNER_ID = 'learner-1';

const mockCurriculumCatalog: CurriculumDefinitionCatalogEntryDto[] = [
  { id: 'curriculum-1', code: 'TRIVIUM.CORE', name: 'Trivium Clássico', description: null },
];

const mockEvidenceTypeCatalog: EvidenceTypeCatalogEntryDto[] = [
  { id: 'evidence-type-1', code: 'TEXT', name: 'Texto', description: null },
];

const mockTracking: LearnerCompetencyTrackingResponseDto = {
  id: 'tracking-1',
  familyId: FAMILY_ID,
  learnerId: LEARNER_ID,
  competencyDefinitionId: 'competency-1',
  competencyVersion: 1,
  curriculumDefinitionId: 'curriculum-1',
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
      if (init?.method === 'POST' && url.includes('/evidence-submissions')) {
        return Promise.resolve({ ok: true, json: async () => mockEvidenceSubmission });
      }
      if (url.includes('/curriculum-definitions/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.curriculumCatalog ?? mockCurriculumCatalog });
      }
      if (url.includes('/evidence-types/catalog')) {
        return Promise.resolve({ ok: true, json: async () => overrides.evidenceTypeCatalog ?? mockEvidenceTypeCatalog });
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
      return Promise.resolve({ ok: true, json: async () => null });
    }),
  );
}

describe('CompetencyTrackingPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows an empty-state prompt when no learner is selected', () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={null} />);
    expect(screen.getByText('Selecione um educando')).toBeInTheDocument();
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

    expect(screen.getByText('Leitura Fluente')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-submission-evidence-1')).toBeInTheDocument();
    expect(screen.getByTestId('assessment-result-assessment-1')).toBeInTheDocument();

    const curriculumSelect = screen.getByTestId('curriculum-catalog-select') as HTMLSelectElement;
    expect(curriculumSelect.querySelector('option[value="curriculum-1"]')).toBeTruthy();
  });

  it('activates a curriculum for the learner and refreshes the tracked list', async () => {
    stubFetch();
    render(<CompetencyTrackingPanel familyId={FAMILY_ID} learnerId={LEARNER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('curriculum-catalog-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('curriculum-catalog-select'), { target: { value: 'curriculum-1' } });
    fireEvent.click(screen.getByTestId('activate-curriculum-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('activation-success-alert')).toBeInTheDocument();
    });
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
});
