'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceResponseDto,
  AttendanceStatus,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  LearnerSummaryDto,
  LogAttendanceDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { ComplianceGauge } from './compliance-gauge';

export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  PRESENT: {
    label: 'Presente',
    bg: 'var(--color-emerald-50)',
    text: 'var(--color-emerald-700)',
    border: 'var(--color-emerald-100)',
    icon: <AletheiaIcon name="check" size={14} />,
  },
  EXCUSED_ABSENCE: {
    label: 'Falta Justificada',
    bg: 'var(--color-amber-50)',
    text: 'var(--color-amber-700)',
    border: 'var(--color-amber-100)',
    icon: <AletheiaIcon name="file-text" size={14} />,
  },
  UNEXCUSED_ABSENCE: {
    label: 'Falta Não Justificada',
    bg: 'var(--color-rose-50)',
    text: 'var(--color-rose-700)',
    border: 'var(--color-rose-100)',
    icon: <AletheiaIcon name="x" size={14} />,
  },
  HOLIDAY: {
    label: 'Feriado / Recesso',
    bg: 'var(--color-indigo-50)',
    text: 'var(--color-indigo-700)',
    border: 'var(--color-indigo-100)',
    icon: <AletheiaIcon name="calendar" size={14} />,
  },
  FIELD_TRIP: {
    label: 'Passeio Educativo',
    bg: 'var(--color-indigo-50)',
    text: 'var(--color-indigo-700)',
    border: 'var(--color-indigo-100)',
    icon: <AletheiaIcon name="landmark" size={14} />,
  },
  SICK: {
    label: 'Atestado / Doença',
    bg: 'var(--color-amber-50)',
    text: 'var(--color-amber-700)',
    border: 'var(--color-amber-100)',
    icon: <AletheiaIcon name="alert-circle" size={14} />,
  },
};

export interface AttendanceTrackerViewProps {
  records: AttendanceResponseDto[];
  complianceSummary?: AttendanceComplianceSummaryDto | null | undefined;
  complianceRequirement?: ComplianceRequirementResponseDto | null | undefined;
  learners: LearnerSummaryDto[];
  activeLearnerId: string | null;
  onLogAttendance: (dto: LogAttendanceDto) => Promise<void>;
  onBulkLogAttendance: (dto: BulkLogAttendanceDto) => Promise<void>;
}

