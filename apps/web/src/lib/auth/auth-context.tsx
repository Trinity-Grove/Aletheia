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
import { api, ApiError, getApiAuthToken, setApiAuthToken } from '../api';

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

const TOKEN_STORAGE_KEY = 'aletheia_token';
const ACTIVE_FAMILY_ID_STORAGE_KEY = 'aletheia_active_family_id';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage write failures
  }
}

function getStoredActiveFamilyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_FAMILY_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredActiveFamilyId(familyId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (familyId) {
      localStorage.setItem(ACTIVE_FAMILY_ID_STORAGE_KEY, familyId);
    } else {
      localStorage.removeItem(ACTIVE_FAMILY_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage write failures
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [families, setFamilies] = useState<FamilyResponseDto[]>([]);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  const logout = useCallback((): void => {
    setStoredToken(null);
    setStoredActiveFamilyId(null);
    setApiAuthToken(null);
    setUser(null);
    setToken(null);
    setFamilies([]);
    setActiveFamilyId(null);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async (): Promise<void> => {
    const currentToken = getStoredToken() ?? getApiAuthToken();
    if (!currentToken) {
      logout();
      return;
    }

    setApiAuthToken(currentToken);
    setToken(currentToken);

    try {
      const [meResponse, familiesResponse] = await Promise.all([
        api.get<UserSummaryDto>('/auth/me'),
        api.get<FamilyResponseDto[]>('/families/mine').catch(() => [] as FamilyResponseDto[]),
      ]);

      setUser(meResponse);
      const fetchedFamilies = Array.isArray(familiesResponse) ? familiesResponse : [];
      setFamilies(fetchedFamilies);

      const storedFamilyId = getStoredActiveFamilyId();
      let selectedFamilyId: string | null = null;

      if (storedFamilyId && fetchedFamilies.some((f) => f.id === storedFamilyId)) {
        selectedFamilyId = storedFamilyId;
      } else if (fetchedFamilies.length > 0 && fetchedFamilies[0]) {
        selectedFamilyId = fetchedFamilies[0].id;
        setStoredActiveFamilyId(selectedFamilyId);
      } else {
        selectedFamilyId = null;
        setStoredActiveFamilyId(null);
      }

      setActiveFamilyId(selectedFamilyId);
      setStatus('authenticated');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 401) {
        logout();
        return;
      }
      throw err;
    }
  }, [logout]);

  const login = useCallback(
    async (credentials: LoginDto): Promise<void> => {
      const res = await api.post<AuthResponseDto>('/auth/login', credentials);
      const accessToken = res.accessToken;
      const loggedUser = res.user;

      setStoredToken(accessToken);
      setApiAuthToken(accessToken);
      setToken(accessToken);
      setUser(loggedUser);

      let fetchedFamilies: FamilyResponseDto[] = [];
      try {
        const familiesRes = await api.get<FamilyResponseDto[]>('/families/mine');
        fetchedFamilies = Array.isArray(familiesRes) ? familiesRes : [];
      } catch {
        fetchedFamilies = [];
      }

      setFamilies(fetchedFamilies);

      const storedFamilyId = getStoredActiveFamilyId();
      let selectedFamilyId: string | null = null;

      if (storedFamilyId && fetchedFamilies.some((f) => f.id === storedFamilyId)) {
        selectedFamilyId = storedFamilyId;
      } else if (fetchedFamilies.length > 0 && fetchedFamilies[0]) {
        selectedFamilyId = fetchedFamilies[0].id;
        setStoredActiveFamilyId(selectedFamilyId);
      } else {
        selectedFamilyId = null;
        setStoredActiveFamilyId(null);
      }

      setActiveFamilyId(selectedFamilyId);
      setStatus('authenticated');
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterGuardianDto): Promise<void> => {
      const res = await api.post<AuthResponseDto>('/auth/register', data);
      const accessToken = res.accessToken;
      const registeredUser = res.user;

      setStoredToken(accessToken);
      setApiAuthToken(accessToken);
      setToken(accessToken);
      setUser(registeredUser);
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
      logout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setStatus('unauthenticated');
      return;
    }

    setApiAuthToken(storedToken);
    setToken(storedToken);

    refreshSession().catch((err: unknown) => {
      if (err instanceof ApiError && err.statusCode === 401) {
        logout();
      } else {
        setStatus('unauthenticated');
      }
    });
  }, [refreshSession, logout]);

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

