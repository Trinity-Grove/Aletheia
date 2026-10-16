import { BadRequestException, Injectable } from '@nestjs/common';
import { learnerCompetencyApprovalDecisionSchema, type LearnerCompetencyApprovalDecisionDto } from '@aletheia/contracts';
import { LearnerCompetencyApprovalRepository } from '../infrastructure/learner-competency-approval.repository.js';

@Injectable()
export class LearnerCompetencyApprovalService {
  constructor(private readonly repository: LearnerCompetencyApprovalRepository) {}

  record(familyId: string, trackingId: string, trustedActorUserId: string, input: LearnerCompetencyApprovalDecisionDto) {
    const parsed = learnerCompetencyApprovalDecisionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid competency approval decision');
    if (!familyId || !trackingId || !trustedActorUserId) throw new BadRequestException('Approval decision scope is required');
    return this.repository.recordDecision(familyId, trackingId, trustedActorUserId, parsed.data);
  }
}
