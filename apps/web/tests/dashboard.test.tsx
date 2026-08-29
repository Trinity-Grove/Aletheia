import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { LearnerFocusHeader } from '../src/components/dashboard/learner-focus-header';
import { ActivityList, DailyJourney, type DailyActivityItem } from '@aletheia/ui';

describe('Dashboard Component Suite', () => {
  afterEach(cleanup);

  describe('LearnerFocusHeader', () => {
    it('renders active learner info and triggers focus selection', () => {
      const handleSelect = vi.fn();
      const mockLearners = [
        { id: '1', firstName: 'Ana Clara', stage: 'PRIMARY_GRAMMAR' as const },
        { id: '2', firstName: 'Mateus', stage: 'PRIMARY_GRAMMAR' as const },
      ];

      render(
        <LearnerFocusHeader
          learners={mockLearners}
          activeLearnerId="1"
          onSelectLearner={handleSelect}
        />
      );

      expect(screen.getByTestId('learner-focus-header')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Ana Clara' })).toBeInTheDocument();

      const pill2 = screen.getByTestId('learner-pill-2');
      fireEvent.click(pill2);
      expect(handleSelect).toHaveBeenCalledWith('2');
    });
  });

  describe('DailyJourney', () => {
    it('renders progress bar and metrics for daily instruction time and lessons', () => {
      render(
        <DailyJourney
          completedMinutes={120}
          targetMinutes={240}
          completedLessons={2}
          totalLessons={4}
          daySequence={42}
        />
      );

      expect(screen.getByText('Jornada Diária de Aprendizagem')).toBeInTheDocument();
      expect(screen.getByText('50% da Meta')).toBeInTheDocument();
      expect(screen.getByText('2/4')).toBeInTheDocument();
      expect(screen.getByText('2.0h')).toBeInTheDocument();
    });
  });

  describe('ActivityList', () => {
    it('renders scheduled activities and toggles completion status', () => {
      const handleToggle = vi.fn();
      const mockActivities: DailyActivityItem[] = [
        {
          id: 'act-1',
          title: 'Devocional Matinal',
          subjectName: 'Devocional',
          completed: false,
          type: 'devotional',
        },
      ];

      render(<ActivityList activities={mockActivities} onToggleComplete={handleToggle} />);

      expect(screen.getByText('Devocional Matinal')).toBeInTheDocument();
      const toggleBtn = screen.getByTestId('toggle-activity-act-1');
      fireEvent.click(toggleBtn);
      expect(handleToggle).toHaveBeenCalledWith('act-1');
    });
  });
});
