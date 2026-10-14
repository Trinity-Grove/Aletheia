import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import LegalGuidePage from '../app/(dashboard)/legal-guide/page';

const nextNavigation = vi.hoisted(() => ({
  pathname: '/legal-guide',
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

const mockJurisdiction = {
  code: 'BR',
  name: 'Brasil (Diretriz Federal)',
  version: 1,
  confidenceLevel: 'ESTABLISHED',
  minInstructionalDays: 200,
  minInstructionalHours: 800,
  officialSource: 'CF/88 art. 226/229',
  legalBasisSummary: 'Jurisprudência do STF',
};

const mockLearners = [
  {
    id: 'l-001',
    firstName: 'Clara',
    lastName: 'Silva',
    preferredName: 'Clarinha',
    stage: 'PRIMARY',
    avatarColor: '#3B82F6',
  },
];

describe('LegalGuidePage', () => {
  let mockAuthContext: AuthContextValue;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('aletheia_locale', 'pt-BR');
    nextNavigation.pathname = '/legal-guide';
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
      activeFamilyId: 'fam-legal-1',
      activeFamily: {
        id: 'fam-legal-1',
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
      if (urlStr.includes('/jurisdiction')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockJurisdiction,
        });
      }
      if (urlStr.includes('/learners')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLearners,
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

  it('renders within ProductShell and displays Legal Guide Hub content', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LegalGuidePage />
      </AuthContext.Provider>,
    );

    // ProductShell landmark
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();

    // Legal Guide Hub components rendered
    await waitFor(() => {
      expect(screen.getByText('Amparo Legal & Primeiros Passos')).toBeInTheDocument();
    });
    expect(screen.getByText('Checklist dos Primeiros 30 Dias')).toBeInTheDocument();
    expect(screen.getByText('Seus Direitos e Amparo Constitucional')).toBeInTheDocument();
    expect(screen.getByText('Como se Proteger com Evidências de Aprendizagem')).toBeInTheDocument();
    expect(screen.getByText('Perguntas Frequentes (FAQ Jurídico)')).toBeInTheDocument();
  });

  it('fetches learners and auto-checks step 1 when learners exist', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LegalGuidePage />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/v1/families/fam-legal-1/learners',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('1 de 6 etapas concluídas (17%)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]?.checked).toBe(true);
  });

  it('falls back to localStorage familyId if activeFamilyId is missing from auth context', async () => {
    mockAuthContext.activeFamilyId = null;
    localStorage.setItem('familyId', 'fam-from-storage');

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LegalGuidePage />
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
