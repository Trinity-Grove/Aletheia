import { describe, expect, it } from 'vitest';
import {
  biblePassageSchema,
  bibleVersionSchema,
  dailyDevotionalResponseSchema,
  upsertDailyDevotionalSchema,
  type BiblePassageDto,
  type BibleVersionDto,
  type DailyDevotionalResponseDto,
  type UpsertDailyDevotionalDto,
} from './devotional.js';

describe('devotional contracts', () => {
  describe('bibleVersionSchema', () => {
    it('validates a valid bible version', () => {
      const version: BibleVersionDto = {
        id: 'eng_kjv',
        name: 'King James Version',
        language: 'eng',
        abbreviation: 'KJV',
      };

      const result = bibleVersionSchema.safeParse(version);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      expect(bibleVersionSchema.safeParse({ id: 'eng_kjv' }).success).toBe(false);
    });
  });

  describe('biblePassageSchema', () => {
    it('validates a valid bible passage with optional copyright', () => {
      const passage: BiblePassageDto = {
        reference: 'John 1:1-5',
        versionId: 'eng_kjv',
        content: 'In the beginning was the Word...',
        copyright: 'Public Domain',
      };

      expect(biblePassageSchema.safeParse(passage).success).toBe(true);
    });

    it('validates a valid bible passage without copyright', () => {
      const passage: BiblePassageDto = {
        reference: 'John 1:1',
        versionId: 'eng_kjv',
        content: 'In the beginning was the Word.',
      };

      expect(biblePassageSchema.safeParse(passage).success).toBe(true);
    });
  });

  describe('upsertDailyDevotionalSchema', () => {
    it('validates valid daily devotional input', () => {
      const payload: UpsertDailyDevotionalDto = {
        date: '2026-08-24',
        bibleReference: 'Psalm 23:1-6',
        bibleVersionId: 'eng_kjv',
        passageText: 'The Lord is my shepherd; I shall not want.',
        reflection: 'David reflects on the goodness and guidance of God.',
        memoryVerse: 'Psalm 23:1',
        hymnOrSong: 'The King of Love My Shepherd Is',
        discussionQuestions: ['How is the Lord like a shepherd?', 'What does goodness and mercy mean to you?'],
        practicalApplication: 'Take 5 minutes today to thank God for His guidance.',
      };

      const result = upsertDailyDevotionalSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('accepts discussionQuestions as a single string', () => {
      const payload: UpsertDailyDevotionalDto = {
        date: '2026-08-24',
        bibleReference: 'Psalm 23',
        discussionQuestions: 'What did we learn today?',
      };

      expect(upsertDailyDevotionalSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects invalid date formats', () => {
      const payload = {
        date: '24-08-2026',
        bibleReference: 'Psalm 23',
      };

      expect(upsertDailyDevotionalSchema.safeParse(payload).success).toBe(false);
    });

    it('rejects empty bibleReference or exceeding max length', () => {
      expect(
        upsertDailyDevotionalSchema.safeParse({
          date: '2026-08-24',
          bibleReference: '',
        }).success,
      ).toBe(false);

      expect(
        upsertDailyDevotionalSchema.safeParse({
          date: '2026-08-24',
          bibleReference: 'a'.repeat(201),
        }).success,
      ).toBe(false);
    });
  });

  describe('dailyDevotionalResponseSchema', () => {
    it('validates full daily devotional response DTO', () => {
      const response: DailyDevotionalResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        familyId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2026-08-24',
        bibleReference: 'Psalm 23:1-6',
        bibleVersionId: 'eng_kjv',
        passageText: 'The Lord is my shepherd...',
        reflection: 'God leads and restores us.',
        memoryVerse: 'Psalm 23:1',
        hymnOrSong: 'The King of Love My Shepherd Is',
        discussionQuestions: 'How does God lead us?',
        practicalApplication: 'Pray together as a family.',
        createdAt: '2026-08-24T12:00:00.000Z',
        updatedAt: '2026-08-24T12:00:00.000Z',
      };

      expect(dailyDevotionalResponseSchema.safeParse(response).success).toBe(true);
    });
  });
});
