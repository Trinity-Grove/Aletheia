import { DefinitionTagsService } from './definition-tags.service.js';

describe('DefinitionTagsService facets', () => {
  it('delegates facet filters without changing the aggregate result', async () => {
    const facets = [
      { namespace: 'theme', tag: 'apiculture', entityType: 'LearningPath' as const, definitionCount: 2 },
    ];
    const repository = { searchFacets: jest.fn().mockResolvedValue(facets) };
    const service = new DefinitionTagsService(repository as never);

    const result = await service.searchFacets({ namespace: 'theme', q: 'api' });

    expect(repository.searchFacets).toHaveBeenCalledWith({ namespace: 'theme', q: 'api' });
    expect(result).toEqual(facets);
  });
});
