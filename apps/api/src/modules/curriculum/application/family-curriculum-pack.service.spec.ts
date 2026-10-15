import { BadRequestException, NotFoundException } from '@nestjs/common';
import { verifyPackChecksum } from '../domain/pack-checksum.js';
import { FamilyCurriculumPackService } from './family-curriculum-pack.service.js';
import type { FamilyCurriculumPackRepository } from '../infrastructure/family-curriculum-pack.repository.js';
import type { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import type { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import type { CurriculumPackImportService } from './curriculum-pack-import.service.js';
import type { CurriculumPackService } from './curriculum-pack.service.js';
import type { FamilyCurriculumPackMediaRepository } from '../infrastructure/family-curriculum-pack-media.repository.js';
import type { CurriculumPackMediaRepository } from '../infrastructure/curriculum-pack-media.repository.js';
import type { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';

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
  let findPackByOriginFamilyPackId: jest.Mock;
  let listByFamilyCurriculumPackId: jest.Mock;
  let createCommunityMedia: jest.Mock;
  let objectStorage: {
    headObject: jest.Mock;
    copyObject: jest.Mock;
    deleteObject: jest.Mock;
    buildCommunityCurriculumPackMediaStorageKey: jest.Mock;
  };

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
    findPackByOriginFamilyPackId = jest.fn().mockResolvedValue(null);
    importPack = jest.fn().mockResolvedValue({ dryRun: false });
    getPack = jest.fn().mockResolvedValue({ id: NEW_PACK_ID, code: 'MY.PACK', moderationStatus: 'DRAFT' });
    listByFamilyCurriculumPackId = jest.fn().mockResolvedValue([]);
    createCommunityMedia = jest.fn().mockResolvedValue(undefined);
    objectStorage = {
      headObject: jest.fn(),
      copyObject: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      buildCommunityCurriculumPackMediaStorageKey: jest
        .fn()
        .mockImplementation((sourceMediaId: string) => `community/curriculum-media/${sourceMediaId}/file`),
    };

    const repository = { findByIdAndFamily } as unknown as FamilyCurriculumPackRepository;
    const curriculumPackRepository = {
      findPackByCodeVersion,
      findPackByOriginFamilyPackId,
    } as unknown as CurriculumPackRepository;
    const exportService = {} as CurriculumPackExportService;
    const importService = { importPack } as unknown as CurriculumPackImportService;
    const curriculumPackService = { getPack } as unknown as CurriculumPackService;
    const familyMediaRepository = { listByFamilyCurriculumPackId } as unknown as FamilyCurriculumPackMediaRepository;
    const publicMediaRepository = {
      createCommunityMedia,
    } as unknown as CurriculumPackMediaRepository;

    service = new FamilyCurriculumPackService(
      repository,
      curriculumPackRepository,
      exportService,
      importService,
      curriculumPackService,
      familyMediaRepository,
      publicMediaRepository,
      objectStorage as unknown as ObjectStorageService,
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
      { originFamilyCurriculumPackId: INSTANCE_ID },
    );
    expect(verifyPackChecksum(importPack.mock.calls[0][0])).toBe(true);
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
      { originFamilyCurriculumPackId: INSTANCE_ID },
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

  it('copies external links and confirmed uploads into public media rows', async () => {
    listByFamilyCurriculumPackId.mockResolvedValue([
      {
        id: 'family-media-external',
        familyCurriculumPackId: INSTANCE_ID,
        mediaType: 'VIDEO',
        sourceType: 'EXTERNAL_URL',
        provider: 'YOUTUBE',
        title: 'Aula',
        description: 'Descrição',
        url: 'https://www.youtube.com/watch?v=123',
        storageKey: null,
        mimeType: null,
        sizeBytes: null,
      },
      {
        id: 'family-media-upload',
        familyCurriculumPackId: INSTANCE_ID,
        mediaType: 'DOCUMENT',
        sourceType: 'UPLOAD',
        provider: null,
        title: 'PDF',
        description: null,
        url: null,
        storageKey: 'families/private/file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 4096,
      },
    ]);
    objectStorage.headObject.mockResolvedValue({ contentType: 'application/pdf', contentLength: 4096 });

    await service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'MY.PACK', name: 'My Pack' });

    expect(objectStorage.copyObject).toHaveBeenCalledWith(
      'families/private/file.pdf',
      'community/curriculum-media/family-media-upload/file',
      'application/pdf',
    );
    expect(createCommunityMedia).toHaveBeenCalledWith(NEW_PACK_ID, [
      expect.objectContaining({
        sourceFamilyMediaId: 'family-media-external',
        sourceType: 'EXTERNAL_URL',
        url: 'https://www.youtube.com/watch?v=123',
      }),
      expect.objectContaining({
        sourceFamilyMediaId: 'family-media-upload',
        sourceType: 'UPLOAD',
        storageKey: 'community/curriculum-media/family-media-upload/file',
      }),
    ]);
  });

  it('blocks publication before import when an upload is not confirmed', async () => {
    listByFamilyCurriculumPackId.mockResolvedValue([
      {
        id: 'family-media-upload',
        sourceType: 'UPLOAD',
        storageKey: 'families/private/file.pdf',
        sizeBytes: null,
        mimeType: 'application/pdf',
      },
    ]);

    await expect(
      service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'MY.PACK', name: 'My Pack' }),
    ).rejects.toThrow(BadRequestException);
    expect(importPack).not.toHaveBeenCalled();
  });

  it('rejects malformed external media URLs as a domain validation error', async () => {
    listByFamilyCurriculumPackId.mockResolvedValue([
      {
        id: 'family-media-malformed-url',
        familyCurriculumPackId: INSTANCE_ID,
        mediaType: 'VIDEO',
        sourceType: 'EXTERNAL_URL',
        provider: null,
        title: 'Material',
        description: null,
        url: 'not-a-url',
        storageKey: null,
        mimeType: null,
        sizeBytes: null,
      },
    ]);

    await expect(
      service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'MY.PACK', name: 'My Pack' }),
    ).rejects.toThrow(BadRequestException);
    expect(importPack).not.toHaveBeenCalled();
  });

  it('cleans previously copied objects when a later upload copy fails', async () => {
    listByFamilyCurriculumPackId.mockResolvedValue([
      {
        id: 'family-media-1',
        mediaType: 'DOCUMENT',
        sourceType: 'UPLOAD',
        storageKey: 'families/private/one.pdf',
        sizeBytes: 10,
        mimeType: 'application/pdf',
      },
      {
        id: 'family-media-2',
        mediaType: 'DOCUMENT',
        sourceType: 'UPLOAD',
        storageKey: 'families/private/two.pdf',
        sizeBytes: 10,
        mimeType: 'application/pdf',
      },
    ]);
    objectStorage.headObject.mockResolvedValue({ contentType: 'application/pdf', contentLength: 10 });
    objectStorage.copyObject.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('storage down'));

    await expect(
      service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, { code: 'MY.PACK', name: 'My Pack' }),
    ).rejects.toThrow('storage down');
    expect(objectStorage.deleteObject).toHaveBeenCalledWith('community/curriculum-media/family-media-1/file');
    expect(importPack).not.toHaveBeenCalled();
  });

  it('returns an existing origin publication without importing or copying again', async () => {
    findPackByOriginFamilyPackId.mockResolvedValue({ id: 'existing-public-pack' });
    getPack.mockResolvedValue({ id: 'existing-public-pack', code: 'MY.PACK' });

    const result = await service.publishToCommunity(FAMILY_ID, INSTANCE_ID, USER_ID, {
      code: 'A-DIFFERENT-CODE',
      name: 'Retry',
    });

    expect(getPack).toHaveBeenCalledWith('existing-public-pack');
    expect(importPack).not.toHaveBeenCalled();
    expect(objectStorage.copyObject).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'existing-public-pack', code: 'MY.PACK' });
  });
});

