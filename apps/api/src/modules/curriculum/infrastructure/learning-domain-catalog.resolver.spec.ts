import { LearningDomainCatalogResolver } from './learning-domain-catalog.resolver.js';

describe('LearningDomainCatalogResolver', () => {
  it('returns only the latest active published version for each domain code', async () => {
    const prisma = {
      learningDomain: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '00000000-0000-0000-0000-000000000002',
            code: 'MUSIC',
            version: 2,
            name: 'Música v2',
            description: 'Atualizada',
          },
          {
            id: '00000000-0000-0000-0000-000000000001',
            code: 'MUSIC',
            version: 1,
            name: 'Música v1',
            description: null,
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            code: 'SCIENCE',
            version: 1,
            name: 'Ciências',
            description: 'Investigação do mundo.',
          },
        ]),
      },
    };

    await expect(new LearningDomainCatalogResolver(prisma as never).listPublishedCatalog()).resolves.toEqual([
      {
        id: '00000000-0000-0000-0000-000000000002',
        code: 'MUSIC',
        version: 2,
        name: 'Música v2',
        description: 'Atualizada',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        code: 'SCIENCE',
        version: 1,
        name: 'Ciências',
        description: 'Investigação do mundo.',
      },
    ]);

    expect(prisma.learningDomain.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', isActive: true },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
      select: { id: true, code: true, version: true, name: true, description: true },
    });
  });
});
