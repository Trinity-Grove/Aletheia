import { computeTrustScore, AuthorTrustService } from './author-trust.service.js';
import type { AuthorTrustProfile } from '@prisma/client';

describe('Author Trust', () => {
  describe('computeTrustScore', () => {
    it('calculates base score for a brand-new author with no activity', () => {
      const result = computeTrustScore({
        accountAgeDays: 0,
        approvedCount: 0,
        rejectedCount: 0,
        upheldReportsCount: 0,
      });

      expect(result).toEqual({
        score: 10,
        tier: 'NOVICE',
      });
    });

    it('applies account age bonus capped at +20', () => {
      // 29 days -> +0
      expect(
        computeTrustScore({ accountAgeDays: 29, approvedCount: 0, rejectedCount: 0, upheldReportsCount: 0 }),
      ).toEqual({ score: 10, tier: 'NOVICE' });

      // 30 days -> +5
      expect(
        computeTrustScore({ accountAgeDays: 30, approvedCount: 0, rejectedCount: 0, upheldReportsCount: 0 }),
      ).toEqual({ score: 15, tier: 'NOVICE' });

      // 60 days -> +10
      expect(
        computeTrustScore({ accountAgeDays: 60, approvedCount: 0, rejectedCount: 0, upheldReportsCount: 0 }),
      ).toEqual({ score: 20, tier: 'NOVICE' });

      // 120 days -> +20 (capped at +20)
      expect(
        computeTrustScore({ accountAgeDays: 120, approvedCount: 0, rejectedCount: 0, upheldReportsCount: 0 }),
      ).toEqual({ score: 30, tier: 'NOVICE' });

      // 365 days -> +20 (capped at +20)
      expect(
        computeTrustScore({ accountAgeDays: 365, approvedCount: 0, rejectedCount: 0, upheldReportsCount: 0 }),
      ).toEqual({ score: 30, tier: 'NOVICE' });
    });

    it('promotes to VERIFIED when score reaches 40 (e.g. 2 approved packs)', () => {
      const result = computeTrustScore({
        accountAgeDays: 0,
        approvedCount: 2, // 10 + 30 = 40
        rejectedCount: 0,
        upheldReportsCount: 0,
      });

      expect(result).toEqual({
        score: 40,
        tier: 'VERIFIED',
      });
    });

    it('promotes to TRUSTED when score reaches 80 (e.g. 5 approved packs)', () => {
      const result = computeTrustScore({
        accountAgeDays: 0,
        approvedCount: 5, // 10 + 75 = 85
        rejectedCount: 0,
        upheldReportsCount: 0,
      });

      expect(result).toEqual({
        score: 85,
        tier: 'TRUSTED',
      });
    });

    it('applies penalties for upheld reports (-20) and rejected packs (-30)', () => {
      // 1 upheld report (-20): base 10 + 2 approved (30) - 20 = 20 -> tier 'NOVICE'
      expect(
        computeTrustScore({
          accountAgeDays: 0,
          approvedCount: 2,
          rejectedCount: 0,
          upheldReportsCount: 1,
        }),
      ).toEqual({
        score: 20,
        tier: 'NOVICE',
      });

      // 1 rejected pack (-30): base 10 + 2 approved (30) - 30 = 10 -> tier 'NOVICE'
      expect(
        computeTrustScore({
          accountAgeDays: 0,
          approvedCount: 2,
          rejectedCount: 1,
          upheldReportsCount: 0,
        }),
      ).toEqual({
        score: 10,
        tier: 'NOVICE',
      });
    });

    it('clamps score between 0 and 100 (floor and ceiling)', () => {
      // High penalties clamp to minimum 0
      const belowZero = computeTrustScore({
        accountAgeDays: 0,
        approvedCount: 0,
        rejectedCount: 5, // 10 - 150 = -140 -> 0
        upheldReportsCount: 2,
      });
      expect(belowZero).toEqual({
        score: 0,
        tier: 'NOVICE',
      });

      // High bonuses clamp to maximum 100
      const aboveHundred = computeTrustScore({
        accountAgeDays: 365, // +20
        approvedCount: 10, // +150 -> 10 + 20 + 150 = 180 -> 100
        rejectedCount: 0,
        upheldReportsCount: 0,
      });
      expect(aboveHundred).toEqual({
        score: 100,
        tier: 'TRUSTED',
      });
    });
  });

  describe('AuthorTrustService', () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    const mockProfile: AuthorTrustProfile = {
      userId,
      trustScore: 10,
      tier: 'NOVICE',
      approvedPacksCount: 0,
      rejectedPacksCount: 0,
      upheldReportsCount: 0,
      lastEvaluatedAt: new Date('2026-09-01T00:00:00Z'),
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
    };

    let repository: {
      findByUserId: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    let prisma: {
      user: {
        findUniqueOrThrow: jest.Mock;
      };
    };
    let service: AuthorTrustService;

    beforeEach(() => {
      repository = {
        findByUserId: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      };
      prisma = {
        user: {
          findUniqueOrThrow: jest.fn(),
        },
      };
      service = new AuthorTrustService(repository as never, prisma as never);
    });

    describe('getOrCreateProfile', () => {
      it('returns existing profile when found', async () => {
        repository.findByUserId.mockResolvedValue(mockProfile);

        const result = await service.getOrCreateProfile(userId);

        expect(result).toEqual(mockProfile);
        expect(repository.findByUserId).toHaveBeenCalledWith(userId);
        expect(repository.create).not.toHaveBeenCalled();
      });

      it('creates new profile with default values when not found', async () => {
        repository.findByUserId.mockResolvedValue(null);
        repository.create.mockResolvedValue(mockProfile);

        const result = await service.getOrCreateProfile(userId);

        expect(result).toEqual(mockProfile);
        expect(repository.findByUserId).toHaveBeenCalledWith(userId);
        expect(repository.create).toHaveBeenCalledWith(userId);
      });
    });

    describe('recalculateScore', () => {
      it('recalculates score with passed-in accountCreatedAt', async () => {
        repository.findByUserId.mockResolvedValue({
          ...mockProfile,
          approvedPacksCount: 2,
        });
        const updatedProfile = {
          ...mockProfile,
          approvedPacksCount: 2,
          trustScore: 40,
          tier: 'VERIFIED' as const,
        };
        repository.update.mockResolvedValue(updatedProfile);

        const accountCreatedAt = new Date(); // 0 days
        const result = await service.recalculateScore(userId, accountCreatedAt);

        expect(result).toEqual(updatedProfile);
        expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
        expect(repository.update).toHaveBeenCalledWith(userId, {
          trustScore: 40,
          tier: 'VERIFIED',
          lastEvaluatedAt: expect.any(Date),
        });
      });

      it('fetches user.createdAt from database when not provided', async () => {
        repository.findByUserId.mockResolvedValue({
          ...mockProfile,
          approvedPacksCount: 5,
        });
        prisma.user.findUniqueOrThrow.mockResolvedValue({
          createdAt: new Date(),
        });
        const updatedProfile = {
          ...mockProfile,
          approvedPacksCount: 5,
          trustScore: 85,
          tier: 'TRUSTED' as const,
        };
        repository.update.mockResolvedValue(updatedProfile);

        const result = await service.recalculateScore(userId);

        expect(result).toEqual(updatedProfile);
        expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
          where: { id: userId },
          select: { createdAt: true },
        });
        expect(repository.update).toHaveBeenCalledWith(userId, {
          trustScore: 85,
          tier: 'TRUSTED',
          lastEvaluatedAt: expect.any(Date),
        });
      });
    });

    describe('onPackApproved', () => {
      it('increments approvedPacksCount, recalculates score & tier, and persists changes', async () => {
        repository.findByUserId.mockResolvedValue({
          ...mockProfile,
          approvedPacksCount: 1, // Will become 2
        });
        prisma.user.findUniqueOrThrow.mockResolvedValue({
          createdAt: new Date(), // 0 days -> base 10 + 2*15 = 40 -> VERIFIED
        });
        const expectedUpdated: AuthorTrustProfile = {
          ...mockProfile,
          approvedPacksCount: 2,
          trustScore: 40,
          tier: 'VERIFIED',
          lastEvaluatedAt: new Date(),
        };
        repository.update.mockResolvedValue(expectedUpdated);

        const result = await service.onPackApproved(userId);

        expect(result).toEqual(expectedUpdated);
        expect(repository.update).toHaveBeenCalledWith(userId, {
          approvedPacksCount: 2,
          trustScore: 40,
          tier: 'VERIFIED',
          lastEvaluatedAt: expect.any(Date),
        });
      });
    });

    describe('onPackRejected', () => {
      it('increments rejectedPacksCount, recalculates score & tier, and persists changes', async () => {
        repository.findByUserId.mockResolvedValue({
          ...mockProfile,
          approvedPacksCount: 2, // 10 + 30 = 40
          rejectedPacksCount: 0, // Will become 1 (-30) -> score 10 -> NOVICE
        });
        prisma.user.findUniqueOrThrow.mockResolvedValue({
          createdAt: new Date(),
        });
        const expectedUpdated: AuthorTrustProfile = {
          ...mockProfile,
          approvedPacksCount: 2,
          rejectedPacksCount: 1,
          trustScore: 10,
          tier: 'NOVICE',
          lastEvaluatedAt: new Date(),
        };
        repository.update.mockResolvedValue(expectedUpdated);

        const result = await service.onPackRejected(userId);

        expect(result).toEqual(expectedUpdated);
        expect(repository.update).toHaveBeenCalledWith(userId, {
          rejectedPacksCount: 1,
          trustScore: 10,
          tier: 'NOVICE',
          lastEvaluatedAt: expect.any(Date),
        });
      });
    });

    describe('onReportUpheld', () => {
      it('increments upheldReportsCount, recalculates score & tier, and persists changes', async () => {
        repository.findByUserId.mockResolvedValue({
          ...mockProfile,
          approvedPacksCount: 2, // 10 + 30 = 40
          upheldReportsCount: 0, // Will become 1 (-20) -> score 20 -> NOVICE
        });
        prisma.user.findUniqueOrThrow.mockResolvedValue({
          createdAt: new Date(),
        });
        const expectedUpdated: AuthorTrustProfile = {
          ...mockProfile,
          approvedPacksCount: 2,
          upheldReportsCount: 1,
          trustScore: 20,
          tier: 'NOVICE',
          lastEvaluatedAt: new Date(),
        };
        repository.update.mockResolvedValue(expectedUpdated);

        const result = await service.onReportUpheld(userId);

        expect(result).toEqual(expectedUpdated);
        expect(repository.update).toHaveBeenCalledWith(userId, {
          upheldReportsCount: 1,
          trustScore: 20,
          tier: 'NOVICE',
          lastEvaluatedAt: expect.any(Date),
        });
      });
    });
  });
});
