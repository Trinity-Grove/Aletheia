import { z } from 'zod';
import { gradingScaleSchema } from './report.js';

export const updateFamilySettingsSchema = z.object({
  homeschoolName: z.string().min(1).max(200).nullish(),
  defaultGradingScale: gradingScaleSchema.optional(),
  timezone: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(20).optional(),
  devotionalReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'time must be in HH:mm format')
    .nullish(),
  dailyScheduleReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'time must be in HH:mm format')
    .nullish(),
  attendanceReminderEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
});

export type UpdateFamilySettingsDto = z.infer<typeof updateFamilySettingsSchema>;

export const familySettingsResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  homeschoolName: z.string().nullable().optional(),
  defaultGradingScale: gradingScaleSchema,
  timezone: z.string(),
  language: z.string(),
  devotionalReminderTime: z.string().nullable().optional(),
  dailyScheduleReminderTime: z.string().nullable().optional(),
  attendanceReminderEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  inAppNotificationsEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FamilySettingsResponseDto = z.infer<typeof familySettingsResponseSchema>;
