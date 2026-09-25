import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FamilyCurriculumPackService } from './family-curriculum-pack.service.js';
import type { FamilyCurriculumPackRepository } from '../infrastructure/family-curriculum-pack.repository.js';
import type { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import type { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import type { CurriculumPackImportService } from './curriculum-pack-import.service.js';
import type { CurriculumPackService } from './curriculum-pack.service.js';

const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const OTHER_FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
const INSTANCE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const USER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const NEW_PACK_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

const document = {
  formatVersion: '1.0.0',
  exportedAt: '2026-09-15T00:00:00.000Z',
  pack: {
    code: 'SOURCE.PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Source Pack',
    description: 'Original description',
    metadata: {},
  },
  dependencies: [],
  items: [],
};

describe('FamilyCurriculumPackService.publishToCommunity', () => {
  let service: FamilyCurriculumPackService;
  let findByIdAndFamily: jest.Mock;
  let findPackByCodeVersion: jest.Mock;
  let importPack: jest.Mock;
  let getPack: jest.Mock;

  beforeEach(() => {
    findByIdAndFamily = jest.fn().mockResolvedValue({
      id: INSTANCE_ID,
      familyId: FAMILY_ID,
      sourcePackId: 'source-pack-id',
      sourcePackCode: 'SOURCE.PACK',
      sourcePackVersion: 1,
      revision: 1,
      document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    findPackByCodeVersion = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: NEW_PACK_ID });
    importPack = jest.fn().mockResolvedValue({ dryRun: false });
    getPack = jest.fn().mockResolvedValue({ id: NEW_PACK_ID, code: 'MY.PACK', moderationStatus: 'DRAFT' });

    const repository = { findByIdAndFamily } as unknown as FamilyCurriculumPackRepository;
    const curriculumPackRepository = {
      findPackByCodeVersion,
    } as unknown as CurriculumPackRepository;
    const exportService = {} as CurriculumPackExportService;
    const importService = { importPack } as unknown as CurriculumPackImportService;
    const curriculumPackService = { getPack } as unknown as CurriculumPackService;

    service = new FamilyCurriculumPackService(
      repository,
      curriculumPackRepository,
      exportService,
      importService,
      curriculumPackService,
    );
  });

  it('publishes the family document as a new, distinct community pack in DRAFT', async () => {
    const result = await service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, {
      code: 'MY.PACK',
      name: 'My Pack',
      description: 'My description',
    });

    expect(findByIdAndFamily).toHaveBeenCalledWith(INSTANCE_ID, FAMILY_ID);
    expect(findPackByCodeVersion).toHaveBeenCalledWith('MY.PACK', 1);
    expect(importPack).toHaveBeenCalledWith(
      expect.objectContaining({
        pack: expect.objectContaining({
          code: 'MY.PACK',
          version: 1,
          status: 'DRAFT',
          name: 'My Pack',
          description: 'My description',
        }),
      }),
      false,
      USER_ID,
    );
    expect(getPack).toHaveBeenCalledWith(NEW_PACK_ID);
    expect(result).toEqual({ id: NEW_PACK_ID, code: 'MY.PACK', moderationStatus: 'DRAFT' });
  });

  it('falls back to the source description when none is provided', async () => {
    await service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, {
      code: 'MY.PACK',
      name: 'My Pack',
    });

    expect(importPack).toHaveBeenCalledWith(
      expect.objectContaining({
        pack: expect.objectContaining({ description: 'Original description' }),
      }),
      false,
      USER_ID,
    );
  });

  it('rejects publishing when a pack with that code already exists', async () => {
    findPackByCodeVersion.mockReset().mockResolvedValue({ id: 'existing-pack-id' });

    await expect(
      service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'TAKEN.CODE', name: 'X' }),
    ).rejects.toThrow(BadRequestException);
    expect(importPack).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the pack does not belong to the family', async () => {
    findByIdAndFamily.mockResolvedValue(null);

    await expect(
      service.publishToCommunity(OTHER_FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'MY.PACK', name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});