describe('FamilyCurriculumPackService safe updates (checkUpdates and applyUpdate)', () => {
  let service: FamilyCurriculumPackService;
  let findByIdAndFamily: jest.Mock;
  let findLatestPublishedByCode: jest.Mock;
  let exportPack: jest.Mock;
  let updateWithRevision: jest.Mock;

  const UPSTREAM_PACK_ID_V2 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  const baseDoc = {
    formatVersion: '1.0.0',
    exportedAt: '2026-09-01T00:00:00.000Z',
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
    items: [
      {
        definitionType: 'CompetencyDefinition',
        code: 'COMP_1',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Comp 1 Original' },
      },
      {
        definitionType: 'SkillDefinition',
        code: 'SKILL_1',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Skill 1 Original' },
      },
    ],
  };

  const familyDoc = {
    ...baseDoc,
    items: [
      {
        definitionType: 'CompetencyDefinition',
        code: 'COMP_1',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Comp 1 Customizado pela Família' },
      },
      {
        definitionType: 'SkillDefinition',
        code: 'SKILL_1',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Skill 1 Original' },
      },
    ],
  };

  const upstreamDocV2 = {
    formatVersion: '1.0.0',
    exportedAt: '2026-09-20T00:00:00.000Z',
    pack: {
      code: 'SOURCE.PACK',
      version: 2,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      name: 'Source Pack v2',
      description: 'Updated description',
      metadata: {},
    },
    dependencies: [],
    items: [
      {
        definitionType: 'CompetencyDefinition',
        code: 'COMP_1',
        version: 2,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Comp 1 Autor v2' },
      },
      {
        definitionType: 'SkillDefinition',
        code: 'SKILL_1',
        version: 2,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Skill 1 Melhorado pelo Autor' },
      },
      {
        definitionType: 'SkillDefinition',
        code: 'SKILL_2',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Nova Skill 2 do Autor' },
      },
    ],
  };

  beforeEach(() => {
    findByIdAndFamily = jest.fn().mockResolvedValue({
      id: INSTANCE_ID,
      familyId: FAMILY_ID,
      sourcePackId: 'source-pack-id',
      sourcePackCode: 'SOURCE.PACK',
      sourcePackVersion: 1,
      revision: 1,
      document: familyDoc,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    findLatestPublishedByCode = jest.fn().mockResolvedValue({
      id: UPSTREAM_PACK_ID_V2,
      code: 'SOURCE.PACK',
      version: 2,
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
    });

    exportPack = jest.fn().mockImplementation(async (packId: string) => {
      if (packId === 'source-pack-id') return baseDoc;
      if (packId === UPSTREAM_PACK_ID_V2) return upstreamDocV2;
      throw new Error(`Unexpected packId ${packId}`);
    });

    updateWithRevision = jest.fn().mockImplementation(
      async (
        _id: string,
        _familyId: string,
        params: { sourcePackId: string; sourcePackVersion: number; document: unknown },
      ) => ({
        updated: {
          id: INSTANCE_ID,
          familyId: FAMILY_ID,
          sourcePackId: params.sourcePackId,
          sourcePackCode: 'SOURCE.PACK',
          sourcePackVersion: params.sourcePackVersion,
          revision: 2,
          document: params.document,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        previousRevision: 1,
        newRevision: 2,
      }),
    );

    const repository = {
      findByIdAndFamily,
      updateWithRevision,
    } as unknown as FamilyCurriculumPackRepository;

    const curriculumPackRepository = {
      findLatestPublishedByCode,
    } as unknown as CurriculumPackRepository;

    const exportService = { exportPack } as unknown as CurriculumPackExportService;
    const importService = {} as CurriculumPackImportService;
    const curriculumPackService = {} as CurriculumPackService;
    const familyMediaRepository = { listByFamilyCurriculumPackId: jest.fn().mockResolvedValue([]) } as unknown as FamilyCurriculumPackMediaRepository;
    const publicMediaRepository = { createCommunityMedia: jest.fn() } as unknown as CurriculumPackMediaRepository;
    const objectStorage = {
      headObject: jest.fn(),
      copyObject: jest.fn(),
      deleteObject: jest.fn(),
      buildCommunityCurriculumPackMediaStorageKey: jest.fn(),
    } as unknown as ObjectStorageService;

    service = new FamilyCurriculumPackService(
      repository,
      curriculumPackRepository,
      exportService,
      importService,
      curriculumPackService,
      familyMediaRepository,
      publicMediaRepository,
      objectStorage,
    );
  });

  describe('checkUpdates', () => {
    it('computes diff report indicating available update with additions, modifications and conflicts', async () => {
      const report = await service.checkUpdates(FAMILY_ID, INSTANCE_ID);

      expect(report.hasUpdate).toBe(true);
      expect(report.currentVersion).toBe(1);
      expect(report.latestVersion).toBe(2);
      expect(report.sourcePackCode).toBe('SOURCE.PACK');
      expect(report.summary.addedCount).toBe(1);
      expect(report.summary.updatedCount).toBe(1);
      expect(report.summary.conflictsCount).toBe(1);

      const added = report.items.find((i) => i.code === 'SKILL_2');
      expect(added?.action).toBe('ADDED_BY_AUTHOR');

      const updated = report.items.find((i) => i.code === 'SKILL_1');
      expect(updated?.action).toBe('UPDATED_BY_AUTHOR');

      const conflict = report.items.find((i) => i.code === 'COMP_1');
      expect(conflict?.action).toBe('CONFLICT_PRESERVED_FAMILY');
    });

    it('reports hasUpdate: false when the family pack is already on the latest version', async () => {
      findLatestPublishedByCode.mockResolvedValue({
        id: 'source-pack-id',
        code: 'SOURCE.PACK',
        version: 1,
        status: 'PUBLISHED',
      });

      const report = await service.checkUpdates(FAMILY_ID, INSTANCE_ID);

      expect(report.hasUpdate).toBe(false);
      expect(report.currentVersion).toBe(1);
      expect(report.latestVersion).toBe(1);
      expect(report.summary.addedCount).toBe(0);
      expect(report.summary.updatedCount).toBe(0);
    });

    it('throws NotFoundException when no published version of the pack exists upstream', async () => {
      findLatestPublishedByCode.mockResolvedValue(null);

      await expect(service.checkUpdates(FAMILY_ID, INSTANCE_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the family pack does not exist', async () => {
      findByIdAndFamily.mockResolvedValue(null);

      await expect(service.checkUpdates(FAMILY_ID, INSTANCE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyUpdate', () => {
    it('applies update preserving family customization and creating immutable revision snapshot', async () => {
      const response = await service.applyUpdate(FAMILY_ID, INSTANCE_ID, {
        notes: 'Atualização aplicada com sucesso',
      });

      expect(updateWithRevision).toHaveBeenCalledWith(
        INSTANCE_ID,
        FAMILY_ID,
        expect.objectContaining({
          sourcePackId: UPSTREAM_PACK_ID_V2,
          sourcePackVersion: 2,
          document: expect.objectContaining({
            pack: expect.objectContaining({
              version: 2,
              metadata: expect.objectContaining({
                updateNotes: 'Atualização aplicada com sucesso',
              }),
            }),
            items: expect.arrayContaining([
              // Família vence no conflito de COMP_1
              expect.objectContaining({
                code: 'COMP_1',
                content: { title: 'Comp 1 Customizado pela Família' },
              }),
              // Autor atualiza SKILL_1
              expect.objectContaining({
                code: 'SKILL_1',
                content: { title: 'Skill 1 Melhorado pelo Autor' },
              }),
              // Autor adiciona SKILL_2
              expect.objectContaining({
                code: 'SKILL_2',
                content: { title: 'Nova Skill 2 do Autor' },
              }),
            ]),
          }),
        }),
      );

      expect(response.previousRevision).toBe(1);
      expect(response.newRevision).toBe(2);
      expect(response.diffReport.hasUpdate).toBe(true);
      expect(response.updatedFamilyPack.sourcePackVersion).toBe(2);
      expect(verifyPackChecksum(response.updatedFamilyPack.document)).toBe(true);
    });

    it('rejects applyUpdate when already on the latest version', async () => {
      findLatestPublishedByCode.mockResolvedValue({
        id: 'source-pack-id',
        code: 'SOURCE.PACK',
        version: 1,
        status: 'PUBLISHED',
      });

      await expect(
        service.applyUpdate(FAMILY_ID, INSTANCE_ID, {}),
      ).rejects.toThrow(BadRequestException);
      expect(updateWithRevision).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if upstream pack is not found', async () => {
      findLatestPublishedByCode.mockResolvedValue(null);

      await expect(
        service.applyUpdate(FAMILY_ID, INSTANCE_ID, {}),
      ).rejects.toThrow(NotFoundException);
      expect(updateWithRevision).not.toHaveBeenCalled();
    });
  });
});

