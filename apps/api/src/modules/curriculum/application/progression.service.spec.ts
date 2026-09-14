import { BadRequestException } from '@nestjs/common';
import { evaluateProgression, type ProgressionReader } from './progression.service.js';

describe('evidence progression', () => {
  const competencyId = '00000000-0000-4000-8000-000000000001';
  const policyId = '00000000-0000-4000-8000-000000000002';
  const prerequisiteId = '00000000-0000-4000-8000-000000000003';
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
});
