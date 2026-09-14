import { describe, expect, it } from 'vitest';
import { learnerCompetencyAchievementResponseSchema, learnerCompetencyAchievementReviewResponseSchema } from './learner-competency-achievement.js';

const id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
describe('immutable achievement contracts', () => {
  it('requires exact snapshots, evidence and an accountable award actor', () => {
    const award = { id, trackingId: id, familyId: id, learnerId: id, competencyDefinitionId: id, competencyVersion: 1,
      curriculumDefinitionId: id, curriculumVersion: 2, progressionPolicyId: id, policyVersion: 3,
      validatedEvidenceCount: 2, minimumEvidenceCount: 2, evidenceSnapshot: { evidenceSubmissionIds: [id], prerequisites: [] },
      awardedByUserId: id, achievedAt: '2026-09-13T21:00:00.000Z' };
    expect(learnerCompetencyAchievementResponseSchema.parse(award)).toEqual(award);
    expect(learnerCompetencyAchievementResponseSchema.safeParse({ ...award, policyVersion: null }).success).toBe(false);
    expect(learnerCompetencyAchievementResponseSchema.safeParse({ ...award, evidenceSnapshot: {} }).success).toBe(false);
  });
  it('records a rejection review separately from the original achievement', () => {
    const review = { id, achievementId: id, familyId: id, learnerId: id, evidenceSubmissionId: id,
      reviewedByUserId: id, reason: 'EVIDENCE_REJECTED', createdAt: '2026-09-13T21:00:00.000Z' };
    expect(learnerCompetencyAchievementReviewResponseSchema.parse(review)).toEqual(review);
    expect(learnerCompetencyAchievementReviewResponseSchema.safeParse({ ...review, reason: 'DELETED' }).success).toBe(false);
  });
});
