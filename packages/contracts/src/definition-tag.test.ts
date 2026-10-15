import { describe, expect, it } from 'vitest';
import {
  addDefinitionTagSchema,
  searchDefinitionTagFacetsQuerySchema,
  definitionTagFacetResponseSchema,
  searchDefinitionsByTagSchema,
} from './definition-tag.js';

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

  it('validates a tag facet query and normalizes the prefix', () => {
    expect(searchDefinitionTagFacetsQuerySchema.parse({
      namespace: 'theme',
      entityType: 'LearningPath',
      q: '  api  ',
    })).toEqual({ namespace: 'theme', entityType: 'LearningPath', q: 'api' });
  });

  it.each([
    { q: '   ' },
    { entityType: 'ProgressionPolicy' },
  ])('rejects invalid facet query %j', (query) => {
    expect(searchDefinitionTagFacetsQuerySchema.safeParse(query).success).toBe(false);
  });

  it('validates a facet response with a definition count', () => {
    expect(definitionTagFacetResponseSchema.parse({
      namespace: 'theme',
      tag: 'apiculture',
      entityType: 'LearningPath',
      definitionCount: 3,
    }).definitionCount).toBe(3);
  });
});
