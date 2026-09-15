import { rankSubjectsByRelevance } from './pedagogical-subject-ranking.js';
import type { TemplateSubjectDefinition } from '@aletheia/contracts';

function subject(name: string): TemplateSubjectDefinition {
  return { name, color: '#123456', description: 'Test subject', starterObjectives: ['objective'] };
}

describe('rankSubjectsByRelevance', () => {
  const A = subject('A');
  const B = subject('B');
  const C = subject('C');

  it('returns the same array by reference when there are no weighted models', () => {
    const subjects = [A, B, C];
    const result = rankSubjectsByRelevance(subjects, [], new Map());
    expect(result.subjects).toBe(subjects);
    expect(result.relevance).toEqual([]);
  });

  it('sorts subjects descending by summed weight across weighted models', () => {
    const subjects = [A, B, C];
    const namesByCode = new Map<string, Set<string>>([
      ['PRIMARY', new Set(['B'])],
      ['SECONDARY', new Set(['B', 'C'])],
    ]);
    const result = rankSubjectsByRelevance(
      subjects,
      [{ code: 'PRIMARY', weight: 1 }, { code: 'SECONDARY', weight: 0.5 }],
      namesByCode,
    );
    expect(result.subjects.map((s) => s.name)).toEqual(['B', 'C', 'A']);
    expect(result.relevance).toEqual([
      { name: 'B', relevanceScore: 1.5 },
      { name: 'C', relevanceScore: 0.5 },
      { name: 'A', relevanceScore: 0 },
    ]);
  });

  it('preserves original relative order for tied scores (stable sort)', () => {
    const subjects = [A, B, C];
    // No weighted model matches any subject -- every score is 0.
    const namesByCode = new Map<string, Set<string>>([['PRIMARY', new Set(['NOT_PRESENT'])]]);
    const result = rankSubjectsByRelevance(subjects, [{ code: 'PRIMARY', weight: 1 }], namesByCode);
    expect(result.subjects.map((s) => s.name)).toEqual(['A', 'B', 'C']);
    expect(result.relevance.every((r) => r.relevanceScore === 0)).toBe(true);
  });

  it('never drops or adds a subject -- only reorders the given set', () => {
    const subjects = [A, B, C];
    const namesByCode = new Map<string, Set<string>>([['PRIMARY', new Set(['C'])]]);
    const result = rankSubjectsByRelevance(subjects, [{ code: 'PRIMARY', weight: 1 }], namesByCode);
    expect(result.subjects).toHaveLength(3);
    expect(new Set(result.subjects.map((s) => s.name))).toEqual(new Set(['A', 'B', 'C']));
  });

  it('rounds away floating point noise in summed scores', () => {
    const subjects = [A];
    const namesByCode = new Map<string, Set<string>>([
      ['M1', new Set(['A'])],
      ['M2', new Set(['A'])],
      ['M3', new Set(['A'])],
    ]);
    const result = rankSubjectsByRelevance(
      subjects,
      [{ code: 'M1', weight: 0.1 }, { code: 'M2', weight: 0.1 }, { code: 'M3', weight: 0.1 }],
      namesByCode,
    );
    expect(result.relevance[0]?.relevanceScore).toBe(0.3);
  });
});
