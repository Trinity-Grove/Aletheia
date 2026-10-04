import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { AiUsageQuotaResponseDto } from '@aletheia/contracts';
import { AiFamilyUsageRepository } from '../infrastructure/ai-family-usage.repository.js';

@Injectable()
export class AiQuotaService {
  constructor(private readonly usageRepository: AiFamilyUsageRepository) {}

  getCurrentPeriod(date: Date = new Date()): string {
    return date.toISOString().slice(0, 7);
  }

  getNextResetDate(date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const nextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
    return nextMonth.toISOString();
  }

  async verifyQuota(familyId: string): Promise<void> {
    const period = this.getCurrentPeriod();
    const usage = await this.usageRepository.findOrCreate(familyId, period);

    if (usage.tokensUsed >= usage.tokensLimit || usage.requestsUsed >= usage.requestsLimit) {
      throw new HttpException(
        'Monthly AI token quota exceeded for this family',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordUsage(familyId: string, tokens: number, requests = 1): Promise<void> {
    const period = this.getCurrentPeriod();
    await this.usageRepository.incrementUsage(familyId, period, tokens, requests);
  }

  async getFamilyQuota(familyId: string): Promise<AiUsageQuotaResponseDto> {
    const period = this.getCurrentPeriod();
    const usage = await this.usageRepository.findOrCreate(familyId, period);

    return {
      familyId,
      period: usage.period,
      tokensUsed: usage.tokensUsed,
      tokensLimit: usage.tokensLimit,
      requestsUsed: usage.requestsUsed,
      requestsLimit: usage.requestsLimit,
      resetAt: this.getNextResetDate(),
    };
  }
}
