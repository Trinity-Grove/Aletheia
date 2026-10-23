import { describe, expect, it } from 'vitest';
import { learnerLearningPathSelectionResponseSchema, upsertLearnerLearningPathSelectionSchema } from './learner-learning-path-selection.js';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('learner learning path selection contracts', () => {
  it('accepts an enable or disable command', () => {
    expect(upsertLearnerLearningPathSelectionSchema.parse({ enabled: true })).toEqual({ enabled: true });
    expect(upsertLearnerLearningPathSelectionSchema.parse({ enabled: false })).toEqual({ enabled: false });
  });

  it('requires a boolean enabled value', () => {
    expect(() => upsertLearnerLearningPathSelectionSchema.parse({ enabled: 'yes' })).toThrow();
  });

  it('validates the learner/year context and selected path in responses', () => {
    const response = learnerLearningPathSelectionResponseSchema.parse({
      id: UUID,
      familyId: UUID,
      learnerId: '00000000-0000-4000-8000-000000000002',
      academicYearId: '00000000-0000-4000-8000-000000000003',
      pathId: '00000000-0000-4000-8000-000000000004',
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      path: { code: 'TRIVIUM.GRAMMAR', name: 'Grammar', version: 1, status: 'PUBLISHED' },
    });

    expect(response.path.code).toBe('TRIVIUM.GRAMMAR');
    expect(() => learnerLearningPathSelectionResponseSchema.parse({ ...response, learnerId: 'bad-id' })).toThrow();
  });
});
