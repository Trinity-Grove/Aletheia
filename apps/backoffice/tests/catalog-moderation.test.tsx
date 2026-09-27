import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AuthorTrustProfileResponseDto,
  CurriculumPackResponseDto,
  PackReportResponseDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { api, setApiAuthToken } from '../src/lib/api';
import { AdminAuthProvider } from '../src/lib/auth/admin-auth-context';
import CatalogPage from '../app/catalog/page';
import ModerationPage from '../app/moderation/page';

let mockCurrentPathname = '/catalog';
vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('Catalog and Moderation Views in apps/backoffice', () => {
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

  const mockDomain = {
    id: '00000000-0000-4000-8000-000000000001',
    code: 'MUSIC',
    name: 'Música',
    description: 'Domínio de música',
    status: 'DRAFT',
    version: 1,
  };

  const mockCompetency = {
    id: '00000000-0000-4000-8000-000000000002',
    code: 'MUSIC.BASS',
    title: 'Baixo Elétrico',
    domainId: '00000000-0000-4000-8000-000000000001',
    status: 'DRAFT',
    version: 1,
  };

  const mockOperationLog = {
    id: 'log-1111-1111-1111-1111',
    operationType: 'ROLLBACK' as const,
    definitionCode: 'MUSIC.BASS',
    fromVersion: 2,
    toVersion: 1,
    affectedEntityType: 'CompetencyDefinition',
    affectedEntityIds: [],
    performedByUserId: '11111111-1111-1111-1111-111111111111',
    metadata: { reason: 'Taxonomia corrigida' },
    createdAt: '2026-09-20T12:00:00.000Z',
  };

  const mockPackPending: CurriculumPackResponseDto = {
    id: 'pack-1111-1111',
    code: 'CLASSICAL_TRIVIUM',
    version: 1,
    status: 'DRAFT',
    schemaVersion: '1.0.0',
    name: 'Classical Trivium Pack',
    description: 'Trivium based curriculum',
    metadata: {},
    moderationStatus: 'PENDING_REVIEW',
    createdAt: '2026-09-20T10:00:00Z',
  };

  const mockAuthorTrustProfile: AuthorTrustProfileResponseDto = {
    userId: 'user-author-1',
    trustScore: 85,
    tier: 'VERIFIED',
    approvedPacksCount: 3,
    rejectedPacksCount: 0,
    upheldReportsCount: 0,
    lastEvaluatedAt: '2026-09-20T10:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  };

  const mockQueueItem1 = {
    pack: mockPackPending,
    authorTrustProfile: mockAuthorTrustProfile,
    openReportsCount: 2,
  };

  const mockPackSuspended: CurriculumPackResponseDto = {
    id: 'pack-2222-2222',
    code: 'SUSPENDED_PACK',
    version: 2,
    status: 'DRAFT',
    schemaVersion: '1.0.0',
    name: 'Suspended Pack Title',
    description: 'Suspended description',
    metadata: {},
    moderationStatus: 'SUSPENDED',
    createdAt: '2026-09-21T10:00:00Z',
  };

  const mockQueueItem2 = {
    pack: mockPackSuspended,
    authorTrustProfile: null,
    openReportsCount: 0,
  };

  const mockReportOpen: PackReportResponseDto = {
    id: 'report-1111-1111',
    packId: 'pack-1111-1111',
    reporterUserId: 'rep-user-1',
    reporterFamilyId: 'rep-fam-1',
    reason: 'SPAM_COMMERCIAL',
    details: 'Contains advertising links',
    status: 'OPEN',
    createdAt: '2026-09-22T10:00:00Z',
    resolvedAt: null,
    resolvedByUserId: null,
  };

  const mockReportUpheld: PackReportResponseDto = {
    id: 'report-2222-2222',
    packId: 'pack-2222-2222',
    reporterUserId: 'rep-user-2',
    reporterFamilyId: 'rep-fam-2',
    reason: 'HARMFUL_INAPPROPRIATE',
    details: 'Inappropriate material',
    status: 'UPHELD',
    createdAt: '2026-09-21T08:00:00Z',
    resolvedAt: '2026-09-22T12:00:00Z',
    resolvedByUserId: 'admin',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAuthToken(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Catalog View (/catalog)', () => {
    beforeEach(() => {
      mockCurrentPathname = '/catalog';
      vi.spyOn(api, 'get').mockImplementation(async (path) => {
        if (path === '/auth/me') return mockAdminUser;
        if (path === '/admin/curriculum-definitions/learning-domains') return [mockDomain];
        if (path === '/admin/curriculum-definitions/competency-definitions') return [mockCompetency];
        if (path === '/admin/curriculum-definitions/version-operations/logs') return [mockOperationLog];
        return [];
      });
      vi.spyOn(api, 'post').mockImplementation(async (path, body) => {
        if (path === '/admin/curriculum-definitions/version-operations/rollback') {
          const payload = body as { entityType: string; code: string; version: number };
          return {
            entityType: payload.entityType,
            code: payload.code,
            rolledBackVersion: payload.version,
            newCurrentVersion: 1,
            logId: 'log-rollback-new',
          };
        }
        const b = body as { code: string; name?: string; title?: string };
        const text = b.title || b.name || 'Novo';
        return {
          id: 'new-id',
          code: b.code,
          name: text,
          title: text,
          version: 1,
          status: 'DRAFT',
        };
      });
      vi.spyOn(api, 'patch').mockResolvedValue({
        ...mockDomain,
        status: 'PUBLISHED',
      });
    });

    it('renders inside AdminShell and displays catalog title and navigation', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <CatalogPage />
        </AdminAuthProvider>,
      );

      // Verify AdminShell elements
      expect(screen.getByText('Aletheia Backoffice')).toBeInTheDocument();
      expect(screen.getByText('Catálogo & Definições')).toBeInTheDocument();

      // Verify Catalog elements
      expect(await screen.findByRole('heading', { name: 'Catálogo administrativo' })).toBeInTheDocument();
      expect(screen.getByTestId('tab-platform-catalogs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-version-operations')).toBeInTheDocument();
      expect(screen.getByLabelText('Recurso')).toBeInTheDocument();
      expect(await screen.findByText('Música')).toBeInTheDocument();
      expect(screen.getByText('MUSIC')).toBeInTheDocument();
      expect(screen.getByText('Versão 1')).toBeInTheDocument();
    });

    it('switches resources, creates draft, and publishes definition', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <CatalogPage />
        </AdminAuthProvider>,
      );

      await screen.findByText('Música');

      // Create new learning domain
      fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'ART' } });
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Artes Visuais' } });
      fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Domínio de artes visuais' } });

      fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/admin/curriculum-definitions/learning-domains',
          expect.objectContaining({
            code: 'ART',
            name: 'Artes Visuais',
            description: 'Domínio de artes visuais',
            status: 'DRAFT',
            version: 1,
          }),
        );
      });

      expect(await screen.findByText('Artes Visuais')).toBeInTheDocument();

      // Publish existing draft MUSIC
      const publishBtn = screen.getByRole('button', { name: 'Publicar MUSIC' });
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          '/admin/curriculum-definitions/learning-domains/00000000-0000-4000-8000-000000000001/status',
          { status: 'PUBLISHED' },
        );
      });
    });

    it('switches to version operations tab, shows audit logs, and triggers rollback', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <CatalogPage />
        </AdminAuthProvider>,
      );

      await screen.findByText('Música');

      // Switch tab
      fireEvent.click(screen.getByTestId('tab-version-operations'));

      expect(await screen.findByText('Rollback Lógico de Definições')).toBeInTheDocument();
      expect(screen.getByTestId('version-operation-logs-list')).toBeInTheDocument();
      expect(screen.getByText('MUSIC.BASS')).toBeInTheDocument();
      expect(screen.getByText('Taxonomia corrigida')).toBeInTheDocument();

      // Submit rollback form
      fireEvent.change(screen.getByTestId('rollback-entity-type-select'), {
        target: { value: 'CompetencyDefinition' },
      });
      fireEvent.change(screen.getByTestId('rollback-code-input'), {
        target: { value: 'MUSIC.BASS' },
      });
      fireEvent.change(screen.getByTestId('rollback-version-input'), {
        target: { value: '2' },
      });
      fireEvent.change(screen.getByTestId('rollback-reason-input'), {
        target: { value: 'Correção de escopo' },
      });

      fireEvent.click(screen.getByTestId('execute-rollback-btn'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/admin/curriculum-definitions/version-operations/rollback',
          {
            entityType: 'CompetencyDefinition',
            code: 'MUSIC.BASS',
            version: 2,
            reason: 'Correção de escopo',
          },
        );
      });

      expect(await screen.findByTestId('rollback-success-alert')).toBeInTheDocument();
    });

    it('blocks access if user is not a platform admin', async () => {
      render(
        <AdminAuthProvider initialUser={mockNonAdminUser} initialStatus="unauthorized">
          <CatalogPage />
        </AdminAuthProvider>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Acesso Negado/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Catálogo administrativo' })).not.toBeInTheDocument();
    });
  });

  describe('Moderation View (/moderation)', () => {
    beforeEach(() => {
      mockCurrentPathname = '/moderation';
      vi.spyOn(api, 'get').mockImplementation(async (path, options) => {
        if (path === '/auth/me') return mockAdminUser;
        if (path === '/admin/moderation/queue') {
          return [mockQueueItem1, mockQueueItem2];
        }
        if (path === '/admin/moderation/reports') {
          const status = options?.params?.status;
          if (status === 'OPEN') return [mockReportOpen];
          if (status === 'UPHELD') return [mockReportUpheld];
          if (status === 'DISMISSED') return [];
          return [mockReportOpen, mockReportUpheld];
        }
        return [];
      });

      vi.spyOn(api, 'post').mockImplementation(async (path, body) => {
        if (path.includes('/moderate')) {
          return {
            ...mockPackPending,
            moderationStatus: (body as { action: string }).action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          };
        }
        if (path.includes('/resolve')) {
          return {
            ...mockReportOpen,
            status: (body as { status: string }).status,
            resolvedAt: new Date().toISOString(),
          };
        }
        return {};
      });
    });

    it('renders inside AdminShell, displays moderation queue, and shows author trust badges', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <ModerationPage />
        </AdminAuthProvider>,
      );

      // Verify AdminShell
      expect(screen.getByText('Aletheia Backoffice')).toBeInTheDocument();
      expect(screen.getByText('Moderação Comunitária')).toBeInTheDocument();

      // Verify Moderation dashboard
      await waitFor(() => {
        expect(screen.getByTestId('pack-moderation-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-queue')).toBeInTheDocument();
      expect(screen.getByTestId('tab-reports')).toBeInTheDocument();
      expect(screen.getByTestId('queue-list')).toBeInTheDocument();

      // Verify pending pack
      expect(screen.getByTestId('queue-row-pack-1111-1111')).toBeInTheDocument();
      expect(screen.getByText('Classical Trivium Pack')).toBeInTheDocument();
      expect(screen.getByText('Autor Verificado')).toBeInTheDocument();
      expect(screen.getByTestId('approve-pack-btn-pack-1111-1111')).toBeInTheDocument();
      expect(screen.getByTestId('reject-pack-btn-pack-1111-1111')).toBeInTheDocument();

      // Verify suspended pack
      expect(screen.getByTestId('queue-row-pack-2222-2222')).toBeInTheDocument();
      expect(screen.getByText('Suspended Pack Title')).toBeInTheDocument();
      expect(screen.getByTestId('restore-pack-btn-pack-2222-2222')).toBeInTheDocument();
    });

    it('approves a pack via modal action', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <ModerationPage />
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('approve-pack-btn-pack-1111-1111')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('approve-pack-btn-pack-1111-1111'));

      expect(screen.getByTestId('moderation-notes-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-moderation-action-btn')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('confirm-moderation-action-btn'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/admin/moderation/packs/pack-1111-1111/moderate',
          expect.objectContaining({ action: 'APPROVE' }),
        );
      });
    });

    it('switches to reports tab, filters by OPEN, and resolves report as UPHELD', async () => {
      render(
        <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
          <ModerationPage />
        </AdminAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-reports')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tab-reports'));

      await waitFor(() => {
        expect(screen.getByTestId('reports-list')).toBeInTheDocument();
      });

      // Filter OPEN
      fireEvent.click(screen.getByTestId('filter-open'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/admin/moderation/reports',
          expect.objectContaining({ params: { status: 'OPEN' } }),
        );
      });

      // Uphold
      expect(screen.getByTestId('report-row-report-1111-1111')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('uphold-report-btn-report-1111-1111'));

      const notesInput = screen.getByTestId('moderation-notes-input');
      fireEvent.change(notesInput, { target: { value: 'Spam confirmado.' } });

      fireEvent.click(screen.getByTestId('confirm-moderation-action-btn'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/admin/moderation/reports/report-1111-1111/resolve',
          expect.objectContaining({
            status: 'UPHELD',
            notes: 'Spam confirmado.',
          }),
        );
      });
    });

    it('blocks access if user is not a platform admin', async () => {
      render(
        <AdminAuthProvider initialUser={mockNonAdminUser} initialStatus="unauthorized">
          <ModerationPage />
        </AdminAuthProvider>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Acesso Negado/i })).toBeInTheDocument();
      expect(screen.queryByTestId('pack-moderation-dashboard')).not.toBeInTheDocument();
    });
  });
});
