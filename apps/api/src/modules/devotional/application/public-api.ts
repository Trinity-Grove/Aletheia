import type { BiblePassageDto, BibleVersionDto } from '@aletheia/contracts';

export const DEVOTIONAL_PUBLIC_API = Symbol('DEVOTIONAL_PUBLIC_API');

export interface DevotionalPublicApi {
  getTodayDevotionalSummary(
    familyId: string,
  ): Promise<{ hasDevotional: boolean; bibleReference?: string; memoryVerse?: string }>;
  getActivePrayerCount(familyId: string): Promise<number>;
  // Exposed for issue #96 Fase 3 section 16 (BibleTranslationDefinition):
  // lets the curriculum module seed/prove equivalence against the same
  // YouVersion-backed catalog this module already uses, and lets a
  // read-only compare endpoint fetch live passage text without the
  // curriculum module reaching into devotional's infrastructure
  // directly (module-boundary rule -- cross-module access only through
  // this public API).
  getAvailableBibles(): Promise<BibleVersionDto[]>;
  lookupScripture(reference: string, versionId?: string): Promise<BiblePassageDto | null>;
}
