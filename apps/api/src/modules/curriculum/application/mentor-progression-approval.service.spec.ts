import { mentorProgressionApprovalInboxSchema, type ProgressionEvaluationResponseDto } from '@aletheia/contracts';
import { MentorProgressionApprovalService } from './mentor-progression-approval.service.js';

describe('mentor progression inbox', () => {
  const familyId = '00000000-0000-4000-8000-000000000001';
  const learnerId = '00000000-0000-4000-8000-000000000002';
  const trackingId = '00000000-0000-4000-8000-000000000003';
  const policyId = '00000000-0000-4000-8000-000000000004';
  const evaluation: ProgressionEvaluationResponseDto = {
    learnerId, trackingId, trackingStatus: 'ACTIVE', curriculumDefinitionId: null,
    competencyDefinitionId: '00000000-0000-4000-8000-000000000005', competencyVersion: 1,
    policyId, policyVersion: 1, validatedEvidenceCount: 1, minimumEvidenceCount: 1,
    requiredEvidenceCountMet: true, rubricAssessmentSatisfied: true,
    humanApprovalRequired: true, humanApprovalEligible: true, freshWorkRequired: false,
    state: 'AWAITING_APPROVAL', unmetPrerequisites: [],
  };
  function setup(scopes = [{ familyId, learnerId }]) {
    const mentorApi = { listProgressionApprovalScopes: jest.fn().mockResolvedValue(scopes) };
    const findMany = jest.fn().mockResolvedValue([
      { id: trackingId, familyId, learnerId, progressionPolicyId: policyId },
      { id: 'mastered', familyId, learnerId, progressionPolicyId: policyId },
      { id: 'invalid', familyId, learnerId, progressionPolicyId: policyId },
    ]);
    const progression = { evaluate: jest.fn(async (_family: string, query: { trackingId: string }) => {
      if (query.trackingId === 'invalid') throw new Error('Unavailable policy');
      return { ...evaluation, state: query.trackingId === trackingId ? 'AWAITING_APPROVAL' : 'MASTERED' };
    }) };
    type Dependencies = ConstructorParameters<typeof MentorProgressionApprovalService>;
    const service = new MentorProgressionApprovalService(
      mentorApi as unknown as Dependencies[0],
      { learnerCompetencyTracking: { findMany } } as unknown as Dependencies[1],
      progression as unknown as Dependencies[2], {} as Dependencies[3],
    );
    return { service, mentorApi, findMany, progression };
  }

  it('returns gate details only for pending evaluations within active mentor scopes', async () => {
    const { service, mentorApi, findMany } = setup();
    const result = await service.listPending('mentor-user');
    expect(mentorApi.listProgressionApprovalScopes).toHaveBeenCalledWith('mentor-user');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'ACTIVE', progressionPolicyId: { not: null }, OR: [{ familyId, learnerId }] },
    }));
    expect(result).toEqual([{ familyId, learnerId, evaluation }]);
    expect(mentorProgressionApprovalInboxSchema.safeParse(result).success).toBe(true);
  });

  it('does not query trackings when there are no active capability scopes', async () => {
    const { service, findMany, progression } = setup([]);
    expect(await service.listPending('mentor-without-active-grant')).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
    expect(progression.evaluate).not.toHaveBeenCalled();
  });
});
