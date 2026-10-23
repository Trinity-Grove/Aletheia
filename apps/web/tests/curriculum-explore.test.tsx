import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AcademicYearResponseDto,
  LearnerSummaryDto,
  LearningPathExplorerCatalogEntryDto,
  PedagogicalModelCatalogEntryDto,
} from '@aletheia/contracts';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { CurriculumExploreGallery } from '../src/components/curriculum/curriculum-explore-gallery';

const learner: LearnerSummaryDto = {
  id: 'learner-1',
  firstName: 'Clara',
  lastName: 'Silva',
  preferredName: 'Clarinha',
  stage: 'PRIMARY',
  avatarColor: '#3B82F6',
};

const learnerTwo: LearnerSummaryDto = {
  ...learner,
  id: 'learner-2',
  firstName: 'Davi',
  preferredName: 'Davi',
};

const year: AcademicYearResponseDto = {
  id: 'year-2026',
  familyId: 'family-1',
  year: 2026,
  title: 'Ano Letivo 2026',
  isCurrent: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const otherYear: AcademicYearResponseDto = {
  ...year,
  id: 'year-2027',
  year: 2027,
  title: 'Ano Letivo 2027',
  isCurrent: false,
};

const catalog: PedagogicalModelCatalogEntryDto[] = [
  {
    code: 'MONTESSORI',
    name: 'Montessori',
    description: 'Autonomia e experiência concreta.',
    approach: 'MONTESSORI',
    recommendedAgeRange: { min: 3, max: 12 },
    educationalStages: ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY'],
  },
  {
    code: 'PROJECT_BASED',
    name: 'Aprendizagem por Projetos',
    description: 'Projetos reais conduzem o aprendizado.',
    approach: 'PROJECT_BASED',
    recommendedAgeRange: { min: 10, max: 18 },
    educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
];

const triviumPaths: LearningPathExplorerCatalogEntryDto[] = [
  {
    id: 'path-grammar',
    code: 'TRIVIUM.GRAMMAR',
    version: 1,
    name: 'Gramática',
    description: 'Descrição da trilha em português.',
    metadata: { ageRecommendation: { min: 6, max: 11 }, educationalStages: ['EARLY_YEARS', 'PRIMARY'] },
    selected: false,
    competencies: [{ code: 'TRIVIUM.GRAMMAR.CLOSE_READING', title: 'Leitura atenta', level: 1, metadata: { starterObjectives: ['Objetivo em português.'] } }],
  },
  {
    id: 'path-logic',
    code: 'TRIVIUM.LOGIC',
    version: 1,
    name: 'Lógica',
    description: 'Descrição da trilha em português.',
    metadata: { ageRecommendation: { min: 10, max: 15 }, educationalStages: ['PRIMARY', 'LOWER_SECONDARY'] },
    selected: false,
    competencies: [{ code: 'TRIVIUM.LOGIC.REASONING', title: 'Relações e conclusões', level: 1, metadata: { starterObjectives: ['Objetivo em português.'] } }],
  },
  {
    id: 'path-rhetoric',
    code: 'TRIVIUM.RHETORIC',
    version: 1,
    name: 'Retórica',
    description: 'Descrição da trilha em português.',
    metadata: { ageRecommendation: { min: 13, max: 18 }, educationalStages: ['LOWER_SECONDARY', 'UPPER_SECONDARY'] },
    selected: false,
    competencies: [{ code: 'TRIVIUM.RHETORIC.COMPOSITION', title: 'Composição e argumentação', level: 1, metadata: { starterObjectives: ['Objetivo em português.'] } }],
  },
];

function mockCatalogResponse(entries = catalog) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => entries,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderGallery(overrides: Partial<React.ComponentProps<typeof CurriculumExploreGallery>> = {}) {
  return render(
    <AuthProvider initialRole="OWNER_GUARDIAN">
      <CurriculumExploreGallery
        familyId="family-1"
        learners={[learner]}
        academicYears={[year]}
        {...overrides}
      />
    </AuthProvider>,
  );
}

describe('CurriculumExploreGallery', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads and renders published curriculum trails', async () => {
    mockCatalogResponse();

    renderGallery();

    expect(await screen.findByTestId('curriculum-trail-card-MONTESSORI')).toBeInTheDocument();
    expect(screen.getByTestId('curriculum-trail-card-PROJECT_BASED')).toBeInTheDocument();
  });

  it('filters trails by approach and age-range intersection', async () => {
    mockCatalogResponse();

    renderGallery();
    await screen.findByTestId('curriculum-trail-card-MONTESSORI');

    fireEvent.change(screen.getByTestId('curriculum-explore-approach-filter'), {
      target: { value: 'MONTESSORI' },
    });
    expect(screen.getByTestId('curriculum-trail-card-MONTESSORI')).toBeInTheDocument();
    expect(screen.queryByTestId('curriculum-trail-card-PROJECT_BASED')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('curriculum-explore-approach-filter'), {
      target: { value: 'all' },
    });
    fireEvent.change(screen.getByTestId('curriculum-explore-age-filter'), {
      target: { value: '8' },
    });
    expect(screen.getByTestId('curriculum-trail-card-MONTESSORI')).toBeInTheDocument();
    expect(screen.queryByTestId('curriculum-trail-card-PROJECT_BASED')).not.toBeInTheDocument();
  });

  it('adopts a trail for the selected learner and academic year', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subjectsCount: 2, objectivesCount: 3, reusedObjectivesCount: 1 }),
    });
    const onAdopt = vi.fn();

    renderGallery({ onAdopt });
    await screen.findByTestId('adopt-trail-MONTESSORI');
    fireEvent.click(screen.getByTestId('adopt-trail-MONTESSORI'));

    await waitFor(() => expect(onAdopt).toHaveBeenCalledWith('MONTESSORI'));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/templates/apply',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ learnerId: 'learner-1', academicYearId: 'year-2026', template: 'MONTESSORI' }),
      }),
    );
    expect(screen.getByTestId('curriculum-explore-adoption-success')).toBeInTheDocument();
    expect(screen.getByTestId('curriculum-explore-adoption-success')).toHaveTextContent('1');
  });

  it('shows an adoption error and remains usable when the API rejects the request', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Falha controlada' }) });

    renderGallery();
    await screen.findByTestId('adopt-trail-MONTESSORI');
    fireEvent.click(screen.getByTestId('adopt-trail-MONTESSORI'));

    await waitFor(() => expect(screen.getByTestId('curriculum-explore-adoption-error')).toBeInTheDocument());
    expect(screen.getByTestId('adopt-trail-MONTESSORI')).toBeEnabled();
  });

  it('asks for learner and academic-year context before adopting', async () => {
    mockCatalogResponse();

    renderGallery({ learners: [], academicYears: [] });
    await screen.findByTestId('adopt-trail-MONTESSORI');
    fireEvent.click(screen.getByTestId('adopt-trail-MONTESSORI'));

    expect(screen.getByTestId('curriculum-explore-selection-error')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('loads the Trivium catalog for the selected learner and year', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => triviumPaths });

    renderGallery();
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));

    expect(await screen.findByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).toBeInTheDocument();
    expect(screen.getByTestId('curriculum-path-card-TRIVIUM.LOGIC')).toBeInTheDocument();
    expect(screen.getByTestId('curriculum-path-card-TRIVIUM.RHETORIC')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/paths/catalog?learnerId=learner-1&academicYearId=year-2026',
      { credentials: 'include' },
    );
    expect(screen.getByText('Leitura atenta')).toBeInTheDocument();
  });

  it('adopts a Trivium path only for the selected learner and academic year', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => triviumPaths });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: false }) });

    renderGallery();
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));
    await screen.findByTestId('adopt-learning-path-TRIVIUM.GRAMMAR');
    fireEvent.click(screen.getByTestId('adopt-learning-path-TRIVIUM.GRAMMAR'));

    await waitFor(() => expect(screen.getByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).toHaveAttribute('data-selected', 'true'));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/paths/path-grammar/learners/learner-1/academic-years/year-2026/selection',
      expect.objectContaining({
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      }),
    );

    fireEvent.click(screen.getByTestId('adopt-learning-path-TRIVIUM.GRAMMAR'));
    await waitFor(() => expect(screen.getByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).toHaveAttribute('data-selected', 'false'));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/paths/path-grammar/learners/learner-1/academic-years/year-2026/selection',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ enabled: false }) }),
    );
  });

  it('reloads the selected state when learner or year changes', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => triviumPaths });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => triviumPaths.map((path) => ({ ...path, selected: true })) });

    renderGallery({ learners: [learner, learnerTwo], academicYears: [year, otherYear] });
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));
    await screen.findByTestId('curriculum-path-card-TRIVIUM.GRAMMAR');
    fireEvent.change(screen.getByLabelText('Educando'), { target: { value: 'learner-2' } });

    await waitFor(() => expect(screen.getByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).toHaveAttribute('data-selected', 'true'));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/paths/catalog?learnerId=learner-2&academicYearId=year-2026',
      { credentials: 'include' },
    );

    fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: 'year-2027' } });
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/families/family-1/curriculum/paths/catalog?learnerId=learner-2&academicYearId=year-2027',
      { credentials: 'include' },
    ));
  });

  it('explains the required learner and year before requesting the Trivium catalog', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });

    renderGallery({ learners: [], academicYears: [] });
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));

    expect(await screen.findByTestId('curriculum-explore-context-required')).toBeInTheDocument();
    expect(screen.queryByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks the family to create an academic year when the learner exists but no year does', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });

    renderGallery({ academicYears: [] });
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));

    expect(await screen.findByTestId('curriculum-explore-context-required')).toHaveTextContent('ano letivo');
    expect(screen.getByRole('link', { name: 'Abrir planejamento curricular' })).toHaveAttribute('href', '/curriculum');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while the Trivium catalog is being fetched', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    let resolveCatalog!: (response: { ok: boolean; json: () => Promise<LearningPathExplorerCatalogEntryDto[]> }) => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveCatalog = resolve; }));

    renderGallery();
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));
    expect(screen.getByTestId('curriculum-trivium-loading')).toBeInTheDocument();

    resolveCatalog({ ok: true, json: async () => triviumPaths });
    expect(await screen.findByTestId('curriculum-path-card-TRIVIUM.GRAMMAR')).toBeInTheDocument();
  });

  it('shows localized catalog error and empty states', async () => {
    const fetchMock = mockCatalogResponse();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => catalog });
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    renderGallery({ academicYears: [year, otherYear] });
    fireEvent.click(screen.getByRole('tab', { name: 'Trilhas do Trivium' }));
    expect(await screen.findByTestId('curriculum-trivium-catalog-error')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
    fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: 'year-2027' } });
    expect(await screen.findByTestId('curriculum-trivium-empty')).toBeInTheDocument();
  });
});
