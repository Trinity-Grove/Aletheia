import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AttendanceResponseDto, LearnerSummaryDto } from '@aletheia/contracts';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { AttendanceTrackerView } from '../src/components/reports/attendance-tracker-view';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

const mockLearners: LearnerSummaryDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    firstName: 'Samuel',
    lastName: 'Silva',
    preferredName: 'Samuca',
    stage: 'PRIMARY',
    avatarColor: '#3B82F6',
  },
  {
    id: '00000000-0000-0000-0000-000000000020',
    firstName: 'Ester',
    lastName: 'Silva',
    preferredName: 'Teca',
    stage: 'PRIMARY',
    avatarColor: '#EC4899',
  },
];

const mockRecords: AttendanceResponseDto[] = [
  {
    id: 'att-auto-1',
    familyId: '00000000-0000-0000-0000-000000000001',
    learnerId: '00000000-0000-0000-0000-000000000010',
    learnerName: 'Samuca',
    date: '2026-10-10',
    status: 'PRESENT',
    hoursSpent: 4,
    notes: 'Lição concluída: Botânica',
    isAutoLogged: true,
    source: 'AUTO_LESSON',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'att-manual-1',
    familyId: '00000000-0000-0000-0000-000000000001',
    learnerId: '00000000-0000-0000-0000-000000000010',
    learnerName: 'Samuca',
    date: '2026-10-09',
    status: 'PRESENT',
    hoursSpent: 4.5,
    notes: 'Registro manual da sexta-feira',
    isAutoLogged: false,
    source: 'MANUAL',
    createdAt: '2026-10-09T18:00:00.000Z',
    updatedAt: '2026-09-09T18:00:00.000Z',
  },
  {
    id: 'att-bulk-1',
    familyId: '00000000-0000-0000-0000-000000000001',
    learnerId: '00000000-0000-0000-0000-000000000020',
    learnerName: 'Teca',
    date: '2026-10-08',
    status: 'FIELD_TRIP',
    hoursSpent: 5,
    notes: 'Visita ao museu',
    isAutoLogged: false,
    source: 'BULK_IMPORT',
    createdAt: '2026-10-08T18:00:00.000Z',
    updatedAt: '2026-10-08T18:00:00.000Z',
  },
];

describe('AttendanceTrackerView', () => {
  it('renderiza a listagem de registros na tabela de frequência', () => {
    render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={mockRecords}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('attendance-records-table')).toBeInTheDocument();
    expect(screen.getByTestId('attendance-row-att-auto-1')).toBeInTheDocument();
    expect(screen.getByTestId('attendance-row-att-manual-1')).toBeInTheDocument();
    expect(screen.getByTestId('attendance-row-att-bulk-1')).toBeInTheDocument();
  });

  it('exibe o badge de origem "Auto (Lição)" para registros com source AUTO_LESSON', () => {
    render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={mockRecords}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    const autoBadge = screen.getByTestId('attendance-source-badge-att-auto-1');
    expect(autoBadge).toBeInTheDocument();
    expect(autoBadge).toHaveTextContent('Auto (Lição)');
  });

  it('não exibe badge de lição automática para registros manuais ou em lote', () => {
    render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={mockRecords}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    expect(screen.queryByTestId('attendance-source-badge-att-manual-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('attendance-source-badge-att-bulk-1')).not.toBeInTheDocument();
  });

  it('exibe o badge de origem traduzido em en-US ("Auto (Lesson)") e es-ES ("Auto (Lección)")', () => {
    localStorage.setItem('aletheia_locale', 'en-US');
    const { unmount } = render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={mockRecords}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('attendance-source-badge-att-auto-1')).toHaveTextContent('Auto (Lesson)');
    unmount();

    localStorage.setItem('aletheia_locale', 'es-ES');
    render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={mockRecords}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('attendance-source-badge-att-auto-1')).toHaveTextContent('Auto (Lección)');
  });

  it('exibe estado vazio quando não há registros', () => {
    render(
      <AuthProvider role="OWNER_GUARDIAN">
        <LocaleProvider>
          <AttendanceTrackerView
            records={[]}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn()}
            onBulkLogAttendance={vi.fn()}
          />
        </LocaleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('attendance-empty-state')).toBeInTheDocument();
  });
});
