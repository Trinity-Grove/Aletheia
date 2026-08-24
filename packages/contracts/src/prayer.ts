import { z } from 'zod';

export const prayerTypeSchema = z.enum(['PETITION', 'GRATITUDE']);

export type PrayerType = z.infer<typeof prayerTypeSchema>;

export const createPrayerSchema = z.object({
  type: prayerTypeSchema.default('PETITION'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  learnerId: z.string().uuid().optional(),
});

export type CreatePrayerDto = z.infer<typeof createPrayerSchema>;

export const updatePrayerSchema = createPrayerSchema.partial();

export type UpdatePrayerDto = z.infer<typeof updatePrayerSchema>;

export const answerPrayerSchema = z.object({
  answeredNote: z.string().optional(),
});

export type AnswerPrayerDto = z.infer<typeof answerPrayerSchema>;

export const prayerResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid().nullable().optional(),
  type: prayerTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  isAnswered: z.boolean(),
  answeredAt: z.string().nullable().optional(),
  answeredNote: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PrayerResponseDto = z.infer<typeof prayerResponseSchema>;
