import { z } from 'zod';

export const learnerCompetencyApprovalDecisionSchema = z.object({
  idempotencyKey: z.string().uuid(),
  decision: z.enum(['APPROVED', 'RETURNED']),
  reason: z.string().trim().min(1).max(2000).optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === 'RETURNED' && !value.reason) {
    context.addIssue({ code: 'custom', path: ['reason'], message: 'A reason is required when returning progression for more work' });
  }
});

export type LearnerCompetencyApprovalDecisionDto = z.infer<typeof learnerCompetencyApprovalDecisionSchema>;
