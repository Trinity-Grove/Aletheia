import { RubricCatalogResolver } from './rubric-catalog.resolver.js';

describe('RubricCatalogResolver', () => {
  it('returns only published rubrics with criteria and keeps the latest version per code', async () => {
    const prisma = {
      rubricDefinition: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '00000000-0000-4000-8000-000000000001',
            code: 'FOUNDATION.RUBRIC',
            version: 2,
            name: 'Latest rubric',
            description: null,
            competencyId: null,
            criteria: [{
              id: '00000000-0000-4000-8000-000000000011',
              code: 'CLARITY',
              label: 'Clareza',
              order: 0,
              scaleMin: 0,
              scaleMax: 4,
            }],
          },
          {
            id: '00000000-0000-4000-8000-000000000002',
            code: 'FOUNDATION.RUBRIC',
            version: 1,
            name: 'Old rubric',
            description: null,
            competencyId: null,
            criteria: [{
              id: '00000000-0000-4000-8000-000000000012',
              code: 'OLD',
              label: 'Old',
              order: 0,
              scaleMin: 0,
              scaleMax: 4,
            }],
          },
          {
            id: '00000000-0000-4000-8000-000000000003',
            code: 'EMPTY.RUBRIC',
            version: 1,
            name: 'Empty rubric',
            description: null,
            competencyId: null,
            criteria: [],
          },
        ]),
      },
    };

    const result = await new RubricCatalogResolver(prisma as never).listPublishedCatalog();

    expect(result).toEqual([expect.objectContaining({ code: 'FOUNDATION.RUBRIC', version: 2, criteria: [expect.objectContaining({ label: 'Clareza' })] })]);
    expect(prisma.rubricDefinition.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', schemaVersion: '1.0.0' },
    }));
  });
});
