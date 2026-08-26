import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'DEVOTIONAL_REMINDER',
  'DAILY_SCHEDULE_REMINDER',
  'ATTENDANCE_MISSING_REMINDER',
  'PRAYER_ANSWERED_ALERT',
  'SYSTEM_NOTICE',
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  linkUrl: z.string().nullish(),
  metadata: z.record(z.string(), z.any()).nullish(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

export const notificationItemResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  linkUrl: z.string().nullable().optional(),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NotificationItemResponseDto = z.infer<typeof notificationItemResponseSchema>;

export const notificationFilterSchema = z.object({
  isRead: z.boolean().optional(),
  type: notificationTypeSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type NotificationFilterDto = z.infer<typeof notificationFilterSchema>;

export const markNotificationReadSchema = z.object({
  isRead: z.boolean().default(true),
});

export type MarkNotificationReadDto = z.infer<typeof markNotificationReadSchema>;
