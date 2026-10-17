import { describe, expect, it } from 'vitest';
import { learnerCompetencyApprovalDecisionSchema } from './learner-competency-approval.js';

describe('learner competency approval decision', () => {
  const idempotencyKey = '00000000-0000-4000-8000-000000000001';

  it('accepts a scoped decision payload', () => {
    expect(learnerCompetencyApprovalDecisionSchema.parse({ idempotencyKey, decision: 'APPROVED' })).toEqual({ idempotencyKey, decision: 'APPROVED' });
  });

  it('requires a non-empty reason when returning a progression request', () => {
    expect(learnerCompetencyApprovalDecisionSchema.safeParse({ idempotencyKey, decision: 'RETURNED' }).success).toBe(false);
    expect(learnerCompetencyApprovalDecisionSchema.safeParse({ idempotencyKey, decision: 'RETURNED', reason: '  ' }).success).toBe(false);
    expect(learnerCompetencyApprovalDecisionSchema.parse({ idempotencyKey, decision: 'RETURNED', reason: 'Add a new example' }).reason).toBe('Add a new example');
  });
});
