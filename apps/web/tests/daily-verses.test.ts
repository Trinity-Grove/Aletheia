import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DAILY_VERSES,
  getDailyCanonicalVerse,
  getDayOfYear,
} from '../src/lib/scripture/daily-verses';

describe('daily-verses (Canonical Verse of the Day)', () => {
  it('contains a rich collection of biblically sound, classical verses', () => {
    expect(CANONICAL_DAILY_VERSES.length).toBeGreaterThanOrEqual(30);
    for (const item of CANONICAL_DAILY_VERSES) {
      expect(item.verseText).toBeTruthy();
      expect(item.citation).toBeTruthy();
      expect(item.verseText.length).toBeGreaterThan(10);
    }
  });

  it('calculates the day of year deterministically', () => {
    expect(getDayOfYear('2026-01-01')).toBe(0);
    expect(getDayOfYear('2026-01-02')).toBe(1);
    expect(getDayOfYear('2026-12-31')).toBeGreaterThanOrEqual(364);
  });

  it('returns a consistent verse for a given date', () => {
    const verse1 = getDailyCanonicalVerse('2026-09-16');
    const verse2 = getDailyCanonicalVerse('2026-09-16');
    expect(verse1.verseText).toBe(verse2.verseText);
    expect(verse1.citation).toBe(verse2.citation);
  });

  it('returns different verses for different dates in the cycle', () => {
    const day1 = getDailyCanonicalVerse('2026-01-01');
    const day2 = getDailyCanonicalVerse('2026-01-02');
    expect(day1.verseText).not.toBe(day2.verseText);
  });

  it('handles empty or current date gracefully', () => {
    const verse = getDailyCanonicalVerse();
    expect(verse.verseText).toBeDefined();
    expect(verse.citation).toBeDefined();
  });
});
