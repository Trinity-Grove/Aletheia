import { BadRequestException } from '@nestjs/common';
import type { LearnerCompetencyApprovalRepository } from '../infrastructure/learner-competency-approval.repository.js';
import { LearnerCompetencyApprovalService } from './learner-competency-approval.service.js';

describe('LearnerCompetencyApprovalService', () => {
  const valid = { idempotencyKey: '00000000-0000-4000-8000-000000000001', decision: 'APPROVED' as const };

  it('validates decisions before delegating to the trusted persistence boundary', async () => {
    const recordDecision = jest.fn().mockResolvedValue({ id: 'event' });
    const service = new LearnerCompetencyApprovalService({ recordDecision } as unknown as LearnerCompetencyApprovalRepository);
    await expect(service.record('family', 'tracking', 'actor', valid)).resolves.toEqual({ id: 'event' });
    expect(recordDecision).toHaveBeenCalledWith('family', 'tracking', 'actor', valid);
  });

  it('rejects a return without a reason before persistence', async () => {
    const recordDecision = jest.fn();
    const service = new LearnerCompetencyApprovalService({ recordDecision } as unknown as LearnerCompetencyApprovalRepository);
    expect(() => service.record('family', 'tracking', 'actor', { ...valid, decision: 'RETURNED' })).toThrow(BadRequestException);
    expect(recordDecision).not.toHaveBeenCalled();
  });
});
