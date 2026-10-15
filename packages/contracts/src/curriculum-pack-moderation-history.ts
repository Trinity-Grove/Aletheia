import { z } from 'zod';
import { curriculumPackModerationStatusSchema } from './curriculum-pack-moderation.js';

export const CURRICULUM_PACK_MODERATION_HISTORY_EVENTS = [
  'CREATED',
  'EDITED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'RESTORED',
  'ARCHIVED',
] as const;

export const curriculumPackModerationHistoryEventSchema = z.enum(
  CURRICULUM_PACK_MODERATION_HISTORY_EVENTS,
);
export type CurriculumPackModerationHistoryEvent = z.infer<
  typeof curriculumPackModerationHistoryEventSchema
>;

export const curriculumPackModerationHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  event: curriculumPackModerationHistoryEventSchema,
  moderationStatus: curriculumPackModerationStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type CurriculumPackModerationHistoryResponseDto = z.infer<
  typeof curriculumPackModerationHistoryResponseSchema
>;
