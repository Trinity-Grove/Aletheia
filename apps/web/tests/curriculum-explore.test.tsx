import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AcademicYearResponseDto,
  LearnerSummaryDto,
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

const year: AcademicYearResponseDto = {
  id: 'year-2026',
  familyId: 'family-1',
  year: 2026,
  title: 'Ano Letivo 2026',
  isCurrent: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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
});
