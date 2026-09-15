import { describe, expect, it } from 'vitest';
import {
  installFamilyCurriculumPackSchema,
  updateFamilyCurriculumPackSchema,
} from './family-curriculum-pack.js';

const document = {
  formatVersion: '1.0.0',
  exportedAt: '2026-09-15T00:00:00.000Z',
  pack: {
    code: 'FOUNDATIONS',
    version: 2,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Foundations',
    description: null,
    metadata: {},
  },
  dependencies: [],
  items: [],
};

describe('family curriculum pack contracts', () => {
  it('requires a UUID for the source pack installation', () => {
    expect(installFamilyCurriculumPackSchema.safeParse({ sourcePackId: 'not-a-uuid' }).success).toBe(false);
  });

  it('accepts an edited portable document as a family revision', () => {
    const result = updateFamilyCurriculumPackSchema.safeParse({
      document: {
        ...document,
        pack: { ...document.pack, name: 'My family version' },
      },
    });
    expect(result.success).toBe(true);
  });
});
