import { FamilyLearningResourceRepository } from './family-learning-resource.repository.js';

const publicResource = {
  id: 'resource-1',
  familyId: 'family-a',
  resourceType: 'MATERIAL',
  title: 'Cartões',
  description: null,
  subject: null,
  ageMin: null,
  ageMax: null,
  content: { kind: 'MATERIAL', items: [] },
  visibility: 'PUBLIC',
  originResourceId: null,
  createdAt: new Date('2026-10-15T00:00:00.000Z'),
  updatedAt: new Date('2026-10-15T00:00:00.000Z'),
};

describe('FamilyLearningResourceRepository', () => {
  it('lists only public resources with a bounded community query', async () => {
    const findMany = jest.fn().mockResolvedValue([publicResource]);
    const repository = new FamilyLearningResourceRepository({ familyLearningResource: { findMany } } as never);

    await repository.listPublic();

    expect(findMany).toHaveBeenCalledWith({
      where: { visibility: 'PUBLIC' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  });

  it('adopts a public snapshot as a private resource inside a transaction', async () => {
    const findFirst = jest.fn().mockResolvedValue(publicResource);
    const create = jest.fn().mockResolvedValue({ ...publicResource, id: 'copy-1', familyId: 'family-b', visibility: 'PRIVATE' });
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({ familyLearningResource: { findFirst, create } })),
    };
    const repository = new FamilyLearningResourceRepository(prisma as never);

    const result = await repository.adoptPublic('resource-1', 'family-b');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'resource-1', visibility: 'PUBLIC' },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        familyId: 'family-b',
        visibility: 'PRIVATE',
        originResourceId: 'resource-1',
        title: 'Cartões',
      }),
    });
    expect(result?.id).toBe('copy-1');
  });

  it('does not adopt a private or missing resource', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const create = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({ familyLearningResource: { findFirst, create } })),
    };
    const repository = new FamilyLearningResourceRepository(prisma as never);

    await expect(repository.adoptPublic('private-resource', 'family-b')).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});
