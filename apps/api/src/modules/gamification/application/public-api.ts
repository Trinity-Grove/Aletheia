import type { LearnerGamificationSummaryDto } from '@aletheia/contracts';

export const GAMIFICATION_PUBLIC_API = Symbol('GAMIFICATION_PUBLIC_API');

export interface GamificationPublicApi {
  getSummary(familyId: string, learnerId: string): Promise<LearnerGamificationSummaryDto>;
  acknowledgeBadges(familyId: string, learnerId: string, badgeCodes?: string[]): Promise<number>;
}
