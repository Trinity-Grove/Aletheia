import React from 'react';
import { Button, Select } from '@aletheia/ui';
import type { AcademicYearResponseDto } from '@aletheia/contracts';

export interface AcademicYearSwitcherProps {
  years: AcademicYearResponseDto[];
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  onCreateYear?: () => void;
}

export function AcademicYearSwitcher({
  years,
  activeYearId,
  onSelectYear,
  onCreateYear,
}: AcademicYearSwitcherProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label
        htmlFor="academic-year-select"
        style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        Ano Letivo:
      </label>
      <Select
        id="academic-year-select"
        data-testid="academic-year-select"
        value={activeYearId}
        onChange={(e) => onSelectYear(e.target.value)}
        options={years.map((y) => ({
          value: y.id,
          label: `${y.title}${y.isCurrent ? ' (Atual)' : ''}`,
        }))}
      />
      {onCreateYear && (
        <Button variant="secondary" size="sm" data-testid="create-year-btn" onClick={onCreateYear}>
          + Novo Ano
        </Button>
      )}
    </div>
  );
}
