'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  AttendanceComplianceSummaryDto,
  ComplianceRequirementResponseDto,
} from '@aletheia/contracts';

export interface ComplianceGaugeProps {
  summary: AttendanceComplianceSummaryDto | null;
  requirement?: ComplianceRequirementResponseDto | null | undefined;
  learnerName?: string | null | undefined;
}

export function ComplianceGauge({
  summary,
  requirement,
  learnerName,
}: ComplianceGaugeProps) {
  if (!summary) {
    return (
      <div
        data-testid="compliance-gauge-empty"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-medium)',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
          <AletheiaIcon name="bar-chart-2" size={24} />
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          Nenhum dado de conformidade registrado para este educando.
        </p>
      </div>
    );
  }

  const requiredDays = summary.requiredDays ?? requirement?.minInstructionalDays ?? 200;
  const requiredHours = summary.requiredHours ?? requirement?.minInstructionalHours ?? 800;

  const daysPercent =
    summary.daysCompliancePercentage !== null && summary.daysCompliancePercentage !== undefined
      ? Math.min(100, Math.max(0, summary.daysCompliancePercentage))
      : requiredDays > 0
      ? Math.min(100, Math.round((summary.presentDays / requiredDays) * 100))
      : 100;

  const hoursPercent =
    summary.hoursCompliancePercentage !== null && summary.hoursCompliancePercentage !== undefined
      ? Math.min(100, Math.max(0, summary.hoursCompliancePercentage))
      : requiredHours > 0
      ? Math.min(100, Math.round((summary.totalHoursLogged / requiredHours) * 100))
      : 100;

  const isCompliant = summary.isCompliant || (daysPercent >= 100 && hoursPercent >= 100);

  const statusBg = isCompliant ? 'var(--color-emerald-50)' : 'var(--color-amber-50)';
  const statusColor = isCompliant ? 'var(--color-emerald-700)' : 'var(--color-amber-700)';
  const statusBorder = isCompliant ? 'var(--color-emerald-100)' : 'var(--color-amber-100)';
  const statusText = isCompliant ? 'Conforme com as Metas Legais' : 'Em Progresso / Metas Anuais';

  return (
    <div
      data-testid="compliance-gauge"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h3
            data-testid="compliance-gauge-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Acompanhamento de Conformidade Legal
          </h3>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0',
            }}
          >
            {learnerName
              ? `Progresso individual de ${learnerName}`
              : summary.learnerName
              ? `Progresso individual de ${summary.learnerName}`
              : 'Metas de frequência e carga horária anual'}
          </p>
        </div>

        <span
          data-testid="compliance-status-badge"
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: statusBg,
            color: statusColor,
            border: `1px solid ${statusBorder}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          {isCompliant ? <AletheiaIcon name="check" size={12} /> : <AletheiaIcon name="clock" size={12} />}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Main Gauges Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Days Progress Card */}
        <div
          data-testid="metric-days-card"
          style={{
            backgroundColor: 'var(--sage-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <AletheiaIcon name="calendar" size={14} />
              <span>Dias Letivos Cumpridos</span>
            </span>
            <span
              data-testid="compliance-percentage"
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: daysPercent >= 100 ? 'var(--color-emerald-600)' : 'var(--forest)',
              }}
            >
              {daysPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '0.75rem',
              width: '100%',
              backgroundColor: 'var(--border-light)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <div
              data-testid="days-progress-bar"
              style={{
                height: '100%',
                width: `${daysPercent}%`,
                backgroundColor: daysPercent >= 100 ? 'var(--color-emerald-600)' : 'var(--color-indigo-600)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease-in-out',
              }}
            />
          </div>

          <div
            data-testid="metric-days-progress"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Realizado:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {summary.presentDays} dias
              </strong>
            </span>
            <span>
              Meta:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {requiredDays} dias
              </strong>
            </span>
          </div>
        </div>

        {/* Hours Progress Card */}
        <div
          data-testid="metric-hours-card"
          style={{
            backgroundColor: 'var(--sage-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <AletheiaIcon name="clock" size={14} />
              <span>Horas de Instrução</span>
            </span>
            <span
              data-testid="hours-compliance-percentage"
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: hoursPercent >= 100 ? 'var(--color-emerald-600)' : 'var(--color-indigo-700)',
              }}
            >
              {hoursPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '0.75rem',
              width: '100%',
              backgroundColor: 'var(--border-light)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <div
              data-testid="hours-progress-bar"
              style={{
                height: '100%',
                width: `${hoursPercent}%`,
                backgroundColor: hoursPercent >= 100 ? 'var(--color-emerald-600)' : 'var(--color-indigo-700)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease-in-out',
              }}
            />
          </div>

          <div
            data-testid="metric-hours-progress"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Realizado:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {summary.totalHoursLogged} h
              </strong>
            </span>
            <span>
              Meta:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {requiredHours} h
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Metrics Breakdown */}
      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div data-testid="metric-total-days-logged">
          Total de Dias Registrados:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{summary.totalDaysLogged}</strong>
        </div>
        <div data-testid="metric-present-days">
          Dias Presentes:{' '}
          <strong style={{ color: 'var(--color-emerald-600)' }}>{summary.presentDays}</strong>
        </div>
        <div data-testid="metric-absent-days">
          Faltas / Ausências:{' '}
          <strong style={{ color: 'var(--color-rose-600)' }}>{summary.absentDays}</strong>
        </div>
      </div>
    </div>
  );
}
