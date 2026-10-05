import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../app/(dashboard)/settings/page';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { LocaleProvider } from '../src/lib/i18n/locale-context';

let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => currentSearchParams,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';

function createMockSession(overrides?: Partial<AuthContextValue['user']>): AuthContextValue {
  return {
    status: 'authenticated',
    user: {
      id: 'user-1',
      email: 'guardian@example.com',
      fullName: 'Guardian Test',
      emailVerified: true,
      mfaEnabled: overrides?.mfaEnabled ?? false,
      isPlatformAdmin: false,
      createdAt: '',
      ...overrides,
    },
    token: null,
    activeFamilyId: FAMILY_ID,
    activeFamily: null,
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
}

function renderSettings(session = createMockSession()) {
  return render(
    <LocaleProvider>
      <AuthContext.Provider value={session}>
        <SettingsPage />
      </AuthContext.Provider>
    </LocaleProvider>,
  );
}

describe('SettingsPage UX Overhaul', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('familyId', FAMILY_ID);
    currentSearchParams = new URLSearchParams();

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/notifications/unread-count')) {
        return {
          ok: true,
          json: async () => ({ count: 1 }),
        };
      }
      if (url.includes('/privacy/consent')) {
        return {
          ok: true,
          json: async () => ({ familyId: FAMILY_ID, terms: [] }),
        };
      }
      if (url.includes('/notifications')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'n-1',
              familyId: FAMILY_ID,
              userId: 'user-1',
              type: 'DEVOTIONAL_REMINDER',
              title: 'Lembrete',
              message: 'Texto',
              linkUrl: null,
              isRead: false,
              readAt: null,
              metadata: null,
              createdAt: '2026-10-04T00:00:00.000Z',
              updatedAt: '2026-10-04T00:00:00.000Z',
            },
          ],
        };
      }
      if (url.includes('/backup/export') || url.includes('/backup/jobs')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'job-1',
              familyId: FAMILY_ID,
              status: 'COMPLETED',
              createdAt: '2026-10-04T00:00:00.000Z',
            },
          ],
        };
      }
      return { ok: true, json: async () => [] };
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a 2-column sidebar layout with semantic grouped navigation categories', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('settings-sidebar-nav')).toBeInTheDocument();
    });

    // Check grouped categories
    expect(screen.getByTestId('settings-group-family')).toHaveTextContent(/Família/i);
    expect(screen.getByTestId('settings-group-communication')).toHaveTextContent(/Comunicação/i);
    expect(screen.getByTestId('settings-group-security')).toHaveTextContent(/Segurança/i);
    expect(screen.getByTestId('settings-group-community')).toHaveTextContent(/Comunidade/i);

    // Check all 8 tabs are rendered
    expect(screen.getByTestId('tab-general-settings')).toBeInTheDocument();
    expect(screen.getByTestId('tab-family-members')).toBeInTheDocument();
    expect(screen.getByTestId('tab-profile-settings')).toBeInTheDocument();
    expect(screen.getByTestId('tab-notification-preferences')).toBeInTheDocument();
    expect(screen.getByTestId('tab-account-security')).toBeInTheDocument();
    expect(screen.getByTestId('tab-privacy-settings')).toBeInTheDocument();
    expect(screen.getByTestId('tab-data-backup')).toBeInTheDocument();
    expect(screen.getByTestId('tab-supporter-settings')).toBeInTheDocument();
  });

  it('activates the privacy tab automatically when deep-linking via query param ?tab=privacy', async () => {
    currentSearchParams = new URLSearchParams('tab=privacy');
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-consent-settings')).toBeInTheDocument();
    });
  });

  it('activates the account security tab automatically when deep-linking via ?tab=account', async () => {
    currentSearchParams = new URLSearchParams('tab=account');
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('account-security-settings')).toBeInTheDocument();
    });
  });

  it('activates the data backup tab automatically when deep-linking via ?tab=backup', async () => {
    currentSearchParams = new URLSearchParams('tab=backup');
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('data-backup-card')).toBeInTheDocument();
    });
  });

  it('switches tabs smoothly and synchronizes URL query param with window.history.replaceState', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('tab-account-security')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-account-security'));

    await waitFor(() => {
      expect(screen.getByTestId('account-security-settings')).toBeInTheDocument();
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      expect.stringContaining('tab=account'),
    );
  });

  it('displays status badges for 2FA in the account tab', async () => {
    // Session with 2FA enabled
    const sessionWithMfa = createMockSession({ mfaEnabled: true });
    const { unmount } = renderSettings(sessionWithMfa);

    await waitFor(() => {
      expect(screen.getByTestId('mfa-status-badge')).toHaveTextContent(/Ativo/i);
    });
    unmount();

    // Session without 2FA
    const sessionWithoutMfa = createMockSession({ mfaEnabled: false });
    renderSettings(sessionWithoutMfa);

    await waitFor(() => {
      expect(screen.getByTestId('mfa-status-badge')).toHaveTextContent(/Recomendado|Inativo/i);
    });
  });

  it('displays an unread notifications count badge when there are unread notifications', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('settings-notifications-badge')).toBeInTheDocument();
      expect(screen.getByTestId('settings-notifications-badge')).toHaveTextContent('1');
    });
  });
});
