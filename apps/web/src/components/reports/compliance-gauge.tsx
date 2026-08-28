'use client';

import React from 'react';
import { BarChart2, Check, Clock, Calendar } from 'lucide-react';
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
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px dashed #D1D5DB',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#6B7280',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#9CA3AF' }}>
          <BarChart2 size={24} />
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

  const statusBg = isCompliant ? '#ECFDF5' : '#FFFBEB';
  const statusColor = isCompliant ? '#065F46' : '#92400E';
  const statusBorder = isCompliant ? '#A7F3D0' : '#FDE68A';
  const statusText = isCompliant ? 'Conforme com as Metas Legais' : 'Em Progresso / Metas Anuais';

  return (
    <div
      data-testid="compliance-gauge"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
              color: '#111827',
              margin: 0,
            }}
          >
            Acompanhamento de Conformidade Legal
          </h3>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#6B7280',
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
            borderRadius: '9999px',
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
          {isCompliant ? <Check size={12} /> : <Clock size={12} />}
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
            backgroundColor: '#F9FAFB',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #F3F4F6',
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
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Calendar size={14} />
              <span>Dias Letivos Cumpridos</span>
            </span>
            <span
              data-testid="compliance-percentage"
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: daysPercent >= 100 ? '#059669' : '#2563EB',
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
              backgroundColor: '#E5E7EB',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <div
              data-testid="days-progress-bar"
              style={{
                height: '100%',
                width: `${daysPercent}%`,
                backgroundColor: daysPercent >= 100 ? '#10B981' : '#3B82F6',
                borderRadius: '9999px',
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
              color: '#6B7280',
            }}
          >
            <span>
              Realizado:{' '}
              <strong style={{ color: '#111827' }}>
                {summary.presentDays} dias
              </strong>
            </span>
            <span>
              Meta:{' '}
              <strong style={{ color: '#111827' }}>
                {requiredDays} dias
              </strong>
            </span>
          </div>
        </div>

        {/* Hours Progress Card */}
        <div
          data-testid="metric-hours-card"
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #F3F4F6',
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
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Clock size={14} />
              <span>Horas de Instrução</span>
            </span>
            <span
              data-testid="hours-compliance-percentage"
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: hoursPercent >= 100 ? '#059669' : '#8B5CF6',
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
              backgroundColor: '#E5E7EB',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <div
              data-testid="hours-progress-bar"
              style={{
                height: '100%',
                width: `${hoursPercent}%`,
                backgroundColor: hoursPercent >= 100 ? '#10B981' : '#8B5CF6',
                borderRadius: '9999px',
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
              color: '#6B7280',
            }}
          >
            <span>
              Realizado:{' '}
              <strong style={{ color: '#111827' }}>
                {summary.totalHoursLogged} h
              </strong>
            </span>
            <span>
              Meta:{' '}
              <strong style={{ color: '#111827' }}>
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
          borderTop: '1px solid #F3F4F6',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: '#4B5563',
        }}
      >
        <div data-testid="metric-total-days-logged">
          Total de Dias Registrados:{' '}
          <strong style={{ color: '#111827' }}>{summary.totalDaysLogged}</strong>
        </div>
        <div data-testid="metric-present-days">
          Dias Presentes:{' '}
          <strong style={{ color: '#059669' }}>{summary.presentDays}</strong>
        </div>
        <div data-testid="metric-absent-days">
          Faltas / Ausências:{' '}
          <strong style={{ color: '#DC2626' }}>{summary.absentDays}</strong>
        </div>
      </div>
    </div>
  );
}
