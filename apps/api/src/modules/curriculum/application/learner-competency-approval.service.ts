import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { learnerCompetencyApprovalDecisionSchema, type LearnerCompetencyApprovalDecisionDto } from '@aletheia/contracts';
import { LearnerCompetencyApprovalRepository } from '../infrastructure/learner-competency-approval.repository.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../../families/application/public-api.js';
import { MENTOR_GRANT_PUBLIC_API, type MentorGrantPublicApi } from '../../mentors/application/public-api.js';

@Injectable()
export class LearnerCompetencyApprovalService {
  constructor(
    private readonly repository: LearnerCompetencyApprovalRepository,
    @Inject(FAMILY_PUBLIC_API) private readonly familyApi: FamilyPublicApi,
    @Inject(MENTOR_GRANT_PUBLIC_API) private readonly mentorApi: MentorGrantPublicApi,
  ) {}

  record(familyId: string, trackingId: string, trustedActorUserId: string, input: LearnerCompetencyApprovalDecisionDto) {
    const parsed = learnerCompetencyApprovalDecisionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid competency approval decision');
    if (!familyId || !trackingId || !trustedActorUserId) throw new BadRequestException('Approval decision scope is required');
    return this.repository.recordDecision(familyId, trackingId, trustedActorUserId, parsed.data);
  }

  async recordForFamily(familyId: string, trackingId: string, actorUserId: string, input: LearnerCompetencyApprovalDecisionDto) {
    const role = await this.familyApi.getFamilyMemberRole(actorUserId, familyId);
    if (!(['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'] as string[]).includes(role ?? '')) {
      throw new ForbiddenException('Only a family guardian may decide competency approval.');
    }
    return this.record(familyId, trackingId, actorUserId, input);
  }

  async recordForMentor(trackingId: string, actorUserId: string, input: LearnerCompetencyApprovalDecisionDto) {
    const scope = await this.repository.findApprovalTrackingScope(trackingId);
    if (!scope || !await this.mentorApi.canMentorApproveProgression(actorUserId, scope.familyId, scope.learnerId)) {
      throw new NotFoundException('Approval scope not found');
    }
    const parsed = learnerCompetencyApprovalDecisionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid competency approval decision');
    return this.repository.recordDecision(scope.familyId, trackingId, actorUserId, parsed.data, actorUserId);
  }
}
