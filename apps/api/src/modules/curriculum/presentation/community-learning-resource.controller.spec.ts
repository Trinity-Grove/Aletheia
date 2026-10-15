import { CommunityLearningResourceController } from './community-learning-resource.controller.js';

describe('CommunityLearningResourceController', () => {
  it('delegates the authenticated catalog request without exposing family context', async () => {
    const listPublic = jest.fn().mockResolvedValue([{ id: 'resource-1', visibility: 'PUBLIC' }]);
    const controller = new CommunityLearningResourceController({ listPublic } as never);

    await expect(controller.list()).resolves.toEqual([{ id: 'resource-1', visibility: 'PUBLIC' }]);
    expect(listPublic).toHaveBeenCalledTimes(1);
  });
});
