import { describe, expect, it } from 'vitest';
import { evidenceCountRulesSchema, evidenceRubricRulesSchema, progressionEvaluationQuerySchema, progressionEvaluationResponseSchema, progressionStateSchema } from './progression-evaluation.js';

describe('progression evaluation contracts', () => {
  it('exposes typed objective, approval, and post-return gates for the root and prerequisites', () => {
    const fields = { trackingId: crypto.randomUUID(), trackingStatus: 'ACTIVE', curriculumDefinitionId: null,
      competencyDefinitionId: crypto.randomUUID(), competencyVersion: 1, policyId: crypto.randomUUID(), policyVersion: 1,
      validatedEvidenceCount: 0, minimumEvidenceCount: 1, state: 'NOT_STARTED',
      requiredEvidenceCountMet: false, rubricAssessmentSatisfied: null, humanApprovalRequired: false,
      humanApprovalEligible: false, freshWorkRequired: false };
    const value = { ...fields, learnerId: crypto.randomUUID(), unmetPrerequisites: [fields] };
    expect(progressionEvaluationResponseSchema.safeParse(value).success).toBe(true);
    expect(progressionEvaluationResponseSchema.safeParse({ ...value, rubricAssessmentSatisfied: 'false' }).success).toBe(false);
    expect(progressionEvaluationResponseSchema.safeParse({ ...value, humanApprovalEligible: undefined }).success).toBe(false);
  });
  it('requires a positive integer threshold and exact prerequisite references', () => {
    expect(evidenceCountRulesSchema.parse({ minimumEvidenceCount: 2 })).toEqual({ minimumEvidenceCount: 2, prerequisites: [] });
    for (const minimumEvidenceCount of [0, -1, 1.5, '2']) {
      expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount }).success).toBe(false);
    }
    expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: 'code' }] }).success).toBe(false);
    expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount: 1, extra: true }).success).toBe(false);
  });
  it('requires tracking and policy UUIDs and rejects client-selected learner or competency', () => {
    const query = { trackingId: crypto.randomUUID(), policyId: crypto.randomUUID() };
    expect(progressionEvaluationQuerySchema.safeParse(query).success).toBe(true);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, version: 1 }).success).toBe(false);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, policyId: 'latest' }).success).toBe(false);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, learnerId: crypto.randomUUID() }).success).toBe(false);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, competencyDefinitionId: crypto.randomUUID() }).success).toBe(false);
  });

  it('validates EVIDENCE_RUBRIC rules with a threshold for each criterion', () => {
    const rules = {
      minimumEvidenceCount: 2,
      rubricDefinitionId: crypto.randomUUID(),
      rubricVersion: 3,
      minimumScoresByCriterion: { [crypto.randomUUID()]: 2, [crypto.randomUUID()]: 1 },
      requireHumanApproval: false,
      prerequisites: [],
    };
    expect(evidenceRubricRulesSchema.safeParse(rules).success).toBe(true);
    expect(evidenceRubricRulesSchema.safeParse({ ...rules, minimumScoresByCriterion: {} }).success).toBe(false);
    expect(evidenceRubricRulesSchema.safeParse({ ...rules, extra: true }).success).toBe(false);
  });

  it('adds AWAITING_APPROVAL without changing existing states', () => {
    expect(progressionStateSchema.options).toEqual(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'MASTERED', 'AWAITING_APPROVAL']);
  });
});
