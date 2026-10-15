import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@aletheia/ui';
import type { LearnerSummaryDto, LearningRecordResponseDto, PortfolioItemResponseDto } from '@aletheia/contracts';
import type { AuthContextValue } from '../src/lib/auth/auth-context';
import { AuthContext } from '../src/lib/auth/auth-context';
import { AuthProvider as AuthRoleProvider } from '../src/lib/auth/rbac-context';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import PortfolioPage from '../app/(dashboard)/portfolio/page';
import { PortfolioGalleryView } from '../src/components/records/portfolio-gallery-view';
import { PortfolioItemModal } from '../src/components/records/portfolio-item-modal';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portfolio',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} data-next-link="true" />
  ),
}));

const family = {
  id: 'fam-1',
  name: 'Família Santos',
  countryCode: 'BRA',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const learner: LearnerSummaryDto = {
  id: 'learner-1',
  firstName: 'Sofia',
  preferredName: 'Sofi',
  stage: 'PRIMARY',
  avatarColor: '#3B82F6',
};

const secondLearner: LearnerSummaryDto = {
  id: 'learner-2',
  firstName: 'Miguel',
  preferredName: 'Mika',
  stage: 'PRIMARY',
  avatarColor: '#10B981',
};

const records: LearningRecordResponseDto[] = [
  {
    id: 'record-1',
    familyId: 'fam-1',
    learnerId: learner.id,
    learnerName: learner.firstName,
    subjectId: null,
    subjectName: null,
    type: 'PLANNED_LESSON',
    title: 'Leitura de Sofia',
    date: '2026-09-15',
    masteryLevel: 'DEVELOPING',
    assessmentMethod: 'OBSERVATION',
    objectives: [],
    portfolioItemIds: [],
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'record-2',
    familyId: 'fam-1',
    learnerId: secondLearner.id,
    learnerName: secondLearner.firstName,
    subjectId: null,
    subjectName: null,
    type: 'PLANNED_LESSON',
    title: 'Leitura de Miguel',
    date: '2026-09-16',
    masteryLevel: 'DEVELOPING',
    assessmentMethod: 'OBSERVATION',
    objectives: [],
    portfolioItemIds: [],
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  },
];

const portfolioItem: PortfolioItemResponseDto = {
  id: 'portfolio-1',
  familyId: 'fam-1',
  learnerId: 'learner-1',
  type: 'TEXT',
  title: 'Narrativa sobre plantas',
  description: 'Uma narrativa sobre o jardim.',
  textContent: 'As plantas precisam de luz.',
  fileUrl: null,
  mimeType: null,
  fileSizeBytes: null,
  tags: ['jardim'],
  isHighlight: false,
  createdAt: '2026-09-15T10:00:00.000Z',
  updatedAt: '2026-09-15T10:00:00.000Z',
};

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: {
      id: 'user-1',
      email: 'guardian@example.com',
      fullName: 'Guardião Santos',
      emailVerified: true,
      mfaEnabled: false,
      isPlatformAdmin: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    token: 'token',
    activeFamilyId: family.id,
    activeFamily: family,
    families: [family],
    activeRole: 'OWNER_GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    confirmRegistrationCode: vi.fn(),
    resendRegistrationCode: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn(),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
    ...overrides,
  };
}

function renderPage(auth: AuthContextValue = makeAuth()) {
  return render(
    <AuthContext.Provider value={auth}>
      <LocaleProvider>
        <ToastProvider>
          <PortfolioPage />
        </ToastProvider>
      </LocaleProvider>
    </AuthContext.Provider>,
  );
}

