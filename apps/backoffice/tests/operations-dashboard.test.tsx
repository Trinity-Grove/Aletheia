import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  OperationalAlertEventDto,
  OperationalStatusResponseDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { api, setApiAuthToken } from '../src/lib/api';
import { AdminAuthProvider } from '../src/lib/auth/admin-auth-context';
import OperationsPage from '../app/operations/page';

let mockCurrentPathname = '/operations';
vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('Operational Dashboard and Railway Cockpit in apps/backoffice (/operations)', () => {
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

  const mockStatus: OperationalStatusResponseDto = {
    service: 'aletheia-api',
    version: '0.1.0',
    uptimeSeconds: 3665,
    timestamp: '2026-09-25T12:00:00.000Z',
    overallHealth: 'HEALTHY',
    dependencies: {
      postgres: {
        status: 'UP',
        responseTimeMs: 8,
        activeConnections: 12,
      },
      objectStorage: {
        status: 'UP',
        responseTimeMs: 25,
        details: { bucket: 'aletheia-storage' },
      },
      redis: {
        status: 'NOT_CONFIGURED',
        responseTimeMs: 0,
      },
    },
    resources: {
      memoryHeapUsedMb: 64,
      memoryHeapTotalMb: 128,
      memoryRssMb: 180,
      nodeVersion: 'v24.13.3',
    },
    railwayDashboardLinks: {
      projectUrl: 'https://railway.com/project/prj-aletheia-123',
      metricsUrl: 'https://railway.com/project/prj-aletheia-123/metrics',
      logsUrl: 'https://railway.com/project/prj-aletheia-123/logs',
    },
  };

  const mockAlertCritical: OperationalAlertEventDto = {
    id: 'alert-1111-1111-1111-1111',
    source: 'RAILWAY',
    eventType: 'CRASH',
    severity: 'CRITICAL',
    serviceName: 'aletheia-api',
    message: 'Process killed by OOM killer',
    payload: { exitCode: 137 },
    receivedAt: '2026-09-25T11:00:00.000Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
  };

  const mockAlertWarning: OperationalAlertEventDto = {
    id: 'alert-2222-2222-2222-2222',
    source: 'RAILWAY',
    eventType: 'RESOURCE_ALERT',
    severity: 'WARNING',
    serviceName: 'postgres',
    message: 'Connection pool near 80% saturation',
    payload: { saturation: 0.8 },
    receivedAt: '2026-09-25T10:00:00.000Z',
    acknowledgedAt: '2026-09-25T10:30:00.000Z',
    acknowledgedBy: '11111111-1111-1111-1111-111111111111',
  };

  const mockAlertInfo: OperationalAlertEventDto = {
    id: 'alert-3333-3333-3333-3333',
    source: 'RAILWAY',
    eventType: 'DEPLOY_SUCCESS',
    severity: 'INFO',
    serviceName: 'aletheia-api',
    message: 'Deployment v0.1.0 completed successfully',
    payload: {},
    receivedAt: '2026-09-25T09:00:00.000Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAuthToken(null);
    mockCurrentPathname = '/operations';

    vi.spyOn(api, 'get').mockImplementation(async (path, options) => {
      if (path === '/auth/me') return mockAdminUser;
      if (path === '/admin/operations/status') return mockStatus;
      if (path === '/admin/operations/alerts') {
        const acknowledged = options?.params?.acknowledged;
        if (acknowledged === 'false' || acknowledged === false) {
          return [mockAlertCritical, mockAlertInfo];
        }
        if (acknowledged === 'true' || acknowledged === true) {
          return [mockAlertWarning];
        }
        return [mockAlertCritical, mockAlertWarning, mockAlertInfo];
      }
      return [];
    });

    vi.spyOn(api, 'post').mockImplementation(async (path) => {
      if (path === '/admin/operations/alerts/alert-1111-1111-1111-1111/acknowledge') {
        return {
          ...mockAlertCritical,
          acknowledgedAt: '2026-09-25T12:30:00.000Z',
          acknowledgedBy: mockAdminUser.id,
        };
      }
      return {};
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders inside AdminShell and displays operational dashboard header and runtime metrics', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    // AdminShell check
    expect(screen.getByText('Aletheia Backoffice')).toBeInTheDocument();
    expect(screen.getByText('Operações & Infraestrutura')).toBeInTheDocument();

    // Operational Dashboard header elements
    expect(await screen.findByRole('heading', { name: /Painel Operacional & Observabilidade/i })).toBeInTheDocument();
    expect(screen.getByTestId('overall-health-badge')).toHaveTextContent('HEALTHY');
    expect(screen.getByText(/v24\.13\.3/i)).toBeInTheDocument();
    expect(screen.getByText(/64 MB/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atualizar Dados/i })).toBeInTheDocument();
  });

  it('renders dependency probes grid with PostgreSQL, Object Storage, and Redis status and latencies', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    // PostgreSQL probe card
    const pgCard = await screen.findByTestId('probe-postgres');
    expect(pgCard).toBeInTheDocument();
    expect(pgCard).toHaveTextContent('PostgreSQL');
    expect(pgCard).toHaveTextContent('UP');
    expect(pgCard).toHaveTextContent('8 ms');
    expect(pgCard).toHaveTextContent('12 conexões');

    // Object Storage probe card
    const storageCard = screen.getByTestId('probe-object-storage');
    expect(storageCard).toBeInTheDocument();
    expect(storageCard).toHaveTextContent('Railway S3 Bucket (Tigris)');
    expect(storageCard).toHaveTextContent('UP');
    expect(storageCard).toHaveTextContent('25 ms');

    // Redis probe card
    const redisCard = screen.getByTestId('probe-redis');
    expect(redisCard).toBeInTheDocument();
    expect(redisCard).toHaveTextContent('Redis');
    expect(redisCard).toHaveTextContent('NOT_CONFIGURED');
    expect(redisCard).toHaveTextContent('0 ms');
  });

  it('renders Railway Cockpit with external deep links having target="_blank" and rel="noreferrer"', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    await screen.findByTestId('railway-metrics-card');

    // Latency link
    const latencyLink = screen.getByTestId('railway-link-latency');
    expect(latencyLink).toHaveAttribute('href', 'https://railway.com/project/prj-aletheia-123/metrics');
    expect(latencyLink).toHaveAttribute('target', '_blank');
    expect(latencyLink.getAttribute('rel')).toContain('noreferrer');

    // Error rate link
    const errorRateLink = screen.getByTestId('railway-link-errors');
    expect(errorRateLink).toHaveAttribute('href', 'https://railway.com/project/prj-aletheia-123/metrics');
    expect(errorRateLink).toHaveAttribute('target', '_blank');
    expect(errorRateLink.getAttribute('rel')).toContain('noreferrer');

    // Resource usage link
    const resourcesLink = screen.getByTestId('railway-link-resources');
    expect(resourcesLink).toHaveAttribute('href', 'https://railway.com/project/prj-aletheia-123/metrics');
    expect(resourcesLink).toHaveAttribute('target', '_blank');
    expect(resourcesLink.getAttribute('rel')).toContain('noreferrer');

    // Logs link
    const logsLink = screen.getByTestId('railway-link-logs');
    expect(logsLink).toHaveAttribute('href', 'https://railway.com/project/prj-aletheia-123/logs');
    expect(logsLink).toHaveAttribute('target', '_blank');
    expect(logsLink.getAttribute('rel')).toContain('noreferrer');

    // Project link
    const projectLink = screen.getByTestId('railway-link-project');
    expect(projectLink).toHaveAttribute('href', 'https://railway.com/project/prj-aletheia-123');
    expect(projectLink).toHaveAttribute('target', '_blank');
    expect(projectLink.getAttribute('rel')).toContain('noreferrer');

    // Explanatory note
    expect(
      screen.getByText(/infraestrutura nativa do Railway sem overhead no container/i),
    ).toBeInTheDocument();
  });

  it('renders operational alerts feed with badges, messages, and allows status filtering', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    await screen.findByTestId('operational-alerts-feed');

    // Check alerts content and badges
    expect(screen.getByText('Process killed by OOM killer')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();

    expect(screen.getByText('Connection pool near 80% saturation')).toBeInTheDocument();
    expect(screen.getByText('WARNING')).toBeInTheDocument();

    expect(screen.getByText('Deployment v0.1.0 completed successfully')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();

    // Check filter buttons
    const filterPending = screen.getByTestId('alert-filter-pending');
    fireEvent.click(filterPending);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/operations/alerts',
        expect.objectContaining({ params: expect.objectContaining({ acknowledged: 'false' }) }),
      );
    });

    const filterAcknowledged = screen.getByTestId('alert-filter-acknowledged');
    fireEvent.click(filterAcknowledged);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/operations/alerts',
        expect.objectContaining({ params: expect.objectContaining({ acknowledged: 'true' }) }),
      );
    });
  });

  it('allows acknowledging an alert and updates UI state', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    await screen.findByTestId('operational-alerts-feed');

    // Find acknowledge button for alert 1
    const ackBtn = screen.getByTestId('ack-alert-alert-1111-1111-1111-1111');
    expect(ackBtn).toHaveTextContent(/Reconhecer/i);

    fireEvent.click(ackBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/operations/alerts/alert-1111-1111-1111-1111/acknowledge',
      );
    });

    // Alert 1 should now be displayed as recognized
    await waitFor(() => {
      expect(screen.getByTestId('acknowledged-info-alert-1111-1111-1111-1111')).toBeInTheDocument();
    });
  });

  it('refreshes operational data when clicking the refresh button', async () => {
    render(
      <AdminAuthProvider initialUser={mockAdminUser} initialStatus="authenticated">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    const refreshBtn = await screen.findByRole('button', { name: /Atualizar Dados/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/operations/status');
    });
  });

  it('blocks access if user is not a platform admin', async () => {
    render(
      <AdminAuthProvider initialUser={mockNonAdminUser} initialStatus="unauthorized">
        <OperationsPage />
      </AdminAuthProvider>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Acesso Negado/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Painel Operacional/i })).not.toBeInTheDocument();
  });
});
