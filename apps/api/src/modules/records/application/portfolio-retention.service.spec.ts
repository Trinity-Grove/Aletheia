import { PORTFOLIO_RETENTION_DAYS, PortfolioRetentionService } from './portfolio-retention.service.js';

describe('PortfolioRetentionService', () => {
  let service: PortfolioRetentionService;
  let portfolioRepo: any;

  beforeEach(() => {
    portfolioRepo = {
      purgeSoftDeletedBefore: jest.fn().mockResolvedValue(3),
    };
    service = new PortfolioRetentionService(portfolioRepo);
  });

  it('purges rows soft-deleted before the retention cutoff', async () => {
    const before = Date.now();
    const purged = await service.purgeExpiredSoftDeletes();
    const after = Date.now();

    expect(purged).toBe(3);
    expect(portfolioRepo.purgeSoftDeletedBefore).toHaveBeenCalledTimes(1);

    const cutoff: Date = portfolioRepo.purgeSoftDeletedBefore.mock.calls[0][0];
    const expectedMs = PORTFOLIO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    expect(before - cutoff.getTime()).toBeGreaterThanOrEqual(expectedMs - 1000);
    expect(after - cutoff.getTime()).toBeLessThanOrEqual(expectedMs + 1000);
  });

  it('returns 0 without logging when nothing is expired', async () => {
    portfolioRepo.purgeSoftDeletedBefore.mockResolvedValue(0);
    const purged = await service.purgeExpiredSoftDeletes();
    expect(purged).toBe(0);
  });
});
