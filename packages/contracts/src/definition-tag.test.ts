import { describe, expect, it } from 'vitest';
import { addDefinitionTagSchema, searchDefinitionsByTagSchema } from './definition-tag.js';

const DEFINITION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Definition Tag Contracts', () => {
  it('validates a tag with defaults', () => {
    const parsed = addDefinitionTagSchema.parse({
      entityType: 'CompetencyDefinition',
      definitionId: DEFINITION_ID,
      tag: 'apiculture',
    });
    expect(parsed.namespace).toBe('general');
  });

  it('validates a tag with an explicit namespace', () => {
    const parsed = addDefinitionTagSchema.parse({
      entityType: 'ActivityDefinition',
      definitionId: DEFINITION_ID,
      namespace: 'difficulty',
      tag: 'beginner',
    });
    expect(parsed.namespace).toBe('difficulty');
  });

  it('rejects an entity type outside the closed, packageable set', () => {
    expect(() =>
      addDefinitionTagSchema.parse({ entityType: 'ProgressionPolicy', definitionId: DEFINITION_ID, tag: 'x' }),
    ).toThrow();
  });

  it('rejects a missing tag value', () => {
    expect(() =>
      addDefinitionTagSchema.parse({ entityType: 'CompetencyDefinition', definitionId: DEFINITION_ID, tag: '' }),
    ).toThrow();
  });

  it('validates a search query with optional facets', () => {
    const parsed = searchDefinitionsByTagSchema.parse({ tag: 'apiculture' });
    expect(parsed.namespace).toBeUndefined();
    expect(parsed.entityType).toBeUndefined();
  });
});
