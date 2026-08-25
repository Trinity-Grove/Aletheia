import { z } from 'zod';

export const bibleVersionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  language: z.string().min(1),
  abbreviation: z.string().min(1),
});

export type BibleVersionDto = z.infer<typeof bibleVersionSchema>;

export const biblePassageSchema = z.object({
  reference: z.string().min(1),
  versionId: z.string().min(1),
  content: z.string().min(1),
  copyright: z.string().optional(),
});

export type BiblePassageDto = z.infer<typeof biblePassageSchema>;

export const upsertDailyDevotionalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  bibleReference: z.string().min(1).max(200),
  bibleVersionId: z.string().optional(),
  passageText: z.string().optional(),
  reflection: z.string().optional(),
  memoryVerse: z.string().optional(),
  hymnOrSong: z.string().optional(),
  discussionQuestions: z.union([z.string(), z.array(z.string())]).optional(),
  practicalApplication: z.string().optional(),
});

export type UpsertDailyDevotionalDto = z.infer<typeof upsertDailyDevotionalSchema>;

export const dailyDevotionalResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  date: z.string(),
  bibleReference: z.string().min(1).max(200),
  bibleVersionId: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  reflection: z.string().nullable().optional(),
  memoryVerse: z.string().nullable().optional(),
  hymnOrSong: z.string().nullable().optional(),
  discussionQuestions: z.string().nullable().optional(),
  practicalApplication: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DailyDevotionalResponseDto = z.infer<typeof dailyDevotionalResponseSchema>;
