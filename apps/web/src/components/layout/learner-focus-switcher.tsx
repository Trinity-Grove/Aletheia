'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
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
        <option value="">Toda a Família</option>
        {learners.map((learner) => {
          const displayName = learner.preferredName || learner.firstName;
          return (
            <option key={learner.id} value={learner.id}>
              {displayName}
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
          borderRadius: 'var(--radius-full)',
          backgroundColor: activeLearner ? 'var(--color-indigo-50)' : 'var(--sage-soft)',
          border: `1px solid ${activeLearner ? 'var(--color-indigo-100)' : 'var(--border-light)'}`,
          color: activeLearner ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {activeLearner ? (
          <span
            data-testid="learner-avatar"
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              backgroundColor: activeLearner.avatarColor || 'var(--color-indigo-600)',
              color: 'var(--text-inverse)',
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
          <span aria-label="Família" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <AletheiaIcon name="users" size={14} style={{ color: 'var(--color-indigo-600)' }} />
          </span>
        )}
        <span>{activeLabel}</span>
        <AletheiaIcon name="chevron-down" size={12} style={{ opacity: 0.7 }} />
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
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-light)',
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
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeLearnerId === null ? 'var(--sage-soft)' : 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: activeLearnerId === null ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <AletheiaIcon name="users" size={16} style={{ color: 'var(--color-indigo-600)' }} />
            <span>Toda a Família</span>
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '0.125rem 0' }} />

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
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--color-indigo-50)' : 'transparent',
                  color: isSelected ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
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
                    backgroundColor: l.avatarColor || 'var(--color-indigo-600)',
                    color: 'var(--text-inverse)',
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
