'use client';

import React, { type ReactNode } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';

export interface LearnerFocusSwitcherProps {
  learners: LearnerSummaryDto[];
  activeLearnerId: string | null;
  onSelectLearner: (learnerId: string | null) => void;
}

export function LearnerFocusSwitcher({
  learners,
  activeLearnerId,
  onSelectLearner,
}: LearnerFocusSwitcherProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectLearner(value ? value : null);
  };

  return (
    <div className="learner-focus-switcher" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <select
        data-testid="learner-focus-select"
        value={activeLearnerId ?? ''}
        onChange={handleChange}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #D1D5DB',
          backgroundColor: '#FFFFFF',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        <option value="">👨‍👩‍👧‍👦 Toda a Família</option>
        {learners
          .filter((learner) => !learner.isArchived)
          .map((learner) => (
            <option key={learner.id} value={learner.id}>
              🎓 {learner.displayName}
            </option>
          ))}
      </select>
    </div>
  );
}

export interface ProductShellProps {
  children: ReactNode;
  learners?: LearnerSummaryDto[];
  activeLearnerId?: string | null;
  onSelectLearner?: (learnerId: string | null) => void;
}

export function ProductShell({
  children,
  learners,
  activeLearnerId = null,
  onSelectLearner,
}: ProductShellProps) {
  return (
    <div className="product-shell">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <strong>Aletheia</strong>
        {learners && onSelectLearner && (
          <LearnerFocusSwitcher
            learners={learners}
            activeLearnerId={activeLearnerId}
            onSelectLearner={onSelectLearner}
          />
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

