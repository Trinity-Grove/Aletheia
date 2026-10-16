import { BadRequestException } from '@nestjs/common';
import { evaluateProgression, type ProgressionReader } from './progression.service.js';

describe('evidence progression', () => {
  const competencyId = '00000000-0000-4000-8000-000000000001';
  const policyId = '00000000-0000-4000-8000-000000000002';
  const prerequisiteId = '00000000-0000-4000-8000-000000000003';
  const rubricId = '00000000-0000-4000-8000-000000000004';
  const criterionA = '00000000-0000-4000-8000-000000000005';
  const criterionB = '00000000-0000-4000-8000-000000000006';
  const query = { trackingId: 'tracking', policyId };
  const tracking = { id: 'tracking', learnerId: 'learner', competencyDefinitionId: competencyId, competencyVersion: 2, curriculumDefinitionId: null, status: 'ACTIVE' as const };
  function reader(overrides: Partial<ProgressionReader> = {}): ProgressionReader {
    return {
      learnerExists: async () => true,
      tracking: async () => tracking,
      trackingForCompetency: async () => tracking,
      competency: async (id) => ({ id, version: 2, status: 'PUBLISHED', schemaVersion: '1.0.0' }),
      policy: async (id) => ({ id, version: 3, status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_COUNT', rules: { minimumEvidenceCount: 2 }, competencyDefinitionId: null, curriculumDefinitionId: null }),
      curriculumContains: async () => true,
      evidenceCount: async () => 2,
      rubricDefinition: async () => null,
      latestAssessmentResult: async () => null,
      ...overrides,
    };
  }
  it('returns exact versions and mastery at threshold', async () => {
    expect(await evaluateProgression(reader(), 'family', query)).toMatchObject({ state: 'MASTERED', competencyVersion: 2, policyVersion: 3, validatedEvidenceCount: 2, minimumEvidenceCount: 2, unmetPrerequisites: [] });
  });
  it.each([[0, 'NOT_STARTED'], [1, 'IN_PROGRESS']])('explains evidence count %s', async (count, state) => {
    expect((await evaluateProgression(reader({ evidenceCount: async () => count as number }), 'family', query)).state).toBe(state);
  });
  it('blocks despite enough evidence until prerequisites are mastered', async () => {
    const base = reader();
    const source = reader({ policy: async (id) => ({ ...(await base.policy(id))!, rules: { minimumEvidenceCount: id === policyId ? 1 : 2, prerequisites: id === policyId ? [{ competencyDefinitionId: competencyId, policyId: prerequisiteId }] : [] } }), evidenceCount: async () => 1 });
    const result = await evaluateProgression(source, 'family', query);
    expect(result.state).toBe('BLOCKED');
    expect(result.unmetPrerequisites).toEqual([expect.objectContaining({ policyId: prerequisiteId, state: 'IN_PROGRESS' })]);
  });
  it('rejects cycles even if evidence meets every threshold', async () => {
    const base = reader();
    await expect(evaluateProgression(reader({ policy: async (id) => ({ ...(await base.policy(id))!, rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: competencyId, policyId }] } }) }), 'family', query)).rejects.toThrow('cycle');
  });
  it('rejects a pinned tracking policy mismatch instead of silently using the requested policy', async () => {
    await expect(evaluateProgression(reader({ trackingPolicy: async () => ({ id: prerequisiteId, version: 3 }) }), 'family', query)).rejects.toThrow('does not match');
  });
  it('keeps legacy unpinned evaluation limited to published policies', async () => {
    const base = reader();
    await expect(evaluateProgression(reader({ policy: async (id) => ({ ...(await base.policy(id))!, status: 'DEPRECATED' }) }), 'family', query)).rejects.toThrow(BadRequestException);
  });
  it.each([
    { policyType: 'HOURS' }, { schemaVersion: '2.0.0' }, { status: 'DRAFT' },
    { rules: { minimumEvidenceCount: 0 } }, { rules: { minimumEvidenceCount: 1, ignored: true } },
    { competencyDefinitionId: prerequisiteId },
  ])('fails closed for invalid policy %j', async (changes) => {
    const base = reader();
    await expect(evaluateProgression(reader({ policy: async (id) => ({ ...(await base.policy(id))!, ...changes }) }), 'family', query)).rejects.toThrow(BadRequestException);
  });
  it('bounds the graph traversal', async () => {
    const base = reader();
    let next = 10;
    await expect(evaluateProgression(reader({ policy: async (id) => ({ ...(await base.policy(id))!, rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: competencyId, policyId: `00000000-0000-4000-8000-${String(next++).padStart(12, '0')}` }] } }) }), 'family', query)).rejects.toThrow('limit');
  });

  describe('EVIDENCE_RUBRIC', () => {
    const rules = { minimumEvidenceCount: 2, rubricDefinitionId: rubricId, rubricVersion: 4,
      minimumScoresByCriterion: { [criterionA]: 3, [criterionB]: 2 }, requireHumanApproval: false };
    const assessment = { createdAt: new Date('2026-01-01T00:00:00Z'), scores: [
      { rubricCriterionId: criterionA, score: 3 }, { rubricCriterionId: criterionB, score: 2 },
    ] };
    type RubricOverrides = Partial<ProgressionReader>;
    const rubric = { id: rubricId, version: 4, status: 'PUBLISHED', schemaVersion: '1.0.0', criteria: [
      { id: criterionA, scaleMin: 0, scaleMax: 4 }, { id: criterionB, scaleMin: 1, scaleMax: 5 },
    ] };
    const rubricReader = (changes: RubricOverrides = {}) => reader({
      policy: async (id: string) => ({ id, version: 3, status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_RUBRIC', rules, competencyDefinitionId: null, curriculumDefinitionId: null }),
      evidenceCount: async () => 2,
      rubricDefinition: async () => rubric,
      latestAssessmentResult: async () => assessment,
      ...changes,
    });

    it('requires both the minimum validated evidence and exact rubric/version assessment gates', async () => {
      expect((await evaluateProgression(rubricReader(), 'family', query)).state).toBe('MASTERED');
      expect((await evaluateProgression(rubricReader({ evidenceCount: async () => 1 }), 'family', query)).state).toBe('IN_PROGRESS');
      expect((await evaluateProgression(rubricReader({ latestAssessmentResult: async () => null }), 'family', query)).state).toBe('IN_PROGRESS');
    });
    it('requires a published exact rubric version and uses its latest exact-version assessment', async () => {
      await expect(evaluateProgression(rubricReader({ rubricDefinition: async () => ({ ...rubric, version: 3 }) }), 'family', query)).rejects.toThrow(BadRequestException);
      expect((await evaluateProgression(rubricReader({ latestAssessmentResult: async () => ({ ...assessment, scores: [
        { rubricCriterionId: criterionA, score: 4 }, { rubricCriterionId: criterionB, score: 1 },
      ] }) }), 'family', query)).state).toBe('IN_PROGRESS');
    });
    const invalidScores: { rubricCriterionId: string; score: number }[][] = [
      [{ rubricCriterionId: criterionA, score: 3 }],
      [...assessment.scores, { rubricCriterionId: rubricId, score: 4 }],
      [{ rubricCriterionId: criterionA, score: 3 }, { rubricCriterionId: criterionA, score: 4 }, { rubricCriterionId: criterionB, score: 3 }],
      [{ rubricCriterionId: criterionA, score: 5 }, { rubricCriterionId: criterionB, score: 3 }],
      [{ rubricCriterionId: criterionA, score: 2 }, { rubricCriterionId: criterionB, score: 3 }],
    ];
    it.each(invalidScores.map((scores) => [scores]))('fails closed when score set is missing, extra, duplicate, out of scale, or below a native threshold', async (scores) => {
      expect((await evaluateProgression(rubricReader({ latestAssessmentResult: async () => ({ ...assessment, scores }) }), 'family', query)).state).toBe('IN_PROGRESS');
    });
    it('blocks objective mastery when a prerequisite is unmet', async () => {
      const base = rubricReader();
      const result = await evaluateProgression(rubricReader({
        policy: async (id) => id === policyId ? ({ ...(await base.policy(id))!, rules: { ...rules, prerequisites: [{ competencyDefinitionId: prerequisiteId, policyId: prerequisiteId }] } }) : ({ ...(await base.policy(id))!, policyType: 'EVIDENCE_COUNT', rules: { minimumEvidenceCount: 1 } }),
        trackingForCompetency: async () => ({ ...tracking, id: 'prerequisite', competencyDefinitionId: prerequisiteId }),
        evidenceCount: async (_f, _l, id) => id === competencyId ? 2 : 0,
      }), 'family', query);
      expect(result.state).toBe('BLOCKED');
    });
    it('waits for explicit trusted approval when required', async () => {
      const approvalReader = rubricReader({ policy: async (id) => ({ id, version: 3, status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_RUBRIC', rules: { ...rules, requireHumanApproval: true }, competencyDefinitionId: null, curriculumDefinitionId: null }) });
      expect((await evaluateProgression(approvalReader, 'family', query)).state).toBe('AWAITING_APPROVAL');
      const evaluateWithApproval = evaluateProgression as unknown as (reader: ProgressionReader, familyId: string, input: { trackingId: string; policyId: string; approvalGranted: boolean }) => ReturnType<typeof evaluateProgression>;
      expect((await evaluateWithApproval(approvalReader, 'family', { ...query, approvalGranted: true })).state).toBe('MASTERED');
    });
  });
});
