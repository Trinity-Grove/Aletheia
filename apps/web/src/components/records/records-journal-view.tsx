'use client';

import React, { useMemo, useState } from 'react';
import { AletheiaIcon, Button, EmptyState, Input, Select } from '@aletheia/ui';
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
          <Input
            type="text"
            data-testid="search-records-input"
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '180px' }}
          />

          <Select
            data-testid="filter-record-type-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'Todos os tipos' },
              ...Object.entries(RECORD_TYPE_LABELS).map(([k, item]) => ({ value: k, label: item.label })),
            ]}
          />

          <Select
            data-testid="filter-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            options={[
              { value: '', label: 'Todas as disciplinas' },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <Select
            data-testid="filter-mastery-select"
            value={filterMastery}
            onChange={(e) => setFilterMastery(e.target.value)}
            options={[
              { value: '', label: 'Todos os níveis de domínio' },
              ...Object.entries(MASTERY_CONFIG).map(([k, item]) => ({ value: k, label: item.label })),
            ]}
          />
        </div>

        {/* New Record Button */}
        <Can action="log_learning">
          <Button data-testid="open-create-record-btn" onClick={onOpenCreateRecord}>
            + Novo Registro
          </Button>
        </Can>
      </div>

      {/* Feed of Records */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          data-testid="records-empty-state"
          icon={<AletheiaIcon name="book-open" size={40} style={{ color: 'var(--sage)' }} />}
          title="Nenhum registro de aprendizagem encontrado"
          description="Registre as lições concluídas, narrações orais, vivências espontâneas e o crescimento dos hábitos dos seus filhos."
          action={
            <Can action="log_learning">
              <Button data-testid="empty-create-record-btn" onClick={onOpenCreateRecord}>
                Criar Primeiro Registro
              </Button>
            </Can>
          }
        />
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
