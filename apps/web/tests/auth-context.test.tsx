import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type {
  AuthResponseDto,
  FamilyResponseDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { api, ApiError, getApiAuthToken, setApiAuthToken } from '../src/lib/api';
import { AuthProvider, useAuth } from '../src/lib/auth/auth-context';

describe('AuthContext and useAuth', () => {
  const mockUser: UserSummaryDto = {
    id: 'user-uuid-1',
    email: 'guardian@example.com',
    fullName: 'Guardian Silva',
    createdAt: '2026-08-30T00:00:00.000Z',
  };

  const mockFamily1: FamilyResponseDto = {
    id: 'family-uuid-1',
    name: 'Família Silva',
    countryCode: 'BRA',
    stateProvince: 'SP',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    members: [
      {
        id: 'member-1',
        familyId: 'family-uuid-1',
        userId: 'user-uuid-1',
        role: 'OWNER_GUARDIAN',
        createdAt: '2026-08-30T00:00:00.000Z',
      },
    ],
  };

  const mockFamily2: FamilyResponseDto = {
    id: 'family-uuid-2',
    name: 'Família Oliveira',
    countryCode: 'BRA',
    stateProvince: 'RJ',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    members: [
      {
        id: 'member-2',
        familyId: 'family-uuid-2',
        userId: 'user-uuid-1',
        role: 'EDUCATOR',
        createdAt: '2026-08-30T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    setApiAuthToken(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    setApiAuthToken(null);
    vi.restoreAllMocks();
  });

  it('throws an error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleError.mockRestore();
  });

  it('initializes to unauthenticated when there is no valid session cookie', async () => {
    // The session lives in an httpOnly cookie the app can't inspect directly —
    // the only way to know it's absent is for /auth/me to reject.
    vi.spyOn(api, 'get').mockRejectedValue(new ApiError(401, 'Unauthorized', 'No session'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.families).toEqual([]);
    expect(result.current.activeFamilyId).toBeNull();
    expect(result.current.activeFamily).toBeNull();
    expect(result.current.activeRole).toBeNull();
    expect(getApiAuthToken()).toBeNull();
  });

  it('treats a network failure on initial mount the same as no session', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new TypeError('Failed to fetch'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.user).toBeNull();
  });

  it('initializes to authenticated when the session cookie is valid and selects default first family', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [mockFamily1, mockFamily2];
      throw new Error(`Unexpected path: ${path}`);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.families).toEqual([mockFamily1, mockFamily2]);
    expect(result.current.activeFamilyId).toBe('family-uuid-1');
    expect(result.current.activeFamily).toEqual(mockFamily1);
    expect(result.current.activeRole).toBe('OWNER_GUARDIAN');
    expect(getSpy).toHaveBeenCalledWith('/auth/me');
    expect(getSpy).toHaveBeenCalledWith('/families/mine');
  });

  it('restores stored activeFamilyId on initial mount if present in families list', async () => {
    localStorage.setItem('aletheia_active_family_id', 'family-uuid-2');

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [mockFamily1, mockFamily2];
      throw new Error(`Unexpected path: ${path}`);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.activeFamilyId).toBe('family-uuid-2');
    expect(result.current.activeFamily).toEqual(mockFamily2);
    expect(result.current.activeRole).toBe('EDUCATOR');
  });

  it('logs in successfully and populates user, token, and active family', async () => {
    const authResponse: AuthResponseDto = {
      accessToken: 'new-login-token-456',
      user: mockUser,
    };

    vi.spyOn(api, 'get')
      .mockRejectedValueOnce(new ApiError(401, 'Unauthorized', 'No session'))
      .mockResolvedValue([mockFamily1]);
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(authResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    await act(async () => {
      await result.current.login({
        email: 'guardian@example.com',
        password: 'secretPassword123',
      });
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'guardian@example.com',
      password: 'secretPassword123',
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.token).toBe('new-login-token-456');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.families).toEqual([mockFamily1]);
    expect(result.current.activeFamilyId).toBe('family-uuid-1');
    expect(result.current.activeRole).toBe('OWNER_GUARDIAN');
    // The token is never written to localStorage — the browser holds the
    // session as the httpOnly cookie the server just set via Set-Cookie.
    expect(localStorage.getItem('aletheia_token')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(getApiAuthToken()).toBe('new-login-token-456');
  });

  it('registers successfully and sets authenticated state with empty families', async () => {
    const authResponse: AuthResponseDto = {
      accessToken: 'register-token-789',
      user: mockUser,
    };

    vi.spyOn(api, 'get').mockRejectedValue(new ApiError(401, 'Unauthorized', 'No session'));
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(authResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    await act(async () => {
      await result.current.register({
        fullName: 'Guardian Silva',
        email: 'guardian@example.com',
        password: 'secretPassword123',
      });
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/register', {
      fullName: 'Guardian Silva',
      email: 'guardian@example.com',
      password: 'secretPassword123',
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.token).toBe('register-token-789');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.families).toEqual([]);
    expect(result.current.activeFamilyId).toBeNull();
    expect(result.current.activeFamily).toBeNull();
    expect(result.current.activeRole).toBeNull();
    expect(localStorage.getItem('aletheia_token')).toBeNull();
    expect(getApiAuthToken()).toBe('register-token-789');
  });

  it('logs out, notifies the server to clear the session cookie, and clears local state', async () => {
    localStorage.setItem('aletheia_active_family_id', 'family-uuid-1');

    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [mockFamily1];
      throw new Error(`Unexpected path: ${path}`);
    });
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ success: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    act(() => {
      result.current.logout();
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.families).toEqual([]);
    expect(result.current.activeFamilyId).toBeNull();
    expect(result.current.activeFamily).toBeNull();
    expect(result.current.activeRole).toBeNull();
    expect(localStorage.getItem('aletheia_active_family_id')).toBeNull();
    expect(getApiAuthToken()).toBeNull();
  });

  it('selects a different active family and updates activeRole and localStorage', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [mockFamily1, mockFamily2];
      throw new Error(`Unexpected path: ${path}`);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.activeFamilyId).toBe('family-uuid-1');
    expect(result.current.activeRole).toBe('OWNER_GUARDIAN');

    act(() => {
      result.current.selectFamily('family-uuid-2');
    });

    expect(result.current.activeFamilyId).toBe('family-uuid-2');
    expect(result.current.activeFamily).toEqual(mockFamily2);
    expect(result.current.activeRole).toBe('EDUCATOR');
    expect(localStorage.getItem('aletheia_active_family_id')).toBe('family-uuid-2');
  });

  it('adds newly created family via setActiveFamilyFromCreated', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [];
      throw new Error(`Unexpected path: ${path}`);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.families).toEqual([]);
    expect(result.current.activeFamilyId).toBeNull();

    act(() => {
      result.current.setActiveFamilyFromCreated(mockFamily1);
    });

    expect(result.current.families).toEqual([mockFamily1]);
    expect(result.current.activeFamilyId).toBe('family-uuid-1');
    expect(result.current.activeFamily).toEqual(mockFamily1);
    expect(result.current.activeRole).toBe('OWNER_GUARDIAN');
    expect(localStorage.getItem('aletheia_active_family_id')).toBe('family-uuid-1');
  });

  it('listens to window auth:unauthorized event and clears local session without calling logout', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/auth/me') return mockUser;
      if (path === '/families/mine') return [mockFamily1];
      throw new Error(`Unexpected path: ${path}`);
    });
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ success: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(getApiAuthToken()).toBeNull();
    // A 401 means the cookie is already invalid server-side — no need to
    // also call the logout endpoint.
    expect(postSpy).not.toHaveBeenCalledWith('/auth/logout');
  });
});
