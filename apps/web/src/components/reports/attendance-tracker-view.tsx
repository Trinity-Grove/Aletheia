'use client';

import React, { useMemo, useState } from 'react';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceResponseDto,
  AttendanceStatus,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  LearnerSummaryDto,
  LogAttendanceDto,
} from '@aletheia/contracts';
import { ComplianceGauge } from './compliance-gauge';

export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  PRESENT: {
    label: 'Presente',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#A7F3D0',
    icon: '✅',
  },
  EXCUSED_ABSENCE: {
    label: 'Falta Justificada',
    bg: '#FFFBEB',
    text: '#92400E',
    border: '#FDE68A',
    icon: '📝',
  },
  UNEXCUSED_ABSENCE: {
    label: 'Falta Não Justificada',
    bg: '#FEF2F2',
    text: '#991B1B',
    border: '#FECACA',
    icon: '❌',
  },
  HOLIDAY: {
    label: 'Feriado / Recesso',
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#BFDBFE',
    icon: '🏖️',
  },
  FIELD_TRIP: {
    label: 'Passeio Educativo',
    bg: '#F5F3FF',
    text: '#5B21B6',
    border: '#DDD6FE',
    icon: '🏛️',
  },
  SICK: {
    label: 'Atestado / Doença',
    bg: '#FFF7ED',
    text: '#9A3412',
    border: '#FED7AA',
    icon: '🩹',
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
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">Todos os status</option>
            {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
              <option key={k} value={k}>
                {item.icon} {item.label}
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
              borderRadius: '0.375rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              style={{
                fontSize: '0.75rem',
                color: '#4B5563',
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
          <button
            type="button"
            data-testid="open-bulk-attendance-btn"
            onClick={handleOpenBulkModal}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '0.5rem',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            👥 Frequência Coletiva
          </button>
          <button
            type="button"
            data-testid="open-log-attendance-btn"
            onClick={handleOpenSingleModal}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
            }}
          >
            + Registrar Frequência
          </button>
        </div>
      </div>

      {/* Attendance Table / List */}
      {filteredRecords.length === 0 ? (
        <div
          data-testid="attendance-empty-state"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px dashed #D1D5DB',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
            Nenhum registro de presença encontrado
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Mantenha o registro de dias letivos e horas cumpridas para garantir a conformidade legal e o histórico anual.
          </p>
          <button
            type="button"
            data-testid="empty-log-attendance-btn"
            onClick={handleOpenSingleModal}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Registrar Primeiro Dia
          </button>
        </div>
      ) : (
        <div
          data-testid="attendance-table-container"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <table
            data-testid="attendance-records-table"
            style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
          >
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                  Data
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                  Educando
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
                  Carga Horária
                </th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>
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
                    style={{ borderBottom: '1px solid #F3F4F6' }}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>
                      {record.date}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151' }}>
                      🎓 {learnerDisplayName}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        data-testid={`attendance-status-badge-${record.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
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
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#4B5563' }}>
                      {record.hoursSpent !== null && record.hoursSpent !== undefined
                        ? `${record.hoursSpent}h`
                        : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                      {record.notes || '—'}
                      {record.isAutoLogged && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.6875rem',
                            backgroundColor: '#E0E7FF',
                            color: '#3730A3',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
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
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem 0' }}>
              Registrar Frequência Individual
            </h2>
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
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
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
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
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem 0' }}>
              Registrar Frequência Coletiva
            </h2>
            <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Selecione os Educandos *
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: '#F9FAFB',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #E5E7EB',
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
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          data-testid={`bulk-learner-checkbox-${l.id}`}
                          checked={isChecked}
                          onChange={() => toggleBulkLearner(l.id)}
                        />
                        🎓 {l.preferredName || l.firstName} {l.lastName || ''}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
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
                    border: '1px solid #D1D5DB',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
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
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
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
