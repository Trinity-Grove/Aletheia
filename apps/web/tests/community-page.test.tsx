import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import CommunityPage from '../app/(dashboard)/community/page';

const nextNavigation = vi.hoisted(() => ({
  pathname: '/community',
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nextNavigation.pathname,
  useRouter: () => ({ replace: nextNavigation.routerReplace, push: nextNavigation.routerPush }),
}));

vi.mock('next/link', () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} data-next-link="true" />
  ),
}));

const mockLearners = [
  {
    id: 'l-001',
    firstName: 'Clara',
    lastName: 'Silva',
    preferredName: 'Clarinha',
    stage: 'PRIMARY',
    avatarColor: '#3B82F6',
  },
  {
    id: 'l-002',
    firstName: 'Pedro',
    lastName: 'Silva',
    preferredName: null,
    stage: 'LOWER_SECONDARY',
    avatarColor: '#10B981',
  },
];

describe('CommunityPage', () => {
  let mockAuthContext: AuthContextValue;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
    nextNavigation.pathname = '/community';
    nextNavigation.routerReplace.mockClear();

    mockAuthContext = {
      status: 'authenticated',
      user: {
        id: 'usr-1',
        email: 'guardian@aletheia.edu',
        fullName: 'Guardião Santos',
        emailVerified: true,
        mfaEnabled: false,
        isPlatformAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      token: 'jwt-mock-token',
      activeFamilyId: 'fam-comm-1',
      activeFamily: {
        id: 'fam-comm-1',
        name: 'Família Santos',
        countryCode: 'BRA',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      families: [],
      activeRole: 'OWNER_GUARDIAN',
      login: vi.fn(),
      verifyMfa: vi.fn(),
      confirmRegistrationCode: vi.fn(),
      resendRegistrationCode: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      selectFamily: vi.fn(),
      refreshSession: vi.fn(),
      setActiveFamilyFromCreated: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn(),
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/learners')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLearners,
        });
      }
      if (urlStr.includes('/community-activities')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders within ProductShell and displays Community Hub content', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CommunityPage />
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('community-hub-view')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Mural de Inspiração Comunitária' })).toBeInTheDocument();
    expect(screen.getByTestId('community-hub-search-input')).toBeInTheDocument();
  });

  it('fetches learners for the active family and passes them to the shell', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CommunityPage />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/v1/families/fam-comm-1/learners',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('learner-focus-select')).toBeInTheDocument();
    });
  });

  it('falls back to localStorage familyId if activeFamilyId is missing from auth context', async () => {
    mockAuthContext.activeFamilyId = null;
    localStorage.setItem('aletheia.activeFamilyId', 'fam-from-storage');

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <CommunityPage />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/v1/families/fam-from-storage/learners',
        expect.objectContaining({ credentials: 'include' }),
      );
    });
  });
});
