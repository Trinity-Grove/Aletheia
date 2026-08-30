'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  LearningRecordResponseDto,
  LearnerProgressSummaryDto,
  LearnerSummaryDto,
  SubjectResponseDto,
  MasteryLevel,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { RecordCard, MASTERY_CONFIG, RECORD_TYPE_LABELS } from './record-card';

export interface RecordsJournalViewProps {
  records: LearningRecordResponseDto[];
  progressSummary?: LearnerProgressSummaryDto | null;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  activeLearnerId: string | null;
  onOpenCreateRecord: () => void;
  onEditRecord: (record: LearningRecordResponseDto) => void;
  onDeleteRecord: (recordId: string) => void;
  onAddEvidence: (record: LearningRecordResponseDto) => void;
}

export function RecordsJournalView({
  records,
  progressSummary,
  learners,
  subjects,
  activeLearnerId,
  onOpenCreateRecord,
  onEditRecord,
  onDeleteRecord,
  onAddEvidence,
}: RecordsJournalViewProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterMastery, setFilterMastery] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active Learner name
  const activeLearner = learners.find((l) => l.id === activeLearnerId);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (activeLearnerId && rec.learnerId !== activeLearnerId) return false;
      if (filterType && rec.type !== filterType) return false;
      if (filterSubject && rec.subjectId !== filterSubject) return false;
      if (filterMastery && rec.masteryLevel !== filterMastery) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const titleMatch = rec.title.toLowerCase().includes(query);
        const descMatch = rec.description?.toLowerCase().includes(query);
        const habitMatch = rec.characterHabitGrowth?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !habitMatch) return false;
      }
      return true;
    });
  }, [records, activeLearnerId, filterType, filterSubject, filterMastery, searchTerm]);

  // Aggregate stats when progressSummary is not learner-specific or when whole family is viewed
  const summaryStats = useMemo(() => {
    if (progressSummary && activeLearnerId) {
      return {
        totalRecords: progressSummary.totalRecordsCount,
        totalMinutes: progressSummary.totalMinutesSpent,
        masteryCount: progressSummary.masteryDistribution,
      };
    }
    // Calculate from records
    let totalMinutes = 0;
    const masteryCount: Record<string, number> = {
      NOT_STARTED: 0,
      EXPOSURE: 0,
      DEVELOPING: 0,
      WITH_ASSISTANCE: 0,
      AUTONOMOUS: 0,
      MASTERED: 0,
    };
    records.forEach((r) => {
      totalMinutes += r.durationMinutes || 0;
      masteryCount[r.masteryLevel] = (masteryCount[r.masteryLevel] || 0) + 1;
    });

    return {
      totalRecords: records.length,
      totalMinutes,
      masteryCount,
    };
  }, [records, progressSummary, activeLearnerId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Progress Summary (Individual growth, strictly no sibling comparisons) */}
      <div
        data-testid="records-metrics-summary"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div data-testid="metric-total-records">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total de Registros
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
            {summaryStats.totalRecords}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeLearner ? `Registros de ${activeLearner.preferredName || activeLearner.firstName}` : 'Toda a família'}
          </span>
        </div>

        <div data-testid="metric-total-hours">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Tempo de Aprendizado
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest)', margin: '0.25rem 0 0 0' }}>
            {Math.round(summaryStats.totalMinutes / 60)}h{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>({summaryStats.totalMinutes} min)</span>
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Em lições e vivências</span>
        </div>

        <div data-testid="metric-mastered-autonomous">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Domínio & Autonomia
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-emerald-600)', margin: '0.25rem 0 0 0' }}>
            {(summaryStats.masteryCount['MASTERED'] || 0) + (summaryStats.masteryCount['AUTONOMOUS'] || 0)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lições autônomas / dominadas</span>
        </div>

        {/* Mini Mastery Distribution Pill */}
        <div data-testid="metric-mastery-distribution" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Distribuição de Domínio
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
            {Object.entries(MASTERY_CONFIG).map(([level, conf]) => {
              const count = summaryStats.masteryCount[level as MasteryLevel] || 0;
              return (
                <span
                  key={level}
                  data-testid={`mastery-summary-pill-${level}`}
                  style={{
                    backgroundColor: conf.bg,
                    color: conf.text,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {conf.icon} {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & New Record CTA */}
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
          {/* Search bar */}
          <input
            type="text"
            data-testid="search-records-input"
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              minWidth: '180px',
            }}
          />

          {/* Type filter */}
          <select
            data-testid="filter-record-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(RECORD_TYPE_LABELS).map(([k, item]) => (
              <option key={k} value={k}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Subject filter */}
          <select
            data-testid="filter-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Mastery filter */}
          <select
            data-testid="filter-mastery-select"
            value={filterMastery}
            onChange={(e) => setFilterMastery(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <option value="">Todos os níveis de domínio</option>
            {Object.entries(MASTERY_CONFIG).map(([k, item]) => (
              <option key={k} value={k}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* New Record Button */}
        <Can action="log_learning">
          <button
            type="button"
            data-testid="open-create-record-btn"
            onClick={onOpenCreateRecord}
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
            + Novo Registro
          </button>
        </Can>
      </div>

      {/* Feed of Records */}
      {filteredRecords.length === 0 ? (
        <div
          data-testid="records-empty-state"
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div style={{ color: 'var(--sage)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="book-open" size={40} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Nenhum registro de aprendizagem encontrado
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Registre as lições concluídas, narrações orais, vivências espontâneas e o crescimento dos hábitos dos seus filhos.
          </p>
          <Can action="log_learning">
            <button
              type="button"
              data-testid="empty-create-record-btn"
              onClick={onOpenCreateRecord}
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
              Criar Primeiro Registro
            </button>
          </Can>
        </div>
      ) : (
        <div
          data-testid="records-feed-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={onEditRecord}
              onDelete={onDeleteRecord}
              onAddEvidence={onAddEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}
