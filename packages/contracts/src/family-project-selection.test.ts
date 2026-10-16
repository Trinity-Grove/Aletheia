import { describe, expect, it } from 'vitest';
import {
  familyProjectCatalogEntrySchema,
  familyProjectSelectionResponseSchema,
  upsertFamilyProjectSelectionSchema,
} from './family-project-selection.js';

const UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Family project selection contracts', () => {
  it('requires an explicit enabled flag', () => {
    expect(upsertFamilyProjectSelectionSchema.parse({ enabled: false })).toEqual({ enabled: false });
    expect(() => upsertFamilyProjectSelectionSchema.parse({})).toThrow();
  });

  it('validates the selected published project metadata', () => {
    const parsed = familyProjectSelectionResponseSchema.parse({
      id: UUID,
      familyId: UUID,
      projectId: UUID,
      enabled: true,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      project: { code: 'GARDEN_BUILD', name: 'Construir uma horta', version: 1, status: 'PUBLISHED' },
    });
    expect(parsed.project.status).toBe('PUBLISHED');
  });

  it('validates published project catalog entries and mapped competencies', () => {
    const entry = {
      id: UUID,
      code: 'GARDEN_BUILD',
      name: 'Build a garden',
      version: 1,
      description: 'Grow food together.',
      enabled: true,
      competencies: [{ competencyId: UUID, code: 'GARDEN.SOIL', title: 'Prepare soil', required: true, order: 0 }],
    };

    expect(familyProjectCatalogEntrySchema.parse(entry)).toEqual(entry);
    expect(familyProjectCatalogEntrySchema.safeParse({ ...entry, enabled: 'yes' }).success).toBe(false);
  });
});
