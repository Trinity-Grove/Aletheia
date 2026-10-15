import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { PortfolioTimelineView } from '../src/components/records/portfolio-timeline-view';

const item = (overrides: Record<string, unknown>) => ({
  id: 'item-1',
  familyId: 'family-1',
  learnerId: 'learner-1',
  title: 'Foto do experimento',
  description: 'A experiência do jardim',
  type: 'IMAGE',
  fileUrl: null,
  textContent: null,
  mimeType: 'image/jpeg',
  fileSizeBytes: 100,
  capturedAt: '2026-09-20',
  isHighlight: false,
  tags: [],
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  ...overrides,
});

const record = (overrides: Record<string, unknown>) => ({
  id: 'record-1',
  familyId: 'family-1',
  learnerId: 'learner-1',
  learnerName: 'Sofia',
  subjectId: null,
  subjectName: null,
  type: 'PLANNED_LESSON',
  title: 'Experimento de sementes',
  description: null,
  date: '2026-09-19',
  durationMinutes: 30,
  masteryLevel: 'MASTERED',
  assessmentMethod: 'OBSERVATION',
  strengths: null,
  areasForGrowth: null,
  characterHabitGrowth: null,
  notes: 'A Sofia explicou o ciclo da planta.',
  objectives: [],
  portfolioItemIds: [],
  createdAt: '2026-09-19T10:00:00.000Z',
  updatedAt: '2026-09-19T10:00:00.000Z',
  ...overrides,
});

describe('PortfolioTimelineView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows photos, reflections, completed books and mastery milestones for the selected learner', () => {
    render(
      <LocaleProvider>
        <PortfolioTimelineView
          items={[item({}), item({ id: 'other-item', learnerId: 'learner-2', title: 'Outro educando' })] as never[]}
          records={[
            record({}),
            record({ id: 'book-1', type: 'READING_LOG', title: 'O jardim secreto', masteryLevel: 'MASTERED', notes: null }),
            record({ id: 'other-record', learnerId: 'learner-2', title: 'Não mostrar' }),
          ] as never[]}
          activeLearnerId="learner-1"
          onResolveMediaUrl={vi.fn().mockResolvedValue('https://cdn.example/photo.jpg')}
        />
      </LocaleProvider>,
    );

    expect(screen.getByTestId('portfolio-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-event-item-1')).toHaveTextContent('Foto do experimento');
    expect(screen.getByTestId('timeline-event-record-1')).toHaveTextContent('Marco de aprendizagem');
    expect(screen.getByTestId('timeline-event-book-1')).toHaveTextContent('O jardim secreto');
    expect(screen.getByTestId('timeline-event-book-1')).toHaveTextContent('Livro concluído');
    expect(screen.getByTestId('timeline-event-record-1')).toHaveTextContent('A Sofia explicou o ciclo da planta.');
    expect(screen.queryByText('Não mostrar')).not.toBeInTheDocument();
    expect(screen.getByTestId('timeline-year-2026')).toBeInTheDocument();
  });

  it('renders a helpful empty state when there are no memories for the learner', () => {
    render(
      <LocaleProvider>
        <PortfolioTimelineView items={[]} records={[]} activeLearnerId="learner-1" />
      </LocaleProvider>,
    );

    expect(screen.getByTestId('portfolio-timeline-empty')).toBeInTheDocument();
  });

  it('does not show another learner history in the empty state', () => {
    render(
      <LocaleProvider>
        <PortfolioTimelineView
          items={[item({ learnerId: 'learner-2' })] as never[]}
          records={[record({ learnerId: 'learner-2' })] as never[]}
          activeLearnerId="learner-1"
        />
      </LocaleProvider>,
    );

    expect(screen.getByTestId('portfolio-timeline-empty')).toBeInTheDocument();
    expect(screen.queryByText('Foto do experimento')).not.toBeInTheDocument();
  });
});
