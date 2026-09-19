import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConvitePage from '../app/convite/[token]/page';
import InvitePage from '../app/invite/[token]/page';
import { InvitationAcceptView } from '../src/components/invitations/invitation-accept-view';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { setApiAuthToken } from '../src/lib/api';

const mockPush = vi.fn();
let mockParams = { token: 'valid-invitation-token' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useParams: () => mockParams,
  usePathname: () => `/convite/${mockParams.token}`,
}));

function createAuthContextValue(
  status: AuthContextValue['status'] = 'authenticated',
  userOverrides = {}
): AuthContextValue {
  return {
    status,
    user:
      status === 'authenticated'
        ? {
            id: 'user-uuid-1',
            email: 'parent@example.com',
            fullName: 'Ana Silva',
            emailVerified: true,
            mfaEnabled: false,
            isPlatformAdmin: false,
            createdAt: '2026-09-01T00:00:00.000Z',
            ...userOverrides,
          }
        : null,
    token: status === 'authenticated' ? 'test-jwt-token' : null,
    activeFamilyId: 'family-old-uuid',
    activeFamily: null,
    families: [],
    activeRole: 'GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

describe('Family Invitation Acceptance UI', () => {
  beforeEach(() => {
    localStorage.clear();
    mockParams = { token: 'valid-invitation-token' };
    mockPush.mockClear();
    setApiAuthToken('test-jwt-token');
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Unauthenticated State', () => {
    it('renders invitation explanation and links to login and register with redirect parameter', () => {
      const authValue = createAuthContextValue('unauthenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="tok-123" />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('invitation-accept-page')).toBeInTheDocument();
      expect(screen.getByText('Convite para Família')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Para aceitar este convite com segurança e acessar os planos de estudo, entre com sua conta existente ou crie um novo cadastro./i
        )
      ).toBeInTheDocument();

      const loginLink = screen.getByTestId('login-to-accept-link');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Fconvite%2Ftok-123');

      const registerLink = screen.getByTestId('register-to-accept-link');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register?redirect=%2Fconvite%2Ftok-123');

      expect(screen.queryByTestId('accept-invitation-btn')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading message while auth status is loading', () => {
      const authValue = createAuthContextValue('loading');

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="tok-123" />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('invitation-loading')).toBeInTheDocument();
      expect(screen.getByText(/Verificando sua sessão.../i)).toBeInTheDocument();
      expect(screen.queryByTestId('accept-invitation-btn')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State & Acceptance Flow', () => {
    it('displays logged-in user information and allows accepting the invitation', async () => {
      const authValue = createAuthContextValue('authenticated');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, familyId: 'fam-new-456' }),
      } as Response);

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="token-abc" />
        </AuthContext.Provider>
      );

      // Verify user information is displayed
      const userInfo = screen.getByTestId('logged-user-info');
      expect(userInfo).toHaveTextContent('Ana Silva');
      expect(userInfo).toHaveTextContent('parent@example.com');

      const acceptBtn = screen.getByTestId('accept-invitation-btn');
      expect(acceptBtn).toBeInTheDocument();
      expect(acceptBtn).toHaveTextContent('Aceitar Convite e Entrar na Família');

      // Click accept
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/invitations/token-abc/accept',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-jwt-token',
            }),
          })
        );
      });

      // Verify success UI, storage and state updates
      await waitFor(() => {
        expect(screen.getByTestId('invitation-success-message')).toBeInTheDocument();
        expect(screen.getByText(/Convite aceito com sucesso! Bem-vindo\(a\) à família!/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem('familyId')).toBe('fam-new-456');
      expect(localStorage.getItem('aletheia_active_family_id')).toBe('fam-new-456');
      expect(authValue.selectFamily).toHaveBeenCalledWith('fam-new-456');
      expect(authValue.refreshSession).toHaveBeenCalled();

      // Fast-forward timer to verify navigation
      act(() => {
        vi.advanceTimersByTime(1600);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('displays error alert when invitation accept endpoint returns an error', async () => {
      const authValue = createAuthContextValue('authenticated');

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          statusCode: 400,
          message: 'Convite inválido ou expirado.',
        }),
      } as Response);

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="expired-token" />
        </AuthContext.Provider>
      );

      const acceptBtn = screen.getByTestId('accept-invitation-btn');
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('invitation-error-alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('Convite inválido ou expirado.');
      });

      expect(localStorage.getItem('familyId')).toBeNull();
      expect(authValue.selectFamily).not.toHaveBeenCalled();
    });

    it('displays error alert when network fails during acceptance', async () => {
      const authValue = createAuthContextValue('authenticated');

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network connection failed'));

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="valid-token" />
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByTestId('accept-invitation-btn'));

      await waitFor(() => {
        const errorAlert = screen.getByTestId('invitation-error-alert');
        expect(errorAlert).toHaveTextContent('Network connection failed');
      });
    });

    it('allows navigating to home via cancel button', () => {
      const authValue = createAuthContextValue('authenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="valid-token" />
        </AuthContext.Provider>
      );

      const cancelBtn = screen.getByTestId('cancel-invitation-btn');
      fireEvent.click(cancelBtn);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('shows error if token is missing when accepting', async () => {
      mockParams = { token: '' };
      const authValue = createAuthContextValue('authenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <InvitationAcceptView token="" />
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByTestId('accept-invitation-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('invitation-error-alert')).toHaveTextContent('Token de convite não fornecido.');
      });
    });
  });

  describe('Page Wrapper Components & Aliases', () => {
    it('renders Portuguese ConvitePage with object params', () => {
      const authValue = createAuthContextValue('unauthenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <ConvitePage params={{ token: 'route-token-pt' }} />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('login-to-accept-link')).toHaveAttribute(
        'href',
        '/login?redirect=%2Fconvite%2Froute-token-pt'
      );
    });

    it('renders Portuguese ConvitePage using route params from useParams when params prop omitted', () => {
      mockParams = { token: 'url-param-token' };
      const authValue = createAuthContextValue('unauthenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <ConvitePage />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('login-to-accept-link')).toHaveAttribute(
        'href',
        '/login?redirect=%2Fconvite%2Furl-param-token'
      );
    });

    it('renders English alias InvitePage identically', () => {
      const authValue = createAuthContextValue('unauthenticated');

      render(
        <AuthContext.Provider value={authValue}>
          <InvitePage params={{ token: 'alias-token-en' }} />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('invitation-accept-page')).toBeInTheDocument();
      expect(screen.getByTestId('login-to-accept-link')).toHaveAttribute(
        'href',
        '/login?redirect=%2Fconvite%2Falias-token-en'
      );
    });
  });
});
