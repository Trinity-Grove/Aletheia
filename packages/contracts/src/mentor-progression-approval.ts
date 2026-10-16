import { z } from 'zod';
import { progressionEvaluationResponseSchema } from './progression-evaluation.js';

export const mentorPendingProgressionApprovalSchema = z.object({
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  evaluation: progressionEvaluationResponseSchema.extend({ state: z.literal('AWAITING_APPROVAL') }).strict(),
}).strict();
export const mentorProgressionApprovalInboxSchema = z.array(mentorPendingProgressionApprovalSchema);
export type MentorPendingProgressionApprovalDto = z.infer<typeof mentorPendingProgressionApprovalSchema>;
export type MentorProgressionApprovalInboxDto = z.infer<typeof mentorProgressionApprovalInboxSchema>;
