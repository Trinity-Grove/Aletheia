import { describe, expect, it } from 'vitest';
import {
  familyLearningPathSelectionResponseSchema,
  upsertFamilyLearningPathSelectionSchema,
} from './family-learning-path-selection.js';

const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PATH_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('Family learning-path selection contracts', () => {
  it('validates an enable/disable request', () => {
    expect(upsertFamilyLearningPathSelectionSchema.parse({ enabled: true })).toEqual({ enabled: true });
    expect(upsertFamilyLearningPathSelectionSchema.parse({ enabled: false })).toEqual({ enabled: false });
  });

  it('validates a selection with display-ready path data', () => {
    const parsed = familyLearningPathSelectionResponseSchema.parse({
      id: PATH_ID,
      familyId: FAMILY_ID,
      pathId: PATH_ID,
      enabled: true,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      path: { code: 'MUSIC.BASS', name: 'Contrabaixo', version: 1, status: 'PUBLISHED' },
    });

    expect(parsed.path.name).toBe('Contrabaixo');
  });

  it('rejects requests without an explicit enabled value', () => {
    expect(() => upsertFamilyLearningPathSelectionSchema.parse({})).toThrow();
  });
});
