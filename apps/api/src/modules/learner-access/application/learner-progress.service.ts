import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type {
  EvidenceSubmissionResponseDto,
  LearnerCompetencyTrackingResponseDto,
  LearnerSubmitEvidenceOutput,
} from '@aletheia/contracts';
import {
  EVIDENCE_SUBMISSION_PUBLIC_API,
  LEARNER_COMPETENCY_TRACKING_PUBLIC_API,
  type EvidenceSubmissionPublicApi,
  type LearnerCompetencyTrackingPublicApi,
} from '../../curriculum/application/public-api.js';
import { LearnerAccessGrantRepository } from '../infrastructure/learner-access-grant.repository.js';

// Learner-facing evidence submission + progress view (issue #34): the two
// pieces the survey pass found missing on top of the existing grant/
// session/agenda backbone. Both methods are only ever reached through
// routes already gated by LearnerAccessGuard + LearnerSelfGuard, but this
// service never assumes that -- it takes learnerId/familyId exclusively
// as explicit parameters supplied by the controller from the *verified
// session*, never from a request body or query string, so there is no
// field anywhere in this path a learner could use to reach another
// learner's data (sibling included).
//
// Evidence submitted here goes through the exact same
// EvidenceSubmissionService.createEvidenceSubmission the guardian-facing
// EvidenceSubmissionController uses (same tenant check, same competency
// validation, same UNVALIDATED-by-default status) -- a learner gets no
// privileged write path, only a narrower gate in front of the identical
// one. Likewise, progress is read through the same
// LearnerCompetencyTrackingService the guardian-facing controller lists
// from, just forced to the caller's own learnerId.
@Injectable()
export class LearnerProgressService {
  constructor(
    @Inject(EVIDENCE_SUBMISSION_PUBLIC_API)
    private readonly evidenceApi: EvidenceSubmissionPublicApi,
    @Inject(LEARNER_COMPETENCY_TRACKING_PUBLIC_API)
    private readonly trackingApi: LearnerCompetencyTrackingPublicApi,
    private readonly grantRepository: LearnerAccessGrantRepository,
  ) {}

  async submitEvidence(
    familyId: string,
    learnerId: string,
    dto: LearnerSubmitEvidenceOutput,
  ): Promise<EvidenceSubmissionResponseDto> {
    const authorId = await this.resolveAuthorId(familyId, learnerId);
    // learnerId is reconstructed here, never taken from `dto` -- the
    // request body schema (learnerSubmitEvidenceSchema) has no learnerId
    // field to begin with, so this is filling in the full shape the
    // underlying family-scoped service expects, not "trusting" anything
    // client-supplied.
    return this.evidenceApi.createEvidenceSubmission(familyId, authorId, {
      ...dto,
      learnerId,
    });
  }

  async getProgress(
    familyId: string,
    learnerId: string,
    status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingResponseDto[]> {
    return this.trackingApi.listTrackedCompetencies(familyId, learnerId, status);
  }

  // EvidenceSubmission.authorId is a required FK to User, and a learner
  // session is deliberately NOT a User (see LearnerAccessGuard's own
  // comment on `request.learner` vs. `request.user`). Rather than weaken
  // that FK or invent a "system" user, evidence submitted through the
  // learner portal is attributed to the guardian who most recently
  // granted/regenerated this learner's portal access
  // (LearnerAccessGrant.createdBy) -- the guardian who authorized this
  // exact access path. This satisfies issue #34's AC "Toda evidência
  // segue autorização familiar": the submission is still UNVALIDATED by
  // default and still requires guardian review through the unchanged
  // guardian-facing validation endpoint.
  private async resolveAuthorId(familyId: string, learnerId: string): Promise<string> {
    const grant = await this.grantRepository.findByLearnerId(learnerId);
    // LearnerAccessGuard already re-verifies the grant's enabled state and
    // family on every request, so this branch should be unreachable in
    // practice -- kept anyway as defense-in-depth, matching this module's
    // existing convention of never assuming an upstream guard was run.
    if (!grant || grant.familyId !== familyId || !grant.enabled) {
      throw new ForbiddenException('Learner access is not currently enabled.');
    }
    return grant.createdBy;
  }
}
