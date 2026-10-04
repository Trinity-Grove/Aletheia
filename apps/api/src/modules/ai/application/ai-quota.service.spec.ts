import { HttpException, HttpStatus } from '@nestjs/common';
import { AiQuotaService } from './ai-quota.service.js';
import type { AiFamilyUsageRepository } from '../infrastructure/ai-family-usage.repository.js';
import type { AiFamilyUsage } from '@prisma/client';
import { aiUsageQuotaResponseSchema } from '@aletheia/contracts';

describe('AiQuotaService', () => {
  let quotaService: AiQuotaService;
  let usageRepo: jest.Mocked<AiFamilyUsageRepository>;

  const familyId = '44444444-4444-4444-a444-444444444444';
  const currentPeriod = new Date().toISOString().slice(0, 7);

  const mockUsage: AiFamilyUsage = {
    id: 'usage-1',
    familyId,
    period: currentPeriod,
    tokensUsed: 1000,
    tokensLimit: 100000,
    requestsUsed: 5,
    requestsLimit: 200,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    usageRepo = {
      findOrCreate: jest.fn().mockResolvedValue({ ...mockUsage }),
      incrementUsage: jest.fn().mockResolvedValue({ ...mockUsage }),
    } as unknown as jest.Mocked<AiFamilyUsageRepository>;

    quotaService = new AiQuotaService(usageRepo);
  });

  describe('verifyQuota', () => {
    it('should allow execution when usage is within token and request limits', async () => {
      usageRepo.findOrCreate.mockResolvedValueOnce({
        ...mockUsage,
        tokensUsed: 50000,
        tokensLimit: 100000,
        requestsUsed: 100,
        requestsLimit: 200,
      });

      await expect(quotaService.verifyQuota(familyId)).resolves.toBeUndefined();
      expect(usageRepo.findOrCreate).toHaveBeenCalledWith(familyId, currentPeriod);
    });

    it('should throw TOO_MANY_REQUESTS when tokensUsed reaches tokensLimit', async () => {
      usageRepo.findOrCreate.mockResolvedValueOnce({
        ...mockUsage,
        tokensUsed: 100000,
        tokensLimit: 100000,
      });

      await expect(quotaService.verifyQuota(familyId)).rejects.toThrow(
        new HttpException('Monthly AI token quota exceeded for this family', HttpStatus.TOO_MANY_REQUESTS),
      );
    });

    it('should throw TOO_MANY_REQUESTS when tokensUsed exceeds tokensLimit', async () => {
      usageRepo.findOrCreate.mockResolvedValueOnce({
        ...mockUsage,
        tokensUsed: 105000,
        tokensLimit: 100000,
      });

      await expect(quotaService.verifyQuota(familyId)).rejects.toThrow(
        new HttpException('Monthly AI token quota exceeded for this family', HttpStatus.TOO_MANY_REQUESTS),
      );
    });

    it('should throw TOO_MANY_REQUESTS when requestsUsed reaches requestsLimit', async () => {
      usageRepo.findOrCreate.mockResolvedValueOnce({
        ...mockUsage,
        requestsUsed: 200,
        requestsLimit: 200,
      });

      await expect(quotaService.verifyQuota(familyId)).rejects.toThrow(
        new HttpException('Monthly AI token quota exceeded for this family', HttpStatus.TOO_MANY_REQUESTS),
      );
    });
  });

  describe('recordUsage', () => {
    it('should increment tokens and requests with default requests = 1', async () => {
      await quotaService.recordUsage(familyId, 350);

      expect(usageRepo.incrementUsage).toHaveBeenCalledWith(
        familyId,
        currentPeriod,
        350,
        1,
      );
    });

    it('should increment tokens and explicit request count', async () => {
      await quotaService.recordUsage(familyId, 500, 2);

      expect(usageRepo.incrementUsage).toHaveBeenCalledWith(
        familyId,
        currentPeriod,
        500,
        2,
      );
    });
  });

  describe('getFamilyQuota', () => {
    it('should return quota status conforming to aiUsageQuotaResponseSchema with next month reset date', async () => {
      usageRepo.findOrCreate.mockResolvedValueOnce({
        ...mockUsage,
        tokensUsed: 12500,
        requestsUsed: 42,
      });

      const quota = await quotaService.getFamilyQuota(familyId);

      expect(quota).toMatchObject({
        familyId,
        period: currentPeriod,
        tokensUsed: 12500,
        tokensLimit: 100000,
        requestsUsed: 42,
        requestsLimit: 200,
      });

      expect(quota.resetAt).toMatch(/^\d{4}-\d{2}-01T00:00:00(\.000)?Z$/);
      const parsed = aiUsageQuotaResponseSchema.safeParse(quota);
      expect(parsed.success).toBe(true);
    });
  });
});
