'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AuthResponseDto,
  FamilyResponseDto,
  FamilyRole,
  LoginDto,
  RegisterGuardianDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { api, ApiError, setApiAuthToken } from '../api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserSummaryDto | null;
  token: string | null;
  activeFamilyId: string | null;
  activeFamily: FamilyResponseDto | null;
  families: FamilyResponseDto[];
  activeRole: FamilyRole | null;
  login: (_credentials: LoginDto) => Promise<void>;
  register: (_data: RegisterGuardianDto) => Promise<void>;
  logout: () => void;
  selectFamily: (_familyId: string) => void;
  refreshSession: () => Promise<void>;
  setActiveFamilyFromCreated: (_family: FamilyResponseDto) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const ACTIVE_FAMILY_ID_STORAGE_KEY = 'aletheia_active_family_id';

function getStoredActiveFamilyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_FAMILY_ID_STORAGE_KEY) ?? localStorage.getItem('familyId');
  } catch {
    return null;
  }
}

function setStoredActiveFamilyId(familyId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (familyId) {
      localStorage.setItem(ACTIVE_FAMILY_ID_STORAGE_KEY, familyId);
      localStorage.setItem('familyId', familyId);
    } else {
      localStorage.removeItem(ACTIVE_FAMILY_ID_STORAGE_KEY);
      localStorage.removeItem('familyId');
    }
  } catch {
    // Ignore localStorage write failures
  }
}

function selectDefaultFamilyId(fetchedFamilies: FamilyResponseDto[]): string | null {
  const storedFamilyId = getStoredActiveFamilyId();

  if (storedFamilyId && fetchedFamilies.some((f) => f.id === storedFamilyId)) {
    return storedFamilyId;
  }

  if (fetchedFamilies.length > 0 && fetchedFamilies[0]) {
    setStoredActiveFamilyId(fetchedFamilies[0].id);
    return fetchedFamilies[0].id;
  }

  setStoredActiveFamilyId(null);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [families, setFamilies] = useState<FamilyResponseDto[]>([]);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  // Resets client-side session state. Does not itself notify the server —
  // the httpOnly session cookie (if any) is cleared separately by logout().
  const clearLocalSession = useCallback((): void => {
    setStoredActiveFamilyId(null);
    setApiAuthToken(null);
    setUser(null);
    setToken(null);
    setFamilies([]);
    setActiveFamilyId(null);
    setStatus('unauthenticated');
  }, []);

  const logout = useCallback((): void => {
    api.post('/auth/logout').catch(() => {
      // Best-effort: local state is cleared regardless of network failure.
    });
    clearLocalSession();
  }, [clearLocalSession]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const [meResponse, familiesResponse] = await Promise.all([
        api.get<UserSummaryDto>('/auth/me'),
        api.get<FamilyResponseDto[]>('/families/mine').catch(() => [] as FamilyResponseDto[]),
      ]);

      setUser(meResponse);
      const fetchedFamilies = Array.isArray(familiesResponse) ? familiesResponse : [];
      setFamilies(fetchedFamilies);
      setActiveFamilyId(selectDefaultFamilyId(fetchedFamilies));
      setStatus('authenticated');
    } catch (err: unknown) {
      // A session cookie may simply not exist yet (first visit) or may have
      // expired — either way, the correct outcome is "not logged in", not
      // an uncaught rejection.
      if (err instanceof ApiError && err.statusCode === 401) {
        clearLocalSession();
        return;
      }
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const login = useCallback(
    async (credentials: LoginDto): Promise<void> => {
      const res = await api.post<AuthResponseDto>('/auth/login', credentials);
      setApiAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);

      let fetchedFamilies: FamilyResponseDto[] = [];
      try {
        const familiesRes = await api.get<FamilyResponseDto[]>('/families/mine');
        fetchedFamilies = Array.isArray(familiesRes) ? familiesRes : [];
      } catch {
        fetchedFamilies = [];
      }

      setFamilies(fetchedFamilies);
      setActiveFamilyId(selectDefaultFamilyId(fetchedFamilies));
      setStatus('authenticated');
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterGuardianDto): Promise<void> => {
      const res = await api.post<AuthResponseDto>('/auth/register', data);
      setApiAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      setFamilies([]);
      setActiveFamilyId(null);
      setStoredActiveFamilyId(null);
      setStatus('authenticated');
    },
    [],
  );

  const selectFamily = useCallback((familyId: string): void => {
    setActiveFamilyId(familyId);
    setStoredActiveFamilyId(familyId);
  }, []);

  const setActiveFamilyFromCreated = useCallback((family: FamilyResponseDto): void => {
    setFamilies((prev) => {
      const exists = prev.some((f) => f.id === family.id);
      if (exists) {
        return prev.map((f) => (f.id === family.id ? family : f));
      }
      return [...prev, family];
    });
    setActiveFamilyId(family.id);
    setStoredActiveFamilyId(family.id);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearLocalSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, [clearLocalSession]);

  // The session lives in an httpOnly cookie the browser attaches
  // automatically (see apiClient's `credentials: 'include'`) — it can't be
  // inspected from JS, so the only way to know whether a session exists is
  // to ask the server.
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const activeFamily = useMemo<FamilyResponseDto | null>(() => {
    if (!activeFamilyId) return null;
    return families.find((f) => f.id === activeFamilyId) ?? null;
  }, [families, activeFamilyId]);

  const activeRole = useMemo<FamilyRole | null>(() => {
    if (!activeFamily || !user) return null;
    if (activeFamily.members && activeFamily.members.length > 0) {
      const member = activeFamily.members.find((m) => m.userId === user.id);
      if (member) return member.role;
    }
    return 'OWNER_GUARDIAN';
  }, [activeFamily, user]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      activeFamilyId,
      activeFamily,
      families,
      activeRole,
      login,
      register,
      logout,
      selectFamily,
      refreshSession,
      setActiveFamilyFromCreated,
    }),
    [
      status,
      user,
      token,
      activeFamilyId,
      activeFamily,
      families,
      activeRole,
      login,
      register,
      logout,
      selectFamily,
      refreshSession,
      setActiveFamilyFromCreated,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
