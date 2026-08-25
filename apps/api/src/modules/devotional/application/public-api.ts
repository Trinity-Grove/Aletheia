export const DEVOTIONAL_PUBLIC_API = Symbol('DEVOTIONAL_PUBLIC_API');

export interface DevotionalPublicApi {
  getTodayDevotionalSummary(
    familyId: string,
  ): Promise<{ hasDevotional: boolean; bibleReference?: string; memoryVerse?: string }>;
  getActivePrayerCount(familyId: string): Promise<number>;
}
