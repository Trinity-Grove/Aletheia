'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { OperationalStatusResponseDto } from '@aletheia/contracts';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@aletheia/ui';
import { api } from '../../lib/api';
import { RailwayMetricsCard } from './railway-metrics-card';
import { OperationalAlertsFeed } from './operational-alerts-feed';

export interface OperationalDashboardProps {
  initialStatus?: OperationalStatusResponseDto | undefined;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export function OperationalDashboard({
  initialStatus,
}: OperationalDashboardProps): React.ReactElement {
  const [status, setStatus] = useState<OperationalStatusResponseDto | null>(initialStatus || null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.get<OperationalStatusResponseDto>('/admin/operations/status');
      setStatus(data);
    } catch {
      setErrorMessage('Falha ao obter status operacional e saturação de dependências.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRefresh = () => {
    loadStatus();
    setRefreshTrigger((prev) => prev + 1);
  };

  const getHealthBadgeVariant = (health?: string) => {
    switch (health) {
      case 'HEALTHY':
        return 'emerald' as const;
      case 'DEGRADED':
        return 'amber' as const;
      case 'CRITICAL':
        return 'rose' as const;
      default:
        return 'slate' as const;
    }
  };

  const getProbeBadgeVariant = (probeStatus?: string) => {
    switch (probeStatus) {
      case 'UP':
        return 'emerald' as const;
      case 'DEGRADED':
        return 'amber' as const;
      case 'DOWN':
        return 'rose' as const;
      case 'NOT_CONFIGURED':
      default:
        return 'slate' as const;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header do Dashboard */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--line, #e2e8f0)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: 0,
              }}
            >
              Painel Operacional & Observabilidade
            </h1>
            {status && (
              <span data-testid="overall-health-badge">
                <Badge variant={getHealthBadgeVariant(status.overallHealth)} size="md">
                  {status.overallHealth}
                </Badge>
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
            Monitoramento de saturação, telemetria do runtime Node.js, dependências e cockpit Railway
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            isLoading={loading}
            onClick={handleRefresh}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}
          >
            <span>🔄</span>
            <span>Atualizar Dados</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.875rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Runtime Node.js & Resumo de Recursos */}
      {status && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Serviço & Versão
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
              {status.service} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>v{status.version}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Node.js: <strong>{status.resources.nodeVersion}</strong>
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Tempo de Atividade (Uptime)
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
              {formatUptime(status.uptimeSeconds)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Última checagem: {new Date(status.timestamp).toLocaleTimeString('pt-BR')}
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Memória Heap (V8)
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
              {status.resources.memoryHeapUsedMb} MB / {status.resources.memoryHeapTotalMb} MB
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Uso relativo: {Math.round((status.resources.memoryHeapUsedMb / Math.max(1, status.resources.memoryHeapTotalMb)) * 100)}%
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Memória RSS do Container
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
              {status.resources.memoryRssMb} MB
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Resident Set Size alocado
            </div>
          </div>
        </div>
      )}

      {/* Grid de Probes de Dependências */}
      {status && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '1rem' }}>
            Probes de Saturação & Dependências
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* PostgreSQL */}
            <Card
              data-testid="probe-postgres"
              variant="bordered"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
              }}
            >
              <CardHeader style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🐘</span>
                    <CardTitle as="h4" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      PostgreSQL
                    </CardTitle>
                  </div>
                  <Badge variant={getProbeBadgeVariant(status.dependencies.postgres.status)} size="sm">
                    {status.dependencies.postgres.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Latência de Probe:</span>
                    <strong style={{ color: '#0f172a' }}>{status.dependencies.postgres.responseTimeMs} ms</strong>
                  </div>
                  {status.dependencies.postgres.activeConnections !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Pool de Conexões:</span>
                      <strong style={{ color: '#0f172a' }}>
                        {status.dependencies.postgres.activeConnections} conexões
                      </strong>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Object Storage */}
            <Card
              data-testid="probe-object-storage"
              variant="bordered"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
              }}
            >
              <CardHeader style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📦</span>
                    <CardTitle as="h4" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      Object Storage
                    </CardTitle>
                  </div>
                  <Badge variant={getProbeBadgeVariant(status.dependencies.objectStorage.status)} size="sm">
                    {status.dependencies.objectStorage.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Identificador:</span>
                    <strong style={{ color: '#0f172a' }}>Railway S3 Bucket (Tigris)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Latência de Probe:</span>
                    <strong style={{ color: '#0f172a' }}>{status.dependencies.objectStorage.responseTimeMs} ms</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redis */}
            <Card
              data-testid="probe-redis"
              variant="bordered"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
              }}
            >
              <CardHeader style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⚡</span>
                    <CardTitle as="h4" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      Redis
                    </CardTitle>
                  </div>
                  <Badge variant={getProbeBadgeVariant(status.dependencies.redis.status)} size="sm">
                    {status.dependencies.redis.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Latência de Probe:</span>
                    <strong style={{ color: '#0f172a' }}>{status.dependencies.redis.responseTimeMs} ms</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Seção Cockpit Railway */}
      <RailwayMetricsCard links={status?.railwayDashboardLinks} />

      {/* Seção Feed de Alertas */}
      <OperationalAlertsFeed refreshTrigger={refreshTrigger} />
    </div>
  );
}
