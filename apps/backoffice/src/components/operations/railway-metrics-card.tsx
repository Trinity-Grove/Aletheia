'use client';

import React from 'react';
import type { OperationalStatusResponseDto } from '@aletheia/contracts';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aletheia/ui';

export type RailwayDashboardLinks = OperationalStatusResponseDto['railwayDashboardLinks'];

export interface RailwayMetricsCardProps {
  links?: RailwayDashboardLinks | undefined;
}

export function RailwayMetricsCard({ links }: RailwayMetricsCardProps): React.ReactElement {
  const projectUrl = links?.projectUrl || 'https://railway.com';
  const metricsUrl = links?.metricsUrl || projectUrl;
  const logsUrl = links?.logsUrl || projectUrl;

  const metricCards = [
    {
      testId: 'railway-link-latency',
      title: 'Latência de Rede & Requisições',
      subtitle: 'p50, p95, p99 e tempo de resposta',
      href: metricsUrl,
      badgeText: 'Latência HTTP',
      badgeVariant: 'indigo' as const,
      icon: '⏱️',
      description: 'Acompanhe a distribuição de percentis de latência e tempo de resposta em trânsito.',
    },
    {
      testId: 'railway-link-errors',
      title: 'Taxa de Erro HTTP',
      subtitle: 'Monitoramento 4xx / 5xx',
      href: metricsUrl,
      badgeText: 'Erros HTTP',
      badgeVariant: 'rose' as const,
      icon: '⚠️',
      description: 'Taxa percentual e volume de respostas com status de erro (4xx client e 5xx server).',
    },
    {
      testId: 'railway-link-resources',
      title: 'Uso de Recursos de Hardware',
      subtitle: 'CPU, Memória e E/S de Disco',
      href: metricsUrl,
      badgeText: 'Saturação',
      badgeVariant: 'amber' as const,
      icon: '📈',
      description: 'Curvas de consumo de CPU por vCPU, saturação de RAM e throughput de disco da VM.',
    },
    {
      testId: 'railway-link-logs',
      title: 'Live Log Stream da API',
      subtitle: 'Stdout e Stderr unificados',
      href: logsUrl,
      badgeText: 'Logs ao Vivo',
      badgeVariant: 'slate' as const,
      icon: '📜',
      description: 'Stream contínuo de logs de inicialização, requisições HTTP e stack traces de exceção.',
    },
  ];

  return (
    <Card
      data-testid="railway-metrics-card"
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
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--line, #f1f5f9)',
          backgroundColor: '#fafbfc',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚂</span>
            <CardTitle as="h3" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Cockpit de Observabilidade Railway
            </CardTitle>
            <Badge variant="indigo" size="sm">
              Infraestrutura Nativa
            </Badge>
          </div>
          <CardDescription style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
            Deep links contextuais para métricas de latência, vazão, saturação de hardware e logs no Railway
          </CardDescription>
        </div>

        <a
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="railway-link-project"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>Abrir Projeto no Railway</span>
          <span>↗</span>
        </a>
      </CardHeader>

      <CardContent style={{ padding: '1.5rem' }}>
        {/* Grid de Cards de Métricas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {metricCards.map((item) => (
            <a
              key={item.testId}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={item.testId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid var(--line, #e2e8f0)',
                backgroundColor: '#ffffff',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <Badge variant={item.badgeVariant} size="sm">
                    {item.badgeText}
                  </Badge>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary, #0f172a)', marginBottom: '0.25rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted, #64748b)', marginBottom: '0.5rem' }}>
                  {item.subtitle}
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
                  {item.description}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Ver gráficos no Railway</span>
                <span>↗</span>
              </div>
            </a>
          ))}
        </div>

        {/* Nota explicativa de arquitetura */}
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>💡</span>
          <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
            <strong>Nota de Observabilidade:</strong> As métricas de tráfego, latência e hardware são consolidadas em tempo real pela infraestrutura nativa do Railway sem overhead no container, permitindo diagnóstico granular de saturação sem impacto na performance da aplicação.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
