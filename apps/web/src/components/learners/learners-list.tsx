'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Button, EmptyState } from '@aletheia/ui';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { LearnerCard } from './learner-card';
import { Can } from '../auth/role-guard';

export interface LearnersListProps {
  learners: LearnerResponseDto[];
  onEdit?: ((learner: LearnerResponseDto) => void) | undefined;
  onToggleArchive?: ((learner: LearnerResponseDto) => void) | undefined;
  onAddLearner?: (() => void) | undefined;
}

export function LearnersList({
  learners,
  onEdit,
  onToggleArchive,
  onAddLearner,
}: LearnersListProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const activeLearners = learners.filter((l) => !l.archivedAt);
  const archivedLearners = learners.filter((l) => Boolean(l.archivedAt));

  const currentLearners = activeTab === 'active' ? activeLearners : archivedLearners;

  return (
    <div
      className="learners-list-container"
      data-testid="learners-list-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Top Header & Tab Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.75rem',
        }}
      >
        {/* Tab Switchers — custom pattern, no Tabs component exists in @aletheia/ui yet */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            data-testid="tab-active-learners"
            onClick={() => setActiveTab('active')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'active' ? 'var(--color-indigo-50)' : 'transparent',
              color: activeTab === 'active' ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'active' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Educandos Ativos</span>
            <span
              data-testid="active-learners-count-badge"
              style={{
                backgroundColor: activeTab === 'active' ? 'var(--color-indigo-700)' : 'var(--border-light)',
                color: activeTab === 'active' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {activeLearners.length}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-archived-learners"
            onClick={() => setActiveTab('archived')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'archived' ? 'var(--sage-soft)' : 'transparent',
              color: activeTab === 'archived' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'archived' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Arquivados</span>
            <span
              data-testid="archived-learners-count-badge"
              style={{
                backgroundColor: activeTab === 'archived' ? 'var(--text-secondary)' : 'var(--border-light)',
                color: activeTab === 'archived' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {archivedLearners.length}
            </span>
          </button>
        </div>

        {/* Optional Header Add button if onAddLearner provided */}
        {onAddLearner && (
          <Can action="create_learner">
            <Button data-testid="add-learner-btn-list" onClick={onAddLearner}>
              + Adicionar Educando
            </Button>
          </Can>
        )}
      </div>

      {/* Grid or Empty State */}
      {currentLearners.length === 0 ? (
        <EmptyState
          data-testid="learners-empty-state"
          icon={<AletheiaIcon name="graduation-cap" size={32} />}
          title={
            activeTab === 'active'
              ? 'Nenhum educando ativo cadastrado'
              : 'Nenhum educando arquivado'
          }
          description={
            activeTab === 'active'
              ? 'Cadastre os seus filhos para começar a personalizar planos de estudos, acompanhar registros e devocionais.'
              : 'Educandos arquivados serão listados aqui caso deseje reativá-los no futuro.'
          }
          action={
            activeTab === 'active' && onAddLearner ? (
              <Can action="create_learner">
                <Button data-testid="add-learner-empty-btn" onClick={onAddLearner}>
                  + Adicionar Educando
                </Button>
              </Can>
            ) : undefined
          }
        />
      ) : (
        <div
          data-testid="learners-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
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
