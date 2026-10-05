import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { LearnerBadgeDto, LearnerGamificationSummaryDto } from '@aletheia/contracts';
import LearnerAgendaPage from '../app/aluno/agenda/page';
import { LearnerPortalBadgesSection } from '../src/components/learners/learner-portal-badges-section';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function badge(overrides: Partial<LearnerBadgeDto>): LearnerBadgeDto {
  return {
    code: 'FIRST_STEP',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    icon: '🌱',
    metric: 'LEARNING_DAYS',
    threshold: 1,
    current: 1,
    earned: true,
    awardedAt: '2026-10-05T12:00:00.000Z',
    isNew: false,
    ...overrides,
  };
}

function summary(badges: LearnerBadgeDto[]): LearnerGamificationSummaryDto {
  return {
    learnerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    xp: 150,
    level: { code: 'SPROUT', number: 2, currentLevelXp: 100, nextLevelXp: 300 },
    streak: { current: 4, longest: 6, activeToday: true },
    stats: {
      LEARNING_DAYS: 8,
      LONGEST_STREAK: 6,
      LEARNING_RECORDS: 9,
      LEARNING_MINUTES: 300,
      READING_LOGS: 0,
      EVIDENCE_SUBMITTED: 1,
      EVIDENCE_VALIDATED: 0,
      PORTFOLIO_HIGHLIGHTS: 0,
      PROJECTS: 0,
      COMPETENCIES_ACHIEVED: 0,
      SUBJECTS_EXPLORED: 2,
      HABIT_PRACTICES: 0,
      PRAYERS_ANSWERED: 0,
    },
    badges,
    earnedCount: badges.filter((b) => b.earned).length,
    totalCount: badges.length,
  };
}

const fixtureBadges = [
  badge({ code: 'FIRST_STEP' }),
  badge({ code: 'STREAK_3', icon: '✨', metric: 'LONGEST_STREAK', threshold: 3, current: 6, isNew: true }),
  badge({
    code: 'HOURS_10',
    category: 'LEARNING',
    icon: '⏳',
    metric: 'LEARNING_MINUTES',
    threshold: 600,
    current: 300,
    earned: false,
    awardedAt: null,
  }),
];

function mockFetch(data: LearnerGamificationSummaryDto) {
  const acknowledgeBodies: unknown[] = [];
  const spy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes('/agenda')) {
      return { ok: true, json: async () => ({ date: '2026-10-05', items: [] }) } as Response;
    }
    if (url.endsWith('/badges/acknowledge')) {
      acknowledgeBodies.push(JSON.parse(String(init?.body)));
      return { ok: true, json: async () => ({ acknowledged: 1 }) } as Response;
    }
    if (url.endsWith('/badges')) {
      return { ok: true, json: async () => data } as Response;
    }
    return { ok: false, status: 404 } as Response;
  });
  return { spy, acknowledgeBodies };
}

describe('Learner portal badges', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows growth level, streak, grouped badges and locked progress in the badges tab', async () => {
    localStorage.setItem('learner_session', JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' }));
    const { spy } = mockFetch(summary(fixtureBadges.map((b) => ({ ...b, isNew: false }))));

    render(<LearnerAgendaPage />);
    fireEvent.click(screen.getByTestId('tab-badges'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        '/api/v1/learner-access/learners/l-1/badges',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(screen.getByTestId('learner-badges-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('badges-level-card')).toHaveTextContent('Broto');
    expect(screen.getByTestId('badges-level-card')).toHaveTextContent('Nível 2');
    expect(screen.getByTestId('badges-streak-card')).toHaveTextContent('4 dias');
    expect(screen.getByTestId('badges-earned-ratio')).toHaveTextContent('2 de 3 conquistas');

    const consistency = screen.getByTestId('badge-category-CONSISTENCY');
    expect(within(consistency).getByText('Primeiro Passo')).toBeInTheDocument();
    const hours = screen.getByTestId('badge-tile-HOURS_10');
    expect(hours).toHaveAttribute('data-earned', 'false');
    expect(hours).toHaveTextContent('5h de 10h');
    expect(screen.queryByTestId('badge-unlock-modal')).not.toBeInTheDocument();
  });

  it('celebrates newly earned badges and acknowledges them on continue', async () => {
    localStorage.setItem('learner_session', JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' }));
    const { acknowledgeBodies } = mockFetch(summary(fixtureBadges));

    render(<LearnerAgendaPage />);
    fireEvent.click(screen.getByTestId('tab-badges'));

    const modal = await screen.findByTestId('badge-unlock-modal');
    expect(within(modal).getByText('Nova conquista!')).toBeInTheDocument();
    expect(within(modal).getByTestId('unlocked-badge-STREAK_3')).toHaveTextContent('Faísca');
    expect(within(modal).queryByTestId('unlocked-badge-FIRST_STEP')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('badge-unlock-continue-btn'));

    await waitFor(() => {
      expect(acknowledgeBodies).toEqual([{ badgeCodes: ['STREAK_3'] }]);
      expect(screen.queryByTestId('badge-unlock-modal')).not.toBeInTheDocument();
    });
  });

  it('shows an error when badges fail to load', async () => {
    localStorage.setItem('learner_session', JSON.stringify({ learnerId: 'l-1', displayName: 'Clarinha' }));
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/agenda')) {
        return { ok: true, json: async () => ({ date: '2026-10-05', items: [] }) } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    render(<LearnerAgendaPage />);
    fireEvent.click(screen.getByTestId('tab-badges'));

    expect(await screen.findByText('Não foi possível carregar suas conquistas.')).toBeInTheDocument();
  });

  it('renders only earned badges in the guardian section', () => {
    render(<LearnerPortalBadgesSection summary={summary(fixtureBadges)} learnerName="Clarinha" />);

    const section = screen.getByTestId('guardian-portal-badges');
    expect(section).toHaveTextContent('Conquistas do Portal');
    expect(within(section).getByTestId('badge-tile-FIRST_STEP')).toBeInTheDocument();
    expect(within(section).queryByTestId('badge-tile-HOURS_10')).not.toBeInTheDocument();
    expect(within(section).queryByText('Nova!')).not.toBeInTheDocument();
  });
});
