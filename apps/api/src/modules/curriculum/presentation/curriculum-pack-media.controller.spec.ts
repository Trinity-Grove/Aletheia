import { CurriculumPackMediaController } from './curriculum-pack-media.controller.js';

describe('CurriculumPackMediaController', () => {
  it('delegates public media listing by pack id', async () => {
    const listPublic = jest.fn().mockResolvedValue([]);
    const controller = new CurriculumPackMediaController({ listPublic } as never);

    await expect(controller.list('pack-1')).resolves.toEqual([]);
    expect(listPublic).toHaveBeenCalledWith('pack-1');
  });
});