function response(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

function mockPortfolioFetch(portfolio: unknown = []) {
  return vi.fn().mockImplementation(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/learners')) return response([learner]);
    if (url.includes('/curriculum/subjects')) return response([]);
    if (url.includes('/records')) return response([]);
    if (url.includes('/portfolio?')) return response(portfolio);
    if (url.includes('/notifications/unread-count')) return response({ count: 0 });
    if (url.includes('/notifications')) return response([]);
    return response({});
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aletheia_locale', 'pt-BR');
  globalThis.fetch = mockPortfolioFetch() as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PortfolioPage states', () => {
  it('defers signed media URLs until the user opens the file and reuses the in-memory cache', async () => {
    let downloadAttempts = 0;
    const downloadUrl = 'https://storage.example.com/signed/portfolio-1.jpg';
    const fetchMock = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/learners')) return response([learner]);
      if (url.includes('/curriculum/subjects')) return response([]);
      if (url.includes('/records')) return response([]);
      if (url.includes('/portfolio?')) {
        return response([{ ...portfolioItem, type: 'IMAGE', mimeType: 'image/jpeg' }]);
      }
      if (url.includes('/download-url')) {
        downloadAttempts += 1;
        return response({ downloadUrl, expiresAt: '2099-01-01T00:00:00.000Z' });
      }
      if (url.includes('/notifications/unread-count')) return response({ count: 0 });
      if (url.includes('/notifications')) return response([]);
      return response({});
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderPage();

    expect(await screen.findByTestId(`portfolio-title-${portfolioItem.id}`)).toBeInTheDocument();
    expect(downloadAttempts).toBe(0);

    fireEvent.click(screen.getByTestId(`view-file-link-${portfolioItem.id}`));

    await waitFor(() => {
      expect(downloadAttempts).toBe(1);
      expect(openSpy).toHaveBeenCalledWith(downloadUrl, '_blank', 'noopener,noreferrer');
    });

    fireEvent.click(screen.getByTestId(`view-file-link-${portfolioItem.id}`));
    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(2));
    expect(downloadAttempts).toBe(1);
  });

  it('renews an expired signed URL when the user opens the file again', async () => {
    let downloadAttempts = 0;
    const downloadUrls = [
      'https://storage.example.com/signed/portfolio-1-old.jpg',
      'https://storage.example.com/signed/portfolio-1-new.jpg',
    ];
    const fetchMock = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/learners')) return response([learner]);
      if (url.includes('/curriculum/subjects')) return response([]);
      if (url.includes('/records')) return response([]);
      if (url.includes('/portfolio?')) {
        return response([{ ...portfolioItem, type: 'IMAGE', mimeType: 'image/jpeg' }]);
      }
      if (url.includes('/download-url')) {
        const currentUrl = downloadUrls[downloadAttempts];
        downloadAttempts += 1;
        return response({
          downloadUrl: currentUrl,
          expiresAt: downloadAttempts === 1 ? '2000-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z',
        });
      }
      if (url.includes('/notifications/unread-count')) return response({ count: 0 });
      if (url.includes('/notifications')) return response([]);
      return response({});
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderPage();

    expect(await screen.findByTestId(`portfolio-title-${portfolioItem.id}`)).toBeInTheDocument();
    const openMediaButton = () => screen.getByTestId(`view-file-link-${portfolioItem.id}`);

    fireEvent.click(openMediaButton());
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith(downloadUrls[0], '_blank', 'noopener,noreferrer'));

    fireEvent.click(openMediaButton());
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith(downloadUrls[1], '_blank', 'noopener,noreferrer'));
    expect(downloadAttempts).toBe(2);
  });

  it('shows a family selection or creation state without requesting portfolio data', async () => {
    const fetchMock = mockPortfolioFetch();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderPage(makeAuth({ activeFamilyId: null, activeFamily: null, families: [] }));

    expect(await screen.findByTestId('portfolio-no-family-state')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /criar uma família/i })).toHaveAttribute('href', '/onboarding');
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/portfolio?'),
      expect.anything(),
    );
  });

  it('shows a retryable error when the portfolio request fails', async () => {
    let portfolioAttempts = 0;
    const fetchMock = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/learners')) return response([learner]);
      if (url.includes('/curriculum/subjects')) return response([]);
      if (url.includes('/records')) return response([]);
      if (url.includes('/portfolio?')) {
        portfolioAttempts += 1;
        return portfolioAttempts === 1 ? response({ message: 'internal error' }, false) : response([]);
      }
      if (url.includes('/notifications/unread-count')) return response({ count: 0 });
      if (url.includes('/notifications')) return response([]);
      return response({});
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderPage();

    expect(await screen.findByTestId('portfolio-error-state')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByTestId('portfolio-empty-state')).toBeInTheDocument();
    });
    expect(portfolioAttempts).toBe(2);
  });
});

