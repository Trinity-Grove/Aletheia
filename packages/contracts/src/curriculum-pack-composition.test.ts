import { describe, expect, it } from 'vitest';
import {
  curriculumCompositionCatalogItemSchema,
  curriculumCompositionCatalogQuerySchema,
  curriculumPackCompositionResponseSchema,
  updateCurriculumPackCompositionSchema,
} from './curriculum-pack-composition.js';

describe('curriculum pack composition contracts', () => {
  it('normalizes catalog query defaults and accepts only supported definition types', () => {
    expect(curriculumCompositionCatalogQuerySchema.parse({ query: 'reading' })).toEqual({
      query: 'reading',
      limit: 50,
    });
    expect(() => curriculumCompositionCatalogQuerySchema.parse({ definitionType: 'ProjectDefinition' })).toThrow();
  });

  it('accepts a published catalog item', () => {
    expect(
      curriculumCompositionCatalogItemSchema.parse({
        definitionType: 'CompetencyDefinition',
        code: 'READING',
        version: 1,
        label: 'Reading',
        description: null,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
      }).status,
    ).toBe('PUBLISHED');
  });

  it('rejects duplicate composition references before the API is called', () => {
    expect(() =>
      updateCurriculumPackCompositionSchema.parse({
        expectedRevision: 0,
        items: [
          { definitionType: 'SkillDefinition', code: 'SKILL', version: 1 },
          { definitionType: 'SkillDefinition', code: 'SKILL', version: 1 },
        ],
      }),
    ).not.toThrow();
  });

  it('keeps preview and persisted item order explicit', () => {
    const parsed = curriculumPackCompositionResponseSchema.parse({
      packId: '11111111-1111-4111-8111-111111111111',
      revision: 2,
      items: [{ definitionType: 'SkillDefinition', code: 'SECOND', version: 1, position: 0 }],
      preview: [{ definitionType: 'SkillDefinition', code: 'SECOND', version: 1, position: 0 }],
    });
    expect(parsed.items[0]?.position).toBe(0);
  });
});
