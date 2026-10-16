import { describe, expect, it } from 'vitest';
import { mentorProgressionApprovalInboxSchema } from './mentor-progression-approval.js';

describe('mentor progression approval inbox contract', () => {
  it('accepts a pending item with only family/learner scope and progression evaluation', () => {
    const item = {
      familyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      learnerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      evaluation: {
        learnerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', competencyDefinitionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', competencyVersion: 1,
        trackingId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', trackingStatus: 'ACTIVE', curriculumDefinitionId: null,
        policyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', policyVersion: 1, validatedEvidenceCount: 1,
        minimumEvidenceCount: 1, unmetPrerequisites: [], state: 'AWAITING_APPROVAL',
        requiredEvidenceCountMet: true, rubricAssessmentSatisfied: true, humanApprovalRequired: true,
        humanApprovalEligible: true, freshWorkRequired: false,
      },
    };
    expect(mentorProgressionApprovalInboxSchema.safeParse([item]).success).toBe(true);
    expect(mentorProgressionApprovalInboxSchema.safeParse([{ ...item, mentorEmail: 'private@example.com' }]).success).toBe(false);
    expect(mentorProgressionApprovalInboxSchema.safeParse([{ ...item, evaluation: { ...item.evaluation, state: 'MASTERED' } }]).success).toBe(false);
  });

  it('rejects entries that reveal unrelated family or mentor-grant data', () => {
    expect(mentorProgressionApprovalInboxSchema.safeParse([{ familyId: 'x', learnerId: 'y' }]).success).toBe(false);
  });
});