describe('PortfolioGalleryView states', () => {
  it('loads an image preview on demand and keeps the card usable when media resolution fails', async () => {
    const resolvedUrl = 'https://storage.example.com/signed/portfolio-1-retry.jpg';
    const resolveMediaUrl = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(resolvedUrl);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <AuthContext.Provider value={makeAuth()}>
        <LocaleProvider>
          <ToastProvider>
            <PortfolioGalleryView
              items={[{ ...portfolioItem, type: 'IMAGE', mimeType: 'image/jpeg' }]}
              learners={[learner]}
              subjects={[]}
              activeLearnerId={null}
              onOpenAddItem={vi.fn()}
              onEditItem={vi.fn()}
              onDeleteItem={vi.fn()}
              onResolveMediaUrl={resolveMediaUrl}
            />
          </ToastProvider>
        </LocaleProvider>
      </AuthContext.Provider>,
    );

    expect(resolveMediaUrl).not.toHaveBeenCalled();
    fireEvent.mouseEnter(screen.getByTestId(`portfolio-media-preview-${portfolioItem.id}`));

    await waitFor(() => expect(resolveMediaUrl).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId(`portfolio-card-${portfolioItem.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`portfolio-media-error-${portfolioItem.id}`)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`view-file-link-${portfolioItem.id}`));
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith(resolvedUrl, '_blank', 'noopener,noreferrer'));
    expect(resolveMediaUrl).toHaveBeenCalledTimes(2);
  });

  it('announces read-only mode when the current role cannot edit the portfolio', () => {
    render(
      <AuthContext.Provider value={makeAuth({ activeRole: null })}>
        <LocaleProvider>
          <ToastProvider>
            <PortfolioGalleryView
              items={[portfolioItem]}
              learners={[learner]}
              subjects={[]}
              activeLearnerId={null}
              onOpenAddItem={vi.fn()}
              onEditItem={vi.fn()}
              onDeleteItem={vi.fn()}
            />
          </ToastProvider>
        </LocaleProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('portfolio-read-only-state')).toBeInTheDocument();
    expect(screen.queryByTestId('open-add-portfolio-btn')).not.toBeInTheDocument();
  });

  it('gives educators create/edit actions without exposing portfolio deletion', () => {
    render(
      <AuthRoleProvider role="EDUCATOR">
        <AuthContext.Provider value={makeAuth({ activeRole: 'EDUCATOR' })}>
          <LocaleProvider>
            <ToastProvider>
              <PortfolioGalleryView
                items={[portfolioItem]}
                learners={[learner]}
                subjects={[]}
                activeLearnerId={null}
                onOpenAddItem={vi.fn()}
                onEditItem={vi.fn()}
                onDeleteItem={vi.fn()}
              />
            </ToastProvider>
          </LocaleProvider>
        </AuthContext.Provider>
      </AuthRoleProvider>,
    );

    expect(screen.getByTestId('open-add-portfolio-btn')).toBeInTheDocument();
    expect(screen.getByTestId(`edit-portfolio-btn-${portfolioItem.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`delete-portfolio-btn-${portfolioItem.id}`)).not.toBeInTheDocument();
  });

  it('distinguishes an empty portfolio from filters with no matching work', () => {
    render(
      <AuthContext.Provider value={makeAuth()}>
        <LocaleProvider>
          <ToastProvider>
            <PortfolioGalleryView
              items={[portfolioItem]}
              learners={[learner]}
              subjects={[]}
              activeLearnerId={null}
              onOpenAddItem={vi.fn()}
              onEditItem={vi.fn()}
              onDeleteItem={vi.fn()}
            />
          </ToastProvider>
        </LocaleProvider>
      </AuthContext.Provider>,
    );

    fireEvent.change(screen.getByTestId('search-portfolio-input'), { target: { value: 'não existe' } });

    expect(screen.getByTestId('portfolio-no-results-state')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
    expect(screen.queryByTestId('portfolio-empty-state')).not.toBeInTheDocument();
  });
});

describe('PortfolioItemModal context filters', () => {
  it('shows only records for the selected learner and clears incompatible selections', () => {
    render(
      <LocaleProvider>
        <ToastProvider>
          <PortfolioItemModal
            isOpen
            onClose={vi.fn()}
            onSave={vi.fn()}
            learners={[learner, secondLearner]}
            subjects={[]}
            records={records}
            defaultLearnerId={learner.id}
          />
        </ToastProvider>
      </LocaleProvider>,
    );

    const learnerSelect = screen.getByTestId('portfolio-learner-select');
    const recordSelect = screen.getByTestId('portfolio-record-select');

    expect(screen.getByRole('option', { name: /Leitura de Sofia/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Leitura de Miguel/ })).not.toBeInTheDocument();

    fireEvent.change(learnerSelect, { target: { value: secondLearner.id } });

    expect(recordSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: /Leitura de Miguel/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Leitura de Sofia/ })).not.toBeInTheDocument();
  });
});
