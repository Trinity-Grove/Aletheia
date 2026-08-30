'use client';

import React, { useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
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
        {/* Tab Switchers */}
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
            <button
              type="button"
              data-testid="add-learner-btn-list"
              onClick={onAddLearner}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-indigo-700)',
                color: 'var(--text-inverse)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              + Adicionar Educando
            </button>
          </Can>
        )}
      </div>

      {/* Grid or Empty State */}
      {currentLearners.length === 0 ? (
        <div
          data-testid="learners-empty-state"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-indigo-50)',
              color: 'var(--color-indigo-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <AletheiaIcon name="graduation-cap" size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeTab === 'active'
                ? 'Nenhum educando ativo cadastrado'
                : 'Nenhum educando arquivado'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '28rem' }}>
              {activeTab === 'active'
                ? 'Cadastre os seus filhos para começar a personalizar planos de estudos, acompanhar registros e devocionais.'
                : 'Educandos arquivados serão listados aqui caso deseje reativá-los no futuro.'}
            </p>
          </div>

          {activeTab === 'active' && onAddLearner && (
            <Can action="create_learner">
              <button
                type="button"
                data-testid="add-learner-empty-btn"
                onClick={onAddLearner}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-indigo-700)',
                  color: 'var(--text-inverse)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                + Adicionar Educando
              </button>
            </Can>
          )}
        </div>
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
