import { describe, expect, it } from 'vitest';
import { createProgressionPolicySchema, progressionPolicyCatalogEntrySchema } from './progression-policy.js';

describe('Progression Policy Contracts', () => {
  it('validates a minimal policy with defaults', () => {
    const parsed = createProgressionPolicySchema.parse({
      code: 'MASTERY.DEFAULT',
      name: 'Mastery-based progression',
      policyType: 'MASTERY',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.rules).toEqual({});
  });

  it('accepts a free-form policyType, not a closed enum', () => {
    const parsed = createProgressionPolicySchema.parse({
      code: 'CUSTOM.NEW_POLICY_TYPE',
      name: 'Anything',
      policyType: 'SOME_FUTURE_POLICY_TYPE_NOT_YET_INVENTED',
    });
    expect(parsed.policyType).toBe('SOME_FUTURE_POLICY_TYPE_NOT_YET_INVENTED');
  });

  it('accepts arbitrary rules JSON', () => {
    const parsed = createProgressionPolicySchema.parse({
      code: 'HOURS.DEFAULT',
      name: 'Hours-based progression',
      policyType: 'HOURS',
      rules: { minimumHours: 40, requiresMentorSignOff: true },
    });
    expect(parsed.rules).toEqual({ minimumHours: 40, requiresMentorSignOff: true });
  });

  it('rejects a lowercase code', () => {
    expect(() =>
      createProgressionPolicySchema.parse({ code: 'mastery.default', name: 'x', policyType: 'MASTERY' }),
    ).toThrow();
  });

  it('optionally scopes to a competency or curriculum definition', () => {
    const competencyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const parsed = createProgressionPolicySchema.parse({
      code: 'MASTERY.SCOPED',
      name: 'Scoped policy',
      policyType: 'MASTERY',
      competencyDefinitionId: competencyId,
    });
    expect(parsed.competencyDefinitionId).toBe(competencyId);
    expect(parsed.curriculumDefinitionId).toBeUndefined();
  });

  it('accepts catalog entries for both supported policy types', () => {
    const common = { id: crypto.randomUUID(), code: 'P', name: 'Policy', curriculumDefinitionId: null };
    expect(progressionPolicyCatalogEntrySchema.safeParse({ ...common, policyType: 'EVIDENCE_COUNT', minimumEvidenceCount: 1 }).success).toBe(true);
    expect(progressionPolicyCatalogEntrySchema.safeParse({ ...common, policyType: 'EVIDENCE_RUBRIC', minimumEvidenceCount: 1, rubricDefinitionId: crypto.randomUUID(), rubricVersion: 2, minimumScoresByCriterion: { [crypto.randomUUID()]: 3 }, requireHumanApproval: true }).success).toBe(true);
  });

  it('validates EVIDENCE_RUBRIC rules while leaving arbitrary types backward compatible', () => {
    const base = { code: 'RUBRIC.DEFAULT', name: 'Rubric', policyType: 'EVIDENCE_RUBRIC' };
    const rubricRules = {
      minimumEvidenceCount: 2,
      rubricDefinitionId: crypto.randomUUID(),
      rubricVersion: 1,
      minimumScoresByCriterion: { [crypto.randomUUID()]: 2 },
      requireHumanApproval: true,
    };
    expect(createProgressionPolicySchema.safeParse({ ...base, rules: rubricRules }).success).toBe(true);
    expect(createProgressionPolicySchema.safeParse({ ...base, rules: { ...rubricRules, minimumScoresByCriterion: {} } }).success).toBe(false);
    expect(createProgressionPolicySchema.safeParse({ ...base, policyType: 'A_FUTURE_TYPE', rules: { futureRule: true } }).success).toBe(true);
  });
});
