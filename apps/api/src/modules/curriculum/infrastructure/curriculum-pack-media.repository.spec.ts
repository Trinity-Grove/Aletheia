import { CurriculumPackMediaRepository } from './curriculum-pack-media.repository.js';

describe('CurriculumPackMediaRepository', () => {
  it('looks up the community publication by family snapshot provenance', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 'public-pack-1' });
    const repository = new CurriculumPackMediaRepository({ curriculumPack: { findUnique } } as never);

    const result = await repository.findPackByOriginFamilyPackId('family-pack-1');

    expect(findUnique).toHaveBeenCalledWith({
      where: { originFamilyCurriculumPackId: 'family-pack-1' },
    });
    expect(result).toEqual({ id: 'public-pack-1' });
  });

  it('persists public media in one transaction and lists by pack', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    const findMany = jest.fn().mockResolvedValue([{ id: 'media-1' }, { id: 'media-2' }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({ curriculumPackMedia: { createMany } }),
      ),
      curriculumPackMedia: { findMany },
    };
    const repository = new CurriculumPackMediaRepository(prisma as never);

    await repository.createCommunityMedia('public-pack-1', [
      { sourceFamilyMediaId: 'family-media-1', mediaType: 'IMAGE', sourceType: 'UPLOAD', title: 'Image' },
      { sourceFamilyMediaId: 'family-media-2', mediaType: 'VIDEO', sourceType: 'EXTERNAL_URL', title: 'Video' },
    ] as never);
    const listed = await repository.listPublicMedia('public-pack-1');

    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ curriculumPackId: 'public-pack-1', title: 'Image' }),
        ]),
        skipDuplicates: true,
      }),
    );
    expect(findMany).toHaveBeenCalledWith({
      where: { curriculumPackId: 'public-pack-1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(listed).toHaveLength(2);
  });
});
