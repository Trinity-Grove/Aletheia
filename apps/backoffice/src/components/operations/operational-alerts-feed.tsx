'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { OperationalAlertEventDto } from '@aletheia/contracts';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@aletheia/ui';
import { api } from '../../lib/api';

export type AlertStatusFilter = 'ALL' | 'PENDING' | 'ACKNOWLEDGED';

export interface OperationalAlertsFeedProps {
  initialAlerts?: OperationalAlertEventDto[] | undefined;
  refreshTrigger?: number | undefined;
}

export function OperationalAlertsFeed({
  initialAlerts,
  refreshTrigger = 0,
}: OperationalAlertsFeedProps): React.ReactElement {
  const [filter, setFilter] = useState<AlertStatusFilter>('ALL');
  const [alerts, setAlerts] = useState<OperationalAlertEventDto[]>(initialAlerts || []);
  const [loading, setLoading] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAlerts = useCallback(async (currentFilter: AlertStatusFilter) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let params: Record<string, string> | undefined = undefined;
      if (currentFilter === 'PENDING') {
        params = { acknowledged: 'false' };
      } else if (currentFilter === 'ACKNOWLEDGED') {
        params = { acknowledged: 'true' };
      }

      const data = await api.get<OperationalAlertEventDto[]>(
        '/admin/operations/alerts',
        params ? { params } : undefined,
      );
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setErrorMessage('Falha ao carregar feed de alertas operacionais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts(filter);
  }, [loadAlerts, filter, refreshTrigger]);

  const handleFilterChange = (newFilter: AlertStatusFilter) => {
    setFilter(newFilter);
  };

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    setErrorMessage(null);
    try {
      const updated = await api.post<OperationalAlertEventDto>(
        `/admin/operations/alerts/${alertId}/acknowledge`,
      );
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? { ...item, ...updated } : item)),
      );
    } catch {
      setErrorMessage('Não foi possível reconhecer o alerta selecionado.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const getSeverityBadgeVariant = (severity: OperationalAlertEventDto['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'rose' as const;
      case 'WARNING':
        return 'amber' as const;
      case 'INFO':
      default:
        return 'indigo' as const;
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Card
      data-testid="operational-alerts-feed"
      variant="bordered"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--line, #e2e8f0)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--line, #f1f5f9)',
          backgroundColor: '#fafbfc',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <CardTitle as="h3" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Feed de Alertas e Incidentes Operacionais
            </CardTitle>
            <Badge variant="slate" size="sm">
              {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
            </Badge>
          </div>
          <CardDescription style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
            Alertas recebidos via webhook do Railway e eventos de saturação de infraestrutura
          </CardDescription>
        </div>

        {/* Filtros de Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            data-testid="alert-filter-all"
            onClick={() => handleFilterChange('ALL')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: filter === 'ALL' ? 700 : 500,
              backgroundColor: filter === 'ALL' ? 'var(--forest, #1e3a2f)' : '#f1f5f9',
              color: filter === 'ALL' ? '#ffffff' : '#334155',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Todos
          </button>
          <button
            type="button"
            data-testid="alert-filter-pending"
            onClick={() => handleFilterChange('PENDING')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: filter === 'PENDING' ? 700 : 500,
              backgroundColor: filter === 'PENDING' ? 'var(--forest, #1e3a2f)' : '#f1f5f9',
              color: filter === 'PENDING' ? '#ffffff' : '#334155',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Pendentes
          </button>
          <button
            type="button"
            data-testid="alert-filter-acknowledged"
            onClick={() => handleFilterChange('ACKNOWLEDGED')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontWeight: filter === 'ACKNOWLEDGED' ? 700 : 500,
              backgroundColor: filter === 'ACKNOWLEDGED' ? 'var(--forest, #1e3a2f)' : '#f1f5f9',
              color: filter === 'ACKNOWLEDGED' ? '#ffffff' : '#334155',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Reconhecidos
          </button>
        </div>
      </CardHeader>

      <CardContent style={{ padding: '1.25rem 1.5rem' }}>
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {loading && alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
            Carregando alertas operacionais...
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="Nenhum alerta operacional"
            description="Não há incidentes ou alertas registrados no momento para o filtro selecionado."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.map((alert) => {
              const isAcknowledged = !!alert.acknowledgedAt;
              return (
                <div
                  key={alert.id}
                  data-testid={`alert-item-${alert.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--line, #e2e8f0)',
                    backgroundColor: isAcknowledged ? '#f8fafc' : '#ffffff',
                    borderLeft: `4px solid ${
                      alert.severity === 'CRITICAL'
                        ? '#e11d48'
                        : alert.severity === 'WARNING'
                        ? '#d97706'
                        : '#3b82f6'
                    }`,
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={getSeverityBadgeVariant(alert.severity)} size="sm">
                        {alert.severity}
                      </Badge>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--text-primary, #0f172a)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {alert.eventType}
                      </span>
                      {alert.serviceName && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.375rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            color: '#475569',
                            fontFamily: 'monospace',
                          }}
                        >
                          svc:{alert.serviceName}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      Recebido em: <strong>{formatDate(alert.receivedAt)}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>
                    {alert.message}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginTop: '0.25rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed #e2e8f0',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ color: '#64748b' }}>
                      Origem: <strong style={{ color: '#334155' }}>{alert.source}</strong>
                    </div>

                    {isAcknowledged ? (
                      <div
                        data-testid={`acknowledged-info-${alert.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          color: '#15803d',
                          fontWeight: 600,
                        }}
                      >
                        <Badge variant="emerald" size="sm">
                          Reconhecido
                        </Badge>
                        <span>
                          em {formatDate(alert.acknowledgedAt)} por{' '}
                          {alert.acknowledgedBy || 'Administrador'}
                        </span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        data-testid={`ack-alert-${alert.id}`}
                        isLoading={acknowledgingId === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Reconhecer Alerta
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
