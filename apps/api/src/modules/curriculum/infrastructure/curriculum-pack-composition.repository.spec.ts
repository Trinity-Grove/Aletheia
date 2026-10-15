import { CurriculumPackCompositionRepository, CompositionRevisionConflictError } from './curriculum-pack-composition.repository.js';

describe('CurriculumPackCompositionRepository', () => {
  it('replaces ordered items and writes an immutable revision in one transaction', async () => {
    const current = {
      id: 'pack-1',
      compositionRevision: 1,
      items: [{ definitionType: 'SkillDefinition', code: 'OLD', version: 1, position: 0 }],
    };
    const tx = {
      curriculumPack: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn().mockResolvedValue({ ...current, compositionRevision: 2 }),
      },
      curriculumPackItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          { definitionType: 'SkillDefinition', code: 'NEW', version: 1, position: 0 },
        ]),
      },
      curriculumPackCompositionRevision: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) } as never;
    const repository = new CurriculumPackCompositionRepository(prisma);

    const result = await repository.replace('pack-1', 1, [
      { definitionType: 'SkillDefinition', code: 'NEW', version: 1 },
    ]);

    expect(tx.curriculumPackItem.deleteMany).toHaveBeenCalledWith({ where: { packId: 'pack-1' } });
    expect(tx.curriculumPackItem.createMany).toHaveBeenCalledWith({
      data: [{ definitionType: 'SkillDefinition', code: 'NEW', version: 1, packId: 'pack-1', position: 0 }],
    });
    expect(tx.curriculumPackCompositionRevision.create).toHaveBeenCalled();
    expect(result?.revision).toBe(2);
  });

  it('rejects stale writers before changing the current manifest', async () => {
    const tx = {
      curriculumPack: {
        findUnique: jest.fn().mockResolvedValue({ compositionRevision: 3, items: [] }),
      },
    };
    const prisma = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) } as never;
    const repository = new CurriculumPackCompositionRepository(prisma);

    await expect(repository.replace('pack-1', 2, [])).rejects.toBeInstanceOf(CompositionRevisionConflictError);
  });
});
