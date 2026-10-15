import { NotFoundException } from '@nestjs/common';
import { FamilyLearningPathSelectionService } from './family-learning-path-selection.service.js';
import type { FamilyLearningPathSelectionRepository } from '../infrastructure/family-learning-path-selection.repository.js';
import type { FamilyLearningPathSelectionWithPath } from '../infrastructure/family-learning-path-selection.repository.js';

const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PATH_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function selection(enabled: boolean): FamilyLearningPathSelectionWithPath {
  return {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    familyId: FAMILY_ID,
    pathId: PATH_ID,
    enabled,
    createdAt: new Date('2026-10-15T00:00:00.000Z'),
    updatedAt: new Date('2026-10-15T00:00:00.000Z'),
    path: { code: 'MUSIC.BASS', name: 'Contrabaixo', version: 1, status: 'PUBLISHED' },
  } as FamilyLearningPathSelectionWithPath;
}

describe('FamilyLearningPathSelectionService', () => {
  let service: FamilyLearningPathSelectionService;
  let upsert: jest.Mock;
  let listByFamily: jest.Mock;

  beforeEach(() => {
    upsert = jest.fn();
    listByFamily = jest.fn();
    service = new FamilyLearningPathSelectionService({ upsert, listByFamily } as unknown as FamilyLearningPathSelectionRepository);
  });

  it('upserts an explicit family preference and maps the published path', async () => {
    upsert.mockResolvedValue(selection(false));

    const result = await service.upsert(FAMILY_ID, PATH_ID, { enabled: false });

    expect(upsert).toHaveBeenCalledWith(FAMILY_ID, PATH_ID, false);
    expect(result).toEqual(expect.objectContaining({ familyId: FAMILY_ID, pathId: PATH_ID, enabled: false }));
    expect(result.path).toEqual({ code: 'MUSIC.BASS', name: 'Contrabaixo', version: 1, status: 'PUBLISHED' });
    expect(result.createdAt).toBe('2026-10-15T00:00:00.000Z');
  });

  it('rejects missing or unpublished paths as not found', async () => {
    upsert.mockResolvedValue(null);

    await expect(service.upsert(FAMILY_ID, PATH_ID, { enabled: true })).rejects.toThrow(NotFoundException);
  });

  it('lists selections in repository order', async () => {
    listByFamily.mockResolvedValue([selection(true), selection(false)]);

    const result = await service.list(FAMILY_ID);

    expect(listByFamily).toHaveBeenCalledWith(FAMILY_ID);
    expect(result.map((item) => item.enabled)).toEqual([true, false]);
  });
});
