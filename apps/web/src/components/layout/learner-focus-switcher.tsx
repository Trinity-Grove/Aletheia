'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';

export interface LearnerFocusSwitcherProps {
  learners: LearnerSummaryDto[];
  activeLearnerId: string | null;
  onSelectLearner: (learnerId: string | null) => void;
  compact?: boolean;
}

export function LearnerFocusSwitcher({
  learners,
  activeLearnerId,
  onSelectLearner,
  compact = false,
}: LearnerFocusSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeLearner = learners.find((l) => l.id === activeLearnerId);
  const activeLabel = activeLearner
    ? activeLearner.preferredName || activeLearner.firstName
    : 'Toda a Família';

  const handleSelect = (learnerId: string | null) => {
    onSelectLearner(learnerId);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="learner-focus-switcher"
      data-testid="learner-focus-container"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {/* Hidden select for full backward test compatibility and accessibility */}
      <select
        data-testid="learner-focus-select"
        aria-label="Foco do Educando"
        value={activeLearnerId ?? ''}
        onChange={(e) => onSelectLearner(e.target.value ? e.target.value : null)}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
        }}
      >
        <option value="">👨‍👩‍👧‍👦 Toda a Família</option>
        {learners.map((learner) => {
          const displayName = learner.preferredName || learner.firstName;
          return (
            <option key={learner.id} value={learner.id}>
              🎓 {displayName}
            </option>
          );
        })}
      </select>

      {/* Modern chip button */}
      <button
        type="button"
        data-testid="learner-focus-btn"
        aria-label={`Educando selecionado: ${activeLabel}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: compact ? '0.375rem 0.625rem' : '0.45rem 0.875rem',
          borderRadius: '9999px',
          backgroundColor: activeLearner ? '#EEF2FF' : '#F1F5F9',
          border: `1px solid ${activeLearner ? '#C7D2FE' : '#E2E8F0'}`,
          color: activeLearner ? '#3730A3' : '#334155',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {activeLearner ? (
          <span
            data-testid="learner-avatar"
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              backgroundColor: activeLearner.avatarColor || '#4F46E5',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            {activeLabel.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span role="img" aria-label="Família">
            👨‍👩‍👧‍👦
          </span>
        )}
        <span>{activeLabel}</span>
        <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <div
          data-testid="learner-focus-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            zIndex: 60,
            minWidth: '14rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            padding: '0.375rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <button
            type="button"
            data-testid="learner-focus-option-all"
            onClick={() => handleSelect(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeLearnerId === null ? '#F1F5F9' : 'transparent',
              color: '#1E293B',
              fontSize: '0.875rem',
              fontWeight: activeLearnerId === null ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '1rem' }}>👨‍👩‍👧‍👦</span>
            <span>Toda a Família</span>
          </button>

          <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '0.125rem 0' }} />

          {learners.map((l) => {
            const displayName = l.preferredName || l.firstName;
            const isSelected = activeLearnerId === l.id;
            return (
              <button
                key={l.id}
                type="button"
                data-testid={`learner-focus-option-${l.id}`}
                onClick={() => handleSelect(l.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: isSelected ? '#EEF2FF' : 'transparent',
                  color: isSelected ? '#3730A3' : '#334155',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '50%',
                    backgroundColor: l.avatarColor || '#4F46E5',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span>{displayName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
