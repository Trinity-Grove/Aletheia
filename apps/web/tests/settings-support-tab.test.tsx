import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../app/(dashboard)/settings/page';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';

// Regression test for issue #234: SupporterSettingsCard (donations/
// voluntary support) existed and had its own tests, but was never wired
// into any page -- the only other reachable path, the main nav item, is
// hidden except when already on /support. There was no real way to
// reach the donation feature from the app. This proves the settings
// page's new "Apoio Comunitário" tab actually renders it.

vi.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';

function session(): AuthContextValue {
  return {
    status: 'authenticated',
    user: {
      id: 'user-1',
      email: 'guardian@example.com',
      fullName: 'Guardian Test',
      emailVerified: true,
      mfaEnabled: false,
      isPlatformAdmin: false,
      createdAt: '',
    },
    token: null,
    activeFamilyId: FAMILY_ID,
    activeFamily: null,
    families: [],
    activeRole: 'OWNER_GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn(),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

function renderSettingsPage() {
  return render(
    <AuthContext.Provider value={session()}>
      <SettingsPage />
    </AuthContext.Provider>,
  );
}

describe('Settings page: Apoio Comunitário tab (issue #234)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('familyId', FAMILY_ID);

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/donations/history') || url.includes('/donations/subscriptions')) {
        return { ok: true, json: async () => [] };
      }
      // Every other initial-load fetch on the settings page: return an
      // empty-but-successful response so the page reaches its loaded state.
      return { ok: true, json: async () => [] };
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a clickable "Apoio Comunitário" tab that shows the supporter settings card', async () => {
    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId('tab-supporter-settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-supporter-settings'));

    await waitFor(() => {
      expect(screen.getByTestId('supporter-settings-card')).toBeInTheDocument();
    });

    // The card's own entry point to the full donation page must be intact.
    const link = screen.getByTestId('support-page-link');
    expect(link).toHaveAttribute('href', '/support');
  });
});
