'use client';

import React, { useState } from 'react';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { LearnerCard } from './learner-card';

export interface LearnersListProps {
  learners: LearnerResponseDto[];
  onEdit?: ((learner: LearnerResponseDto) => void) | undefined;
  onToggleArchive?: ((learner: LearnerResponseDto) => void) | undefined;
}

export function LearnersList({
  learners,
  onEdit,
  onToggleArchive,
}: LearnersListProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const activeLearners = learners.filter((l) => !l.archivedAt);
  const archivedLearners = learners.filter((l) => Boolean(l.archivedAt));

  const currentLearners = activeTab === 'active' ? activeLearners : archivedLearners;

  return (
    <div className="learners-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'active' ? 600 : 400,
            color: activeTab === 'active' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
          }}
        >
          Ativos ({activeLearners.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'archived' ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'none',
            fontWeight: activeTab === 'archived' ? 600 : 400,
            color: activeTab === 'archived' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
          }}
        >
          Arquivados ({archivedLearners.length})
        </button>
      </div>

      {currentLearners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6B7280' }}>
          <p>
            {activeTab === 'active'
              ? 'Nenhum educando ativo cadastrado.'
              : 'Nenhum educando arquivado.'}
          </p>
        </div>
      ) : (
        <div
          data-testid="learners-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {currentLearners.map((learner) => (
            <LearnerCard
              key={learner.id}
              learner={learner}
              onEdit={onEdit}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
