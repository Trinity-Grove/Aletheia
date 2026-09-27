import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import type { UserSummaryDto } from '@aletheia/contracts';
import { api, ApiError, setApiAuthToken } from '../src/lib/api';
import {
  AdminAuthProvider,
  AdminGuard,
} from '../src/lib/auth/admin-auth-context';
import { AdminShell } from '../src/components/layout/admin-shell';

describe('AdminAuthContext, AdminGuard and AdminShell', () => {
  const mockAdminUser: UserSummaryDto = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@aletheia.com',
    fullName: 'Platform Admin',
    emailVerified: true,
    mfaEnabled: true,
    isPlatformAdmin: true,
    createdAt: '2026-08-30T00:00:00.000Z',
  };

  const mockNonAdminUser: UserSummaryDto = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    fullName: 'Standard User',
    emailVerified: true,
    mfaEnabled: false,
    isPlatformAdmin: false,
    createdAt: '2026-08-30T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAuthToken(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AdminGuard', () => {
    it('renders "Acesso Negado" banner and does NOT render children when user is non-admin', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce(mockNonAdminUser);

      render(
        <AdminAuthProvider>
          <AdminGuard>
            <div data-testid="protected-content">Conteúdo Protegido</div>
          </AdminGuard>
        </AdminAuthProvider>,
      );

      // Loading initially
      expect(screen.getByRole('status', { name: /carregando/i })).toBeInTheDocument();

      // After /auth/me resolves
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /Acesso Negado/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Esta área é restrita a administradores da plataforma Aletheia/i),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout|sair/i })).toBeInTheDocument();
    });

    it('renders children when user is platform admin', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce(mockAdminUser);

      render(
        <AdminAuthProvider>
          <AdminGuard>
            <div data-testid="protected-content">Conteúdo Protegido</div>
          </AdminGuard>
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    });

    it('renders login prompt and does NOT render children when user is unauthenticated (401)', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Não autenticado'),
      );

      render(
        <AdminAuthProvider>
          <AdminGuard>
            <div data-testid="protected-content">Conteúdo Protegido</div>
          </AdminGuard>
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-guard-unauthenticated')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
    });

    it('allows logging out from unauthorized view', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce(mockNonAdminUser);
      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({});

      render(
        <AdminAuthProvider>
          <AdminGuard>
            <div data-testid="protected-content">Conteúdo Protegido</div>
          </AdminGuard>
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const logoutBtn = screen.getByRole('button', { name: /logout|sair/i });
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/logout');
        expect(screen.getByTestId('admin-guard-unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('AdminShell', () => {
    it('renders brand, admin badge, user details, navigation links, and content slot', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce(mockAdminUser);

      render(
        <AdminAuthProvider>
          <AdminShell>
            <div data-testid="page-slot">Dashboard de Teste</div>
          </AdminShell>
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Aletheia Backoffice')).toBeInTheDocument();
      });

      // Header Brand and Badge
      expect(screen.getByText('Administração da Plataforma')).toBeInTheDocument();

      // User info
      expect(screen.getByText('Platform Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@aletheia.com')).toBeInTheDocument();

      // Navigation links
      const opsLink = screen.getByRole('link', { name: /Operações & Infraestrutura/i });
      expect(opsLink).toHaveAttribute('href', '/operations');

      const catalogLink = screen.getByRole('link', { name: /Catálogo & Definições/i });
      expect(catalogLink).toHaveAttribute('href', '/catalog');

      const moderationLink = screen.getByRole('link', { name: /Moderação Comunitária/i });
      expect(moderationLink).toHaveAttribute('href', '/moderation');

      // Logout button
      expect(screen.getByTestId('admin-header-logout')).toBeInTheDocument();

      // Main content
      expect(screen.getByTestId('page-slot')).toBeInTheDocument();
      expect(screen.getByText('Dashboard de Teste')).toBeInTheDocument();
    });

    it('triggers logout when clicking logout button in AdminShell header', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce(mockAdminUser);
      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({});

      render(
        <AdminAuthProvider>
          <AdminShell>
            <div>Main Content</div>
          </AdminShell>
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Platform Admin')).toBeInTheDocument();
      });

      const logoutBtn = screen.getByTestId('admin-header-logout');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/logout');
      });
    });
  });
});