export function AttendanceTrackerView({
  records,
  complianceSummary,
  complianceRequirement,
  learners,
  activeLearnerId,
  onLogAttendance,
  onBulkLogAttendance,
}: AttendanceTrackerViewProps) {
  // Modal states
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Single Log Form State
  const [singleLearnerId, setSingleLearnerId] = useState(
    activeLearnerId || (learners[0]?.id ?? '')
  );
  const [singleDate, setSingleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [singleStatus, setSingleStatus] = useState<AttendanceStatus>('PRESENT');
  const [singleHours, setSingleHours] = useState('4');
  const [singleNotes, setSingleNotes] = useState('');

  // Bulk Log Form State
  const [bulkSelectedLearnerIds, setBulkSelectedLearnerIds] = useState<string[]>(
    learners.map((l) => l.id)
  );
  const [bulkDate, setBulkDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('PRESENT');
  const [bulkHours, setBulkHours] = useState('4');
  const [bulkNotes, setBulkNotes] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLearner = learners.find((l) => l.id === activeLearnerId);

  // Filtered records list
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (activeLearnerId && rec.learnerId !== activeLearnerId) return false;
      if (filterStatus && rec.status !== filterStatus) return false;
      if (filterDate && rec.date !== filterDate) return false;
      return true;
    });
  }, [records, activeLearnerId, filterStatus, filterDate]);

  const handleOpenSingleModal = () => {
    setSingleLearnerId(activeLearnerId || (learners[0]?.id ?? ''));
    setSingleDate(new Date().toISOString().slice(0, 10));
    setSingleStatus('PRESENT');
    setSingleHours('4');
    setSingleNotes('');
    setIsSingleModalOpen(true);
  };

  const handleOpenBulkModal = () => {
    setBulkSelectedLearnerIds(learners.map((l) => l.id));
    setBulkDate(new Date().toISOString().slice(0, 10));
    setBulkStatus('PRESENT');
    setBulkHours('4');
    setBulkNotes('');
    setIsBulkModalOpen(true);
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleLearnerId || !singleDate) return;
    setIsSubmitting(true);
    try {
      const dto: LogAttendanceDto = {
        learnerId: singleLearnerId,
        date: singleDate,
        status: singleStatus,
        hoursSpent: singleHours ? parseFloat(singleHours) : null,
        notes: singleNotes ? singleNotes : null,
        isAutoLogged: false,
      };
      await onLogAttendance(dto);
      setIsSingleModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedLearnerIds.length === 0 || !bulkDate) return;
    setIsSubmitting(true);
    try {
      const dto: BulkLogAttendanceDto = {
        learnerIds: bulkSelectedLearnerIds,
        date: bulkDate,
        status: bulkStatus,
        hoursSpent: bulkHours ? parseFloat(bulkHours) : null,
        notes: bulkNotes ? bulkNotes : null,
        isAutoLogged: false,
      };
      await onBulkLogAttendance(dto);
      setIsBulkModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBulkLearner = (id: string) => {
    setBulkSelectedLearnerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Compliance Gauge Section */}
      {complianceSummary && (
        <ComplianceGauge
          summary={complianceSummary}
          requirement={complianceRequirement}
          learnerName={activeLearner?.preferredName || activeLearner?.firstName}
        />
      )}

      {/* Control Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status filter */}
          <select
            data-testid="filter-attendance-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todos os status</option>
            {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
              <option key={k} value={k}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            data-testid="filter-attendance-date-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Limpar data
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Can action="log_attendance">
            <button
              type="button"
              data-testid="open-bulk-attendance-btn"
              onClick={handleOpenBulkModal}
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'var(--sage-soft)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <AletheiaIcon name="users" size={16} />
              <span>Frequência Coletiva</span>
            </button>
          </Can>
          <Can action="log_attendance">
            <button
              type="button"
              data-testid="open-log-attendance-btn"
              onClick={handleOpenSingleModal}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              + Registrar Frequência
            </button>
          </Can>
        </div>
      </div>

      {/* Attendance Table / List */}
      {filteredRecords.length === 0 ? (
        <div
          data-testid="attendance-empty-state"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div style={{ color: 'var(--sage)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="calendar" size={40} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Nenhum registro de presença encontrado
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Mantenha o registro de dias letivos e horas cumpridas para garantir a conformidade legal e o histórico anual.
          </p>
          <Can action="log_attendance">
            <button
              type="button"
              data-testid="empty-log-attendance-btn"
              onClick={handleOpenSingleModal}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Registrar Primeiro Dia
            </button>
          </Can>
        </div>
      ) : (
        <div
          data-testid="attendance-table-container"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <table
            data-testid="attendance-records-table"
            style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--sage-soft)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Data
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Educando
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Carga Horária
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Observações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const conf = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG.PRESENT;
                const learner = learners.find((l) => l.id === record.learnerId);
                const learnerDisplayName =
                  record.learnerName || learner?.preferredName || learner?.firstName || 'Educando';

                return (
                  <tr
                    key={record.id}
                    data-testid={`attendance-row-${record.id}`}
                    style={{ borderBottom: '1px solid var(--sage-soft)' }}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {record.date}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                        <AletheiaIcon name="graduation-cap" size={14} style={{ color: 'var(--text-secondary)' }} />
                        <span>{learnerDisplayName}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        data-testid={`attendance-status-badge-${record.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: conf.bg,
                          color: conf.text,
                          border: `1px solid ${conf.border}`,
                        }}
                      >
                        <span>{conf.icon}</span>
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {record.hoursSpent !== null && record.hoursSpent !== undefined
                        ? `${record.hoursSpent}h`
                        : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {record.notes || '—'}
                      {record.isAutoLogged && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.6875rem',
                            backgroundColor: 'var(--color-indigo-100)',
                            color: 'var(--color-indigo-700)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          Auto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Single Attendance Modal */}
      {isSingleModalOpen && (
        <div
          data-testid="single-attendance-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Registrar Frequência Individual
            </h2>
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Educando *
                </label>
                <select
                  data-testid="attendance-learner-select"
                  value={singleLearnerId}
                  onChange={(e) => setSingleLearnerId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.preferredName || l.firstName} {l.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    data-testid="attendance-date-input"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Carga Horária (h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    data-testid="attendance-hours-input"
                    value={singleHours}
                    onChange={(e) => setSingleHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Status de Presença *
                </label>
                <select
                  data-testid="attendance-status-select"
                  value={singleStatus}
                  onChange={(e) => setSingleStatus(e.target.value as AttendanceStatus)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Observações / Justificativas
                </label>
                <textarea
                  data-testid="attendance-notes-input"
                  rows={3}
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="Ex.: Visita ao jardim botânico e narração sobre botânica."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  data-testid="cancel-attendance-btn"
                  onClick={() => setIsSingleModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="save-attendance-btn"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--forest)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {isBulkModalOpen && (
        <div
          data-testid="bulk-attendance-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Registrar Frequência Coletiva
            </h2>
            <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Selecione os Educandos *
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'var(--sage-soft)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    maxHeight: '140px',
                    overflowY: 'auto',
                  }}
                >
                  {learners.map((l) => {
                    const isChecked = bulkSelectedLearnerIds.includes(l.id);
                    return (
                      <label
                        key={l.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          data-testid={`bulk-learner-checkbox-${l.id}`}
                          checked={isChecked}
                          onChange={() => toggleBulkLearner(l.id)}
                        />
                        <AletheiaIcon name="graduation-cap" size={14} style={{ color: 'var(--text-secondary)' }} />
                        <span>{l.preferredName || l.firstName} {l.lastName || ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    data-testid="bulk-attendance-date-input"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Carga Horária (h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    data-testid="bulk-attendance-hours-input"
                    value={bulkHours}
                    onChange={(e) => setBulkHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Status de Presença *
                </label>
                <select
                  data-testid="bulk-attendance-status-select"
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Observações Gerais
                </label>
                <textarea
                  data-testid="bulk-attendance-notes-input"
                  rows={2}
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Ex.: Aula interdisciplinar em família."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  data-testid="cancel-bulk-attendance-btn"
                  onClick={() => setIsBulkModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="save-bulk-attendance-btn"
                  disabled={isSubmitting || bulkSelectedLearnerIds.length === 0}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--forest)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar para Todos Selecionados'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
