import { describe, expect, it } from 'vitest';
import { learningPathExplorerCatalogEntrySchema, learningPathExplorerQuerySchema } from './learning-path-explorer.js';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('learning path explorer contracts', () => {
  it('requires a learner and academic year to resolve selection state', () => {
    expect(learningPathExplorerQuerySchema.parse({ learnerId: UUID, academicYearId: UUID })).toEqual({ learnerId: UUID, academicYearId: UUID });
    expect(() => learningPathExplorerQuerySchema.parse({ learnerId: UUID })).toThrow();
  });

  it('includes ordered competency data and selected state for a published path', () => {
    const entry = learningPathExplorerCatalogEntrySchema.parse({
      id: UUID,
      code: 'TRIVIUM.GRAMMAR',
      version: 1,
      name: 'Grammar',
      description: 'Language foundations',
      metadata: { educationalStages: ['PRIMARY'], ageRecommendation: { min: 6, max: 11 } },
      selected: true,
      competencies: [{ code: 'TRIVIUM.GRAMMAR.CLOSE_READING', title: 'Close reading', level: 1, metadata: { starterObjectives: ['Summarize a text.'] } }],
    });

    expect(entry.competencies[0]?.code).toBe('TRIVIUM.GRAMMAR.CLOSE_READING');
    expect(entry.selected).toBe(true);
    expect(() => learningPathExplorerCatalogEntrySchema.parse({ ...entry, selected: 'true' })).toThrow();
  });
});
