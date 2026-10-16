import { Inject, Injectable } from '@nestjs/common';
import type { LearnerCompetencyApprovalDecisionDto, MentorProgressionApprovalInboxDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { MENTOR_GRANT_PUBLIC_API, type MentorGrantPublicApi } from '../../mentors/application/public-api.js';
import { ProgressionService } from './progression.service.js';
import { LearnerCompetencyApprovalService } from './learner-competency-approval.service.js';

@Injectable()
export class MentorProgressionApprovalService {
  constructor(
    @Inject(MENTOR_GRANT_PUBLIC_API) private readonly mentorApi: MentorGrantPublicApi,
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly approvals: LearnerCompetencyApprovalService,
  ) {}

  async listPending(actorUserId: string): Promise<MentorProgressionApprovalInboxDto> {
    const scopes = await this.mentorApi.listProgressionApprovalScopes(actorUserId);
    if (!scopes.length) return [];
    const trackings = await this.prisma.learnerCompetencyTracking.findMany({
      where: { status: 'ACTIVE', progressionPolicyId: { not: null }, OR: scopes.map(({ familyId, learnerId }) => ({ familyId, learnerId })) },
      select: { id: true, familyId: true, learnerId: true, progressionPolicyId: true },
      orderBy: { activatedAt: 'desc' },
    });
    const evaluations = await Promise.allSettled(trackings.map(async (tracking) => ({
      familyId: tracking.familyId,
      learnerId: tracking.learnerId,
      evaluation: await this.progression.evaluate(tracking.familyId, { trackingId: tracking.id, policyId: tracking.progressionPolicyId! }),
    })));
    return evaluations.flatMap((result) => result.status === 'fulfilled' && result.value.evaluation.state === 'AWAITING_APPROVAL' ? [result.value] : []);
  }

  decide(actorUserId: string, trackingId: string, input: LearnerCompetencyApprovalDecisionDto) {
    return this.approvals.recordForMentor(trackingId, actorUserId, input);
  }
}
