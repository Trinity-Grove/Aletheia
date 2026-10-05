import { NotFoundException } from '@nestjs/common';
import type { LearnerBadgeAward } from '@prisma/client';
import { GamificationService, deriveStats } from './gamification.service.js';
import type {
  LearnerActivitySnapshot,
  LearnerBadgeRepository,
} from '../infrastructure/learner-badge.repository.js';

const FAMILY_ID = 'fam-1';
const LEARNER_ID = 'learner-1';

function activity(overrides: Partial<LearnerActivitySnapshot> = {}): LearnerActivitySnapshot {
  return {
    records: [],
    attendance: [],
    evidenceSubmitted: 0,
    evidenceValidated: 0,
    portfolioHighlights: 0,
    competenciesAchieved: 0,
    prayersAnswered: 0,
    ...overrides,
  };
}

function record(date: string, overrides: Partial<LearnerActivitySnapshot['records'][number]> = {}) {
  return {
    date: new Date(`${date}T00:00:00.000Z`),
    durationMinutes: 30,
    type: 'PLANNED_LESSON',
    subjectId: 'subject-1',
    characterHabitGrowth: null,
    ...overrides,
  };
}

describe('deriveStats', () => {
  it('derives every metric from records, attendance and counts', () => {
    const { stats, streak } = deriveStats(
      activity({
        records: [
          record('2026-10-01'),
          record('2026-10-01', { type: 'READING_LOG', subjectId: 'subject-2', durationMinutes: null }),
          record('2026-10-02', { type: 'PROJECT_WORK', characterHabitGrowth: 'Patience' }),
          record('2026-10-05', { type: 'HABIT_PRACTICE', subjectId: null }),
        ],
        attendance: [
          { date: new Date('2026-09-30T00:00:00.000Z'), status: 'PRESENT' },
          { date: new Date('2026-09-29T00:00:00.000Z'), status: 'SICK' },
          { date: new Date('2026-09-28T00:00:00.000Z'), status: 'UNEXCUSED_ABSENCE' },
        ],
        evidenceSubmitted: 4,
        evidenceValidated: 2,
        portfolioHighlights: 1,
        competenciesAchieved: 1,
        prayersAnswered: 1,
      }),
      '2026-10-05',
    );

    expect(stats).toEqual({
      LEARNING_DAYS: 4,
      LONGEST_STREAK: 4,
      LEARNING_RECORDS: 4,
      LEARNING_MINUTES: 90,
      READING_LOGS: 1,
      EVIDENCE_SUBMITTED: 4,
      EVIDENCE_VALIDATED: 2,
      PORTFOLIO_HIGHLIGHTS: 1,
      PROJECTS: 1,
      COMPETENCIES_ACHIEVED: 1,
      SUBJECTS_EXPLORED: 2,
      HABIT_PRACTICES: 2,
      PRAYERS_ANSWERED: 1,
    });
    expect(streak).toEqual({ current: 4, longest: 4, activeToday: true });
  });
});

describe('GamificationService', () => {
  let repository: jest.Mocked<LearnerBadgeRepository>;
  let service: GamificationService;

  beforeEach(() => {
    repository = {
      learnerExists: jest.fn().mockResolvedValue(true),
      loadActivity: jest.fn(),
      grantAndList: jest.fn(),
      acknowledge: jest.fn(),
    } as unknown as jest.Mocked<LearnerBadgeRepository>;
    service = new GamificationService(repository);
  });

  it('grants every badge whose threshold is reached and returns the summary', async () => {
    repository.loadActivity.mockResolvedValue(
      activity({ records: [record('2026-10-05')], evidenceSubmitted: 1 }),
    );
    const awardedAt = new Date('2026-10-05T10:00:00.000Z');
    repository.grantAndList.mockImplementation(async (_familyId, learnerId, codes) =>
      codes.map(
        (badgeCode, index) =>
          ({ id: `award-${index}`, familyId: FAMILY_ID, learnerId, badgeCode, awardedAt, acknowledgedAt: null }) as LearnerBadgeAward,
      ),
    );

    const summary = await service.getSummary(FAMILY_ID, LEARNER_ID, '2026-10-05');

    expect(repository.grantAndList).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, ['FIRST_STEP', 'FIRST_EVIDENCE']);
    expect(summary.earnedCount).toBe(2);
    expect(summary.badges.filter((badge) => badge.isNew).map((badge) => badge.code)).toEqual([
      'FIRST_STEP',
      'FIRST_EVIDENCE',
    ]);
    expect(summary.streak.activeToday).toBe(true);
  });

  it('rejects a learner outside the family', async () => {
    repository.learnerExists.mockResolvedValue(false);
    await expect(service.getSummary(FAMILY_ID, 'other-learner')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.acknowledgeBadges(FAMILY_ID, 'other-learner')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.loadActivity).not.toHaveBeenCalled();
    expect(repository.acknowledge).not.toHaveBeenCalled();
  });

  it('acknowledges the requested badges', async () => {
    repository.acknowledge.mockResolvedValue(2);
    await expect(service.acknowledgeBadges(FAMILY_ID, LEARNER_ID, ['FIRST_STEP'])).resolves.toBe(2);
    expect(repository.acknowledge).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, ['FIRST_STEP']);
  });
});
