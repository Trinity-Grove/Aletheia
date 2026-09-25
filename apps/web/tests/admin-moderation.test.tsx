import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminModerationPage from '../app/(dashboard)/admin/moderation/page';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { api } from '../src/lib/api';
import type {
  AuthorTrustProfileResponseDto,
  CurriculumPackResponseDto,
  PackReportResponseDto,
} from '@aletheia/contracts';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/moderation',
  useRouter: () => router,
}));

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
  openReportsCount: 1,
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

function createAuthContextValue(
  isPlatformAdmin = true,
  status: AuthContextValue['status'] = 'authenticated',
): AuthContextValue {
  return {
    status,
    user:
      status === 'authenticated'
        ? {
            id: 'admin-user-id',
            email: 'admin@aletheia.edu',
            fullName: 'Platform Admin',
            emailVerified: true,
            mfaEnabled: false,
            isPlatformAdmin,
            createdAt: '2026-01-01T00:00:00Z',
          }
        : null,
    token: 'test-token',
    activeFamilyId: 'admin-family-id',
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

function renderModerationPage(authValue = createAuthContextValue(true)) {
  return render(
    <AuthContext.Provider value={authValue}>
      <LocaleProvider>
        <AdminModerationPage />
      </LocaleProvider>
    </AuthContext.Provider>,
  );
}

describe('Platform Admin Moderation Dashboard (Task 8)', () => {
  beforeEach(() => {
    vi.spyOn(api, 'get').mockImplementation(async (path, options) => {
      if (path === '/admin/moderation/queue') {
        return [mockQueueItem1, mockQueueItem2];
      }
      if (path === '/admin/moderation/reports') {
        const status = options?.params?.status;
        if (status === 'OPEN') {
          return [mockReportOpen];
        }
        if (status === 'UPHELD') {
          return [mockReportUpheld];
        }
        if (status === 'DISMISSED') {
          return [];
        }
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

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. Blocks non-platform admin users and renders unauthorized view', async () => {
    renderModerationPage(createAuthContextValue(false));

    expect(screen.getByTestId('unauthorized-admin-view')).toBeInTheDocument();
    expect(
      screen.getByText('Acesso restrito a administradores da plataforma.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('pack-moderation-dashboard')).not.toBeInTheDocument();
  });

  it('2. Renders moderation queue with packs, author badges, and open reports count', async () => {
    renderModerationPage();

    await waitFor(() => {
      expect(screen.getByTestId('pack-moderation-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('tab-queue')).toBeInTheDocument();
    expect(screen.getByTestId('tab-reports')).toBeInTheDocument();
    expect(screen.getByTestId('queue-list')).toBeInTheDocument();

    // Verify pack 1 row
    expect(screen.getByTestId('queue-row-pack-1111-1111')).toBeInTheDocument();
    expect(screen.getByText('Classical Trivium Pack')).toBeInTheDocument();
    expect(screen.getByText('CLASSICAL_TRIVIUM')).toBeInTheDocument();
    expect(screen.getByText('Autor Verificado')).toBeInTheDocument();
    expect(screen.getByTestId('approve-pack-btn-pack-1111-1111')).toBeInTheDocument();
    expect(screen.getByTestId('reject-pack-btn-pack-1111-1111')).toBeInTheDocument();

    // Verify pack 2 row
    expect(screen.getByTestId('queue-row-pack-2222-2222')).toBeInTheDocument();
    expect(screen.getByText('Suspended Pack Title')).toBeInTheDocument();
    expect(screen.getByTestId('restore-pack-btn-pack-2222-2222')).toBeInTheDocument();
    expect(screen.getByTestId('reject-pack-btn-pack-2222-2222')).toBeInTheDocument();
  });

  it('3. Approves a pack via POST /admin/moderation/packs/:id/moderate with action: APPROVE', async () => {
    renderModerationPage();

    await waitFor(() => {
      expect(screen.getByTestId('approve-pack-btn-pack-1111-1111')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('approve-pack-btn-pack-1111-1111'));

    // Modal opens
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

  it('4. Rejects a pack with justification notes', async () => {
    renderModerationPage();

    await waitFor(() => {
      expect(screen.getByTestId('reject-pack-btn-pack-1111-1111')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('reject-pack-btn-pack-1111-1111'));

    const notesInput = screen.getByTestId('moderation-notes-input');
    fireEvent.change(notesInput, {
      target: { value: 'Violação de direitos autorais identificada no material.' },
    });

    fireEvent.click(screen.getByTestId('confirm-moderation-action-btn'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/moderation/packs/pack-1111-1111/moderate',
        expect.objectContaining({
          action: 'REJECT',
          notes: 'Violação de direitos autorais identificada no material.',
        }),
      );
    });
  });

  it('5. Switches to reports tab, filters reports, and resolves a report as UPHELD', async () => {
    renderModerationPage();

    await waitFor(() => {
      expect(screen.getByTestId('tab-reports')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-reports'));

    await waitFor(() => {
      expect(screen.getByTestId('reports-list')).toBeInTheDocument();
    });

    // Check filter buttons
    expect(screen.getByTestId('filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-open')).toBeInTheDocument();
    expect(screen.getByTestId('filter-upheld')).toBeInTheDocument();
    expect(screen.getByTestId('filter-dismissed')).toBeInTheDocument();

    // Click OPEN filter
    fireEvent.click(screen.getByTestId('filter-open'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/moderation/reports',
        expect.objectContaining({ params: { status: 'OPEN' } }),
      );
    });

    // Uphold report
    expect(screen.getByTestId('report-row-report-1111-1111')).toBeInTheDocument();
    expect(screen.getByTestId('uphold-report-btn-report-1111-1111')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('uphold-report-btn-report-1111-1111'));

    const notesInput = screen.getByTestId('moderation-notes-input');
    fireEvent.change(notesInput, { target: { value: 'Spam confirmado e removido.' } });

    fireEvent.click(screen.getByTestId('confirm-moderation-action-btn'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/moderation/reports/report-1111-1111/resolve',
        expect.objectContaining({
          status: 'UPHELD',
          notes: 'Spam confirmado e removido.',
        }),
      );
    });
  });

  it('6. Resolves a report as DISMISSED', async () => {
    renderModerationPage();

    await waitFor(() => {
      expect(screen.getByTestId('tab-reports')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-reports'));

    await waitFor(() => {
      expect(screen.getByTestId('report-row-report-1111-1111')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dismiss-report-btn-report-1111-1111')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dismiss-report-btn-report-1111-1111'));

    const notesInput = screen.getByTestId('moderation-notes-input');
    fireEvent.change(notesInput, { target: { value: 'Denúncia improcedente, conteúdo legítimo.' } });

    fireEvent.click(screen.getByTestId('confirm-moderation-action-btn'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/moderation/reports/report-1111-1111/resolve',
        expect.objectContaining({
          status: 'DISMISSED',
          notes: 'Denúncia improcedente, conteúdo legítimo.',
        }),
      );
    });
  });
});
