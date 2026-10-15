import { FamilyLearningResourceController } from './family-learning-resource.controller.js';

describe('FamilyLearningResourceController', () => {
  it('delegates adoption in the family tenant context', async () => {
    const adopt = jest.fn().mockResolvedValue({ id: 'copy-1', visibility: 'PRIVATE' });
    const controller = new FamilyLearningResourceController({ adopt } as never);

    await expect(controller.adopt('family-b', { sourceResourceId: 'resource-1' })).resolves.toEqual({
      id: 'copy-1',
      visibility: 'PRIVATE',
    });
    expect(adopt).toHaveBeenCalledWith('family-b', 'resource-1');
  });
});
