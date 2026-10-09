import { describe, expect, it } from 'vitest';
import {
  approveFeedbackSchema,
  createFeedbackSchema,
  feedbackCategorySchema,
  feedbackStatusSchema,
  listAdminFeedbackQuerySchema,
  rejectFeedbackSchema,
} from './feedback.js';

describe('feedback contracts', () => {
  describe('feedbackCategorySchema', () => {
    it('accepts the four categories and rejects anything else', () => {
      for (const c of ['BUG', 'IDEA', 'QUESTION', 'PRAISE'] as const) {
        expect(feedbackCategorySchema.safeParse(c).success).toBe(true);
      }
      expect(feedbackCategorySchema.safeParse('SUPPORT').success).toBe(false);
      expect(feedbackCategorySchema.safeParse('').success).toBe(false);
    });
  });

  describe('feedbackStatusSchema', () => {
    it('accepts PENDING, APPROVED, REJECTED', () => {
      for (const s of ['PENDING', 'APPROVED', 'REJECTED'] as const) {
        expect(feedbackStatusSchema.safeParse(s).success).toBe(true);
      }
      expect(feedbackStatusSchema.safeParse('CLOSED').success).toBe(false);
    });
  });

  describe('createFeedbackSchema', () => {
    const valid = { category: 'BUG', message: 'O botão de salvar trava às vezes.' };

    it('defaults identifySelf to false when the client omits it', () => {
      const parsed = createFeedbackSchema.parse(valid);
      expect(parsed.identifySelf).toBe(false);
    });

    it('accepts a 10-character message and a 4000-character message', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(10) }).success).toBe(true);
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(4000) }).success).toBe(true);
    });

    it('rejects a 9-character message and a 4001-character message', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(9) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(4001) }).success).toBe(false);
    });

    it('trims before measuring length, so a whitespace-only message never passes min(10)', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: ' '.repeat(40) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, message: '  problema real de Login  ' }).data!.message)
        .toBe('problema real de Login');
    });

    it('treats every technical context field as optional and independent', () => {
      const parsed = createFeedbackSchema.parse({ ...valid, pagePath: '/curriculum/packs' });
      expect(parsed.locale).toBeUndefined();
      expect(parsed.appVersion).toBeUndefined();
      expect(parsed.userAgent).toBeUndefined();
    });

    it('caps pagePath at 200, appVersion at 40 and userAgent at 400 characters', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, pagePath: '/'.repeat(201) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, appVersion: '1'.repeat(41) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, userAgent: 'x'.repeat(401) }).success).toBe(false);
    });
  });

  describe('approveFeedbackSchema', () => {
    it('defaults labels to an empty array', () => {
      expect(approveFeedbackSchema.parse({ title: 'Login trava ao salvar' }).labels).toEqual([]);
    });

    it('rejects a title under 5 or over 180 characters', () => {
      expect(approveFeedbackSchema.safeParse({ title: 'abcd' }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'a'.repeat(181) }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'abcde' }).success).toBe(true);
    });

    it('rejects more than 8 labels and labels over 50 characters', () => {
      const many = Array.from({ length: 9 }, (_, i) => `label-${i}`);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: many }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: ['x'.repeat(51)] }).success).toBe(false);
    });

    it('trims labels and rejects blank ones', () => {
      const parsed = approveFeedbackSchema.parse({ title: 'Login trava', labels: ['  bug  '] });
      expect(parsed.labels).toEqual(['bug']);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: ['   '] }).success).toBe(false);
    });
  });

  describe('rejectFeedbackSchema', () => {
    it('requires a reason of at least 5 characters', () => {
      expect(rejectFeedbackSchema.safeParse({ reason: 'abcd' }).success).toBe(false);
      expect(rejectFeedbackSchema.safeParse({}).success).toBe(false);
      expect(rejectFeedbackSchema.safeParse({ reason: 'Fora do escopo' }).success).toBe(true);
    });
  });

  describe('listAdminFeedbackQuerySchema', () => {
    it('caps take at 100 and floors skip at 0', () => {
      expect(listAdminFeedbackQuerySchema.safeParse({ take: 101 }).success).toBe(false);
      expect(listAdminFeedbackQuerySchema.safeParse({ skip: -1 }).success).toBe(false);
      expect(listAdminFeedbackQuerySchema.safeParse({ take: 100, skip: 0, status: 'PENDING' }).success).toBe(true);
    });
  });
});
