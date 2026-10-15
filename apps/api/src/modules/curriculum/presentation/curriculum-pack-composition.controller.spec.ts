import { CurriculumPackCommunityController } from './curriculum-pack-community.controller.js';

describe('CurriculumPackCommunityController composition routes', () => {
  it('delegates catalog and composition operations to the community composition service', async () => {
    const compositionService = {
      listCatalog: jest.fn().mockResolvedValue([]),
      getComposition: jest.fn().mockResolvedValue({ packId: 'pack-1', revision: 0, items: [], preview: [] }),
      listRevisions: jest.fn().mockResolvedValue([]),
      updateComposition: jest.fn().mockResolvedValue({ packId: 'pack-1', revision: 1, items: [], preview: [] }),
    };
    const controller = new CurriculumPackCommunityController(
      {} as never,
      {} as never,
      {} as never,
      compositionService as never,
    );

    await controller.listCompositionCatalog({ limit: 20 });
    await controller.getComposition('pack-1', 'author-1');
    await controller.listCompositionRevisions('pack-1', 'author-1');
    await controller.updateComposition('pack-1', 'author-1', { expectedRevision: 0, items: [] });

    expect(compositionService.listCatalog).toHaveBeenCalledWith({ limit: 20 });
    expect(compositionService.getComposition).toHaveBeenCalledWith('author-1', 'pack-1');
    expect(compositionService.listRevisions).toHaveBeenCalledWith('author-1', 'pack-1');
    expect(compositionService.updateComposition).toHaveBeenCalledWith('author-1', 'pack-1', {
      expectedRevision: 0,
      items: [],
    });
  });
});
