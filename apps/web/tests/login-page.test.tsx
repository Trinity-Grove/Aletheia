import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import LoginPage from '../app/(auth)/login/page';

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe('LoginPage', () => {
  let mockAuthContext: AuthContextValue;

  beforeEach(() => {
    mockPush.mockReset();
    mockSearchParams.forEach((_value, key) => mockSearchParams.delete(key));

    mockAuthContext = {
      status: 'unauthenticated',
      user: null,
      token: null,
      activeFamilyId: null,
      activeFamily: null,
      families: [],
      activeRole: null,
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
  });

  afterEach(() => {
    cleanup();
  });

  function renderWithAuth(authOverrides: Partial<AuthContextValue> = {}) {
    const value = { ...mockAuthContext, ...authOverrides };
    return render(<AuthContext.Provider value={value}><LoginPage /></AuthContext.Provider>);
  }

  it('shows the login form when there is no existing session', () => {
    renderWithAuth({ status: 'unauthenticated' });

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to / without showing the login form when a session already exists', () => {
    renderWithAuth({ status: 'authenticated' });

    expect(mockPush).toHaveBeenCalledWith('/');
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('redirects to the sanitized redirect target when a session already exists', () => {
    mockSearchParams.set('redirect', '/records?tab=summary');

    renderWithAuth({ status: 'authenticated' });

    expect(mockPush).toHaveBeenCalledWith('/records?tab=summary');
  });
});
