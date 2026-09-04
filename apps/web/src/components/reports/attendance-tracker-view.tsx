'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon, Badge, Button, Checkbox, EmptyState, Input, Modal, Select, Textarea } from '@aletheia/ui';
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
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode; badgeVariant: 'emerald' | 'amber' | 'rose' | 'indigo' }
> = {
  PRESENT: {
    label: 'Presente',
    bg: 'var(--color-emerald-50)',
    text: 'var(--color-emerald-700)',
    border: 'var(--color-emerald-100)',
    icon: <AletheiaIcon name="check" size={14} />,
    badgeVariant: 'emerald',
  },
  EXCUSED_ABSENCE: {
    label: 'Falta Justificada',
    bg: 'var(--color-amber-50)',
    text: 'var(--color-amber-700)',
    border: 'var(--color-amber-100)',
    icon: <AletheiaIcon name="file-text" size={14} />,
    badgeVariant: 'amber',
  },
  UNEXCUSED_ABSENCE: {
    label: 'Falta Não Justificada',
    bg: 'var(--color-rose-50)',
    text: 'var(--color-rose-700)',
    border: 'var(--color-rose-100)',
    icon: <AletheiaIcon name="x" size={14} />,
    badgeVariant: 'rose',
  },
  HOLIDAY: {
    label: 'Feriado / Recesso',
    bg: 'var(--color-indigo-50)',
    text: 'var(--color-indigo-700)',
    border: 'var(--color-indigo-100)',
    icon: <AletheiaIcon name="calendar" size={14} />,
    badgeVariant: 'indigo',
  },
  FIELD_TRIP: {
    label: 'Passeio Educativo',
    bg: 'var(--color-indigo-50)',
    text: 'var(--color-indigo-700)',
    border: 'var(--color-indigo-100)',
    icon: <AletheiaIcon name="landmark" size={14} />,
    badgeVariant: 'indigo',
  },
  SICK: {
    label: 'Atestado / Doença',
    bg: 'var(--color-amber-50)',
    text: 'var(--color-amber-700)',
    border: 'var(--color-amber-100)',
    icon: <AletheiaIcon name="alert-circle" size={14} />,
    badgeVariant: 'amber',
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
          <Select
            data-testid="filter-attendance-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'Todos os status' },
              ...Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => ({ value: k, label: item.label })),
            ]}
          />

          {/* Date Filter */}
          <Input
            type="date"
            data-testid="filter-attendance-date-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
              Limpar data
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Can action="log_attendance">
            <Button
              variant="secondary"
              data-testid="open-bulk-attendance-btn"
              onClick={handleOpenBulkModal}
              leftIcon={<AletheiaIcon name="users" size={16} />}
            >
              Frequência Coletiva
            </Button>
          </Can>
          <Can action="log_attendance">
            <Button data-testid="open-log-attendance-btn" onClick={handleOpenSingleModal}>
              + Registrar Frequência
            </Button>
          </Can>
        </div>
      </div>

      {/* Attendance Table / List */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          data-testid="attendance-empty-state"
          icon={<AletheiaIcon name="calendar" size={40} style={{ color: 'var(--sage)' }} />}
          title="Nenhum registro de presença encontrado"
          description="Mantenha o registro de dias letivos e horas cumpridas para garantir a conformidade legal e o histórico anual."
          action={
            <Can action="log_attendance">
              <Button data-testid="empty-log-attendance-btn" onClick={handleOpenSingleModal}>
                Registrar Primeiro Dia
              </Button>
            </Can>
          }
        />
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
                      <Badge data-testid={`attendance-status-badge-${record.id}`} variant={conf.badgeVariant}>
                        <span>{conf.icon}</span>
                        {conf.label}
                      </Badge>
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
        <div data-testid="single-attendance-modal">
          <Modal
            isOpen={true}
            onClose={() => setIsSingleModalOpen(false)}
            title="Registrar Frequência Individual"
            footer={
              <>
                <Button variant="secondary" data-testid="cancel-attendance-btn" onClick={() => setIsSingleModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" form="single-attendance-form" data-testid="save-attendance-btn" isLoading={isSubmitting}>
                  Salvar Registro
                </Button>
              </>
            }
          >
            <form id="single-attendance-form" onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Select
                label="Educando *"
                data-testid="attendance-learner-select"
                value={singleLearnerId}
                onChange={(e) => setSingleLearnerId(e.target.value)}
                options={learners.map((l) => ({ value: l.id, label: `${l.preferredName || l.firstName} ${l.lastName || ''}` }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Data *"
                  type="date"
                  data-testid="attendance-date-input"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                />
                <Input
                  label="Carga Horária (h)"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  data-testid="attendance-hours-input"
                  value={singleHours}
                  onChange={(e) => setSingleHours(e.target.value)}
                />
              </div>

              <Select
                label="Status de Presença *"
                data-testid="attendance-status-select"
                value={singleStatus}
                onChange={(e) => setSingleStatus(e.target.value as AttendanceStatus)}
                options={Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => ({ value: k, label: item.label }))}
              />

              <Textarea
                label="Observações / Justificativas"
                data-testid="attendance-notes-input"
                rows={3}
                value={singleNotes}
                onChange={(e) => setSingleNotes(e.target.value)}
                placeholder="Ex.: Visita ao jardim botânico e narração sobre botânica."
              />
            </form>
          </Modal>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {isBulkModalOpen && (
        <div data-testid="bulk-attendance-modal">
          <Modal
            isOpen={true}
            onClose={() => setIsBulkModalOpen(false)}
            title="Registrar Frequência Coletiva"
            footer={
              <>
                <Button variant="secondary" data-testid="cancel-bulk-attendance-btn" onClick={() => setIsBulkModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="bulk-attendance-form"
                  data-testid="save-bulk-attendance-btn"
                  isLoading={isSubmitting}
                  disabled={bulkSelectedLearnerIds.length === 0}
                >
                  Registrar para Todos Selecionados
                </Button>
              </>
            }
          >
            <form id="bulk-attendance-form" onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  {learners.map((l) => (
                    <Checkbox
                      key={l.id}
                      data-testid={`bulk-learner-checkbox-${l.id}`}
                      checked={bulkSelectedLearnerIds.includes(l.id)}
                      onChange={() => toggleBulkLearner(l.id)}
                      label={`${l.preferredName || l.firstName} ${l.lastName || ''}`}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Data *"
                  type="date"
                  data-testid="bulk-attendance-date-input"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                />
                <Input
                  label="Carga Horária (h)"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  data-testid="bulk-attendance-hours-input"
                  value={bulkHours}
                  onChange={(e) => setBulkHours(e.target.value)}
                />
              </div>

              <Select
                label="Status de Presença *"
                data-testid="bulk-attendance-status-select"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)}
                options={Object.entries(ATTENDANCE_STATUS_CONFIG).map(([k, item]) => ({ value: k, label: item.label }))}
              />

              <Textarea
                label="Observações Gerais"
                data-testid="bulk-attendance-notes-input"
                rows={2}
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Ex.: Aula interdisciplinar em família."
              />
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
