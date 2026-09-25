'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthResponseDto, UserSummaryDto } from '@aletheia/contracts';
import { api, setApiAuthToken } from '../api';

export type AdminAuthStatus = 'loading' | 'authenticated' | 'unauthorized' | 'unauthenticated';

export interface AdminAuthContextValue {
  user: UserSummaryDto | null;
  status: AdminAuthStatus;
  login: (_credentials: { email: string; password: string }) => Promise<AuthResponseDto>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export interface AdminAuthProviderProps {
  children: React.ReactNode;
  initialUser?: UserSummaryDto | null;
  initialStatus?: AdminAuthStatus;
}

export function AdminAuthProvider({
  children,
  initialUser,
  initialStatus,
}: AdminAuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<UserSummaryDto | null>(initialUser ?? null);
  const [status, setStatus] = useState<AdminAuthStatus>(initialStatus ?? 'loading');

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const meResponse = await api.get<UserSummaryDto>('/auth/me');
      setUser(meResponse);
      if (meResponse.isPlatformAdmin === true) {
        setStatus('authenticated');
      } else {
        setStatus('unauthorized');
      }
    } catch {
      setApiAuthToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<AuthResponseDto> => {
      try {
        const res = await api.post<AuthResponseDto>('/auth/login', credentials);
        setApiAuthToken(res.accessToken);
        setUser(res.user);
        if (res.user.isPlatformAdmin === true) {
          setStatus('authenticated');
        } else {
          setStatus('unauthorized');
        }
        return res;
      } catch (err) {
        setApiAuthToken(null);
        setUser(null);
        setStatus('unauthenticated');
        throw err;
      }
    },
    [],
  );

  const logout = useCallback((): void => {
    api.post('/auth/logout').catch(() => {
      // Best-effort
    });
    setApiAuthToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    if (initialStatus === undefined) {
      refreshSession();
    }
  }, [initialStatus, refreshSession]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ user, status, login, logout, refreshSession }),
    [user, status, login, logout, refreshSession],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function AdminGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const { status, logout } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Carregando..."
        data-testid="admin-guard-loading"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-muted, #64748b)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}
      >
        <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>
          Carregando painel administrativo...
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div
        role="alert"
        data-testid="admin-guard-unauthorized"
        style={{
          maxWidth: '560px',
          margin: '5rem auto',
          padding: '2.5rem',
          borderRadius: '12px',
          border: '1px solid var(--color-rose-300, #fca5a5)',
          backgroundColor: 'var(--color-rose-50, #fff1f2)',
          color: 'var(--color-rose-950, #4c0519)',
          fontFamily: 'var(--font-sans, sans-serif)',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: 'var(--color-rose-700, #be123c)',
          }}
        >
          Acesso Negado
        </h2>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
            color: 'var(--color-rose-900, #881337)',
          }}
        >
          Acesso Negado. Esta área é restrita a administradores da plataforma Aletheia.
        </p>
        <button
          type="button"
          onClick={logout}
          data-testid="admin-guard-logout"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid var(--color-rose-300, #fca5a5)',
            backgroundColor: '#ffffff',
            color: 'var(--color-rose-700, #be123c)',
            cursor: 'pointer',
          }}
        >
          Logout / Sair
        </button>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div
        data-testid="admin-guard-unauthenticated"
        style={{
          maxWidth: '480px',
          margin: '5rem auto',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid var(--line, #e2e8f0)',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Autenticação Necessária
        </h2>
        <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '1.5rem' }}>
          Você precisa estar autenticado como administrador para acessar o Backoffice.
        </p>
        <a
          href="/login"
          data-testid="admin-login-link"
          style={{
            display: 'inline-block',
            padding: '0.625rem 1.25rem',
            borderRadius: '6px',
            backgroundColor: 'var(--forest, #1e3a2f)',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Ir para o Login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
