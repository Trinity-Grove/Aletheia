import { describe, expect, it } from 'vitest';
import { evidenceCountRulesSchema, progressionEvaluationQuerySchema } from './progression-evaluation.js';

describe('progression evaluation contracts', () => {
  it('requires a positive integer threshold and exact prerequisite references', () => {
    expect(evidenceCountRulesSchema.parse({ minimumEvidenceCount: 2 })).toEqual({ minimumEvidenceCount: 2, prerequisites: [] });
    for (const minimumEvidenceCount of [0, -1, 1.5, '2']) {
      expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount }).success).toBe(false);
    }
    expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: 'code' }] }).success).toBe(false);
    expect(evidenceCountRulesSchema.safeParse({ minimumEvidenceCount: 1, extra: true }).success).toBe(false);
  });
  it('requires all three exact UUIDs and rejects extra query fields', () => {
    const query = { learnerId: crypto.randomUUID(), competencyDefinitionId: crypto.randomUUID(), policyId: crypto.randomUUID() };
    expect(progressionEvaluationQuerySchema.safeParse(query).success).toBe(true);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, version: 1 }).success).toBe(false);
    expect(progressionEvaluationQuerySchema.safeParse({ ...query, policyId: 'latest' }).success).toBe(false);
  });
});
