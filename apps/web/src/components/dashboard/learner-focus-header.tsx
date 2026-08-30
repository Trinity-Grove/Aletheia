'use client';

import React from 'react';

export interface LearnerFocusHeaderProps {
  learners: Array<{ id: string; displayName: string }>;
  activeLearnerId: string | null;
  onSelectLearner: (learnerId: string | null) => void;
}

export function LearnerFocusHeader({
  learners,
  activeLearnerId,
  onSelectLearner,
}: LearnerFocusHeaderProps) {
  const activeLearner =
    learners.find((l) => l.id === activeLearnerId) ?? null;

  return (
    <div
      data-testid="learner-focus-header"
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-brand-forest)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(18, 63, 52, 0.2)',
          }}
        >
          {activeLearner?.displayName?.charAt(0) || 'E'}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: '1.375rem',
                color: 'var(--color-brand-forest)',
                fontWeight: 400,
              }}
            >
              {activeLearner ? activeLearner.displayName : 'Todos os Educandos'}
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Foco pedagógico e jornada diária personalizada
          </p>
        </div>
      </div>

      {learners.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Alternar foco:
          </span>
          {learners.map((l) => {
            const isSelected = l.id === activeLearner?.id;
            return (
              <button
                key={l.id}
                type="button"
                data-testid={`learner-pill-${l.id}`}
                onClick={() => onSelectLearner(l.id)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: isSelected ? '1.5px solid var(--color-brand-forest)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--color-brand-forest)' : 'var(--bg-surface)',
                  color: isSelected ? 'var(--text-inverse)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {l.displayName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
