import { z } from 'zod';

// --- Learning Block & Pedagogical Guide Schemas ---
export const pedagogicalGuideSchema = z.object({
  primaryMethod: z.string().min(1),
  recommendedPacing: z.string().min(1),
  parentInstructions: z.string().min(1),
  suggestedResources: z.array(z.string()).default([]),
});

export type PedagogicalGuideDto = z.infer<typeof pedagogicalGuideSchema>;

export const learningBlockSchema = z.object({
  blockIndex: z.number().int().min(1),
  title: z.string().min(1),
  pedagogicalGuide: pedagogicalGuideSchema,
  objectives: z.array(z.string()).default([]),
});

export type LearningBlockDto = z.infer<typeof learningBlockSchema>;

// --- Routine Generator Schemas ---
export const suggestRoutineInputSchema = z.object({
  learnerId: z.string().uuid().optional(),
  pedagogicalModelCode: z.string().default('CHARLOTTE_MASON'),
  startHour: z.string().default('08:30'),
  lessonDurationMinutes: z.number().int().min(15).max(60).default(25),
  includeDevotional: z.boolean().default(true),
  fridaysForProjects: z.boolean().default(true),
});

export type SuggestRoutineInputDto = z.input<typeof suggestRoutineInputSchema>;
export type SuggestRoutineOutputDto = z.output<typeof suggestRoutineInputSchema>;

export const routineSlotTypeSchema = z.enum([
  'INSTRUCTION',
  'DEVOTIONAL',
  'OUTDOOR_HABIT',
  'PROJECT_TRADES',
]);

export type RoutineSlotType = z.infer<typeof routineSlotTypeSchema>;

export const suggestedRoutineSlotSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
  subjectName: z.string(),
  subjectColor: z.string(),
  slotType: routineSlotTypeSchema,
  notes: z.string().optional(),
});

export type SuggestedRoutineSlotDto = z.infer<typeof suggestedRoutineSlotSchema>;

export const suggestedRoutineResponseSchema = z.object({
  slots: z.array(suggestedRoutineSlotSchema),
  pedagogicalRationale: z.string(),
  totalInstructionalHoursWeekly: z.number(),
});

export type SuggestedRoutineResponseDto = z.infer<typeof suggestedRoutineResponseSchema>;

export const applySuggestedRoutineSchema = z.object({
  learnerId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  replaceExisting: z.boolean().default(true),
  slots: z.array(suggestedRoutineSlotSchema),
});

export type ApplySuggestedRoutineDto = z.input<typeof applySuggestedRoutineSchema>;
export type ApplySuggestedRoutineOutput = z.output<typeof applySuggestedRoutineSchema>;
