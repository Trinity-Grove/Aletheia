import { z } from 'zod';
import { lessonPlanResponseSchema, lessonStatusSchema } from './lesson.js';

export const dayOfWeekSchema = z.number().int().min(1).max(7);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

export const createScheduleSlotSchema = z.object({
  academicYearId: z.string().uuid().nullish(),
  subjectId: z.string().uuid().nullish(),
  learnerId: z.string().uuid().nullish(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM format'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:MM format'),
  title: z.string().min(1).max(100),
  description: z.string().nullish(),
  location: z.string().nullish(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color')
    .nullish(),
});

export type CreateScheduleSlotDto = z.input<typeof createScheduleSlotSchema>;
export type CreateScheduleSlotOutput = z.output<typeof createScheduleSlotSchema>;

export const updateScheduleSlotSchema = createScheduleSlotSchema.partial();
export type UpdateScheduleSlotDto = z.infer<typeof updateScheduleSlotSchema>;

export const scheduleSlotResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  academicYearId: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  learnerId: z.string().nullable().optional(),
  learnerName: z.string().nullable().optional(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string(),
  endTime: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ScheduleSlotResponseDto = z.infer<typeof scheduleSlotResponseSchema>;

export const dailyAgendaItemSchema = z.object({
  type: z.enum(['LESSON', 'ROUTINE_SLOT']),
  id: z.string().uuid(),
  title: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  subjectColor: z.string().nullable().optional(),
  status: lessonStatusSchema.optional(),
  learnerIds: z.array(z.string().uuid()).default([]),
  isCompleted: z.boolean().default(false),
  lessonPlan: lessonPlanResponseSchema.optional(),
  scheduleSlot: scheduleSlotResponseSchema.optional(),
});

export type DailyAgendaItemDto = z.infer<typeof dailyAgendaItemSchema>;

export const dailyAgendaSchema = z.object({
  date: z.string(),
  dayOfWeek: dayOfWeekSchema,
  items: z.array(dailyAgendaItemSchema),
});

export type DailyAgendaDto = z.infer<typeof dailyAgendaSchema>;
