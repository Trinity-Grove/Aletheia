import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import { verifyPackChecksum } from '../domain/pack-checksum.js';

describe('CurriculumPackExportService', () => {
  let service: CurriculumPackExportService;
  let mockPrisma: any;
  let mockPackRepo: any;

  beforeEach(() => {
    mockPrisma = {};
    mockPackRepo = {
      findPackById: jest.fn(),
      listItems: jest.fn(),
      listDependencies: jest.fn(),
    };
    service = new CurriculumPackExportService(mockPrisma, mockPackRepo);
  });

  it('exports a published pack with a valid checksumSha256 satisfying verifyPackChecksum', async () => {
    const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const mockPack = {
      id: packId,
      code: 'TRIVIUM_LOGIC',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      name: 'Trivium Logic Pack',
      description: 'Introductory classical logic for trivium students.',
      metadata: { targetStage: 'Dialectic' },
    };

    mockPackRepo.findPackById.mockResolvedValue(mockPack);
    mockPackRepo.listItems.mockResolvedValue([]);
    mockPackRepo.listDependencies.mockResolvedValue([
      { dependsOnCode: 'TRIVIUM_GRAMMAR', dependsOnVersion: 1 },
    ]);

    const result = await service.exportPack(packId);

    expect(result.pack.code).toBe('TRIVIUM_LOGIC');
    expect(result.pack.status).toBe('PUBLISHED');
    expect(result.dependencies).toEqual([
      { dependsOnCode: 'TRIVIUM_GRAMMAR', dependsOnVersion: 1 },
    ]);
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyPackChecksum(result)).toBe(true);
  });

  it('throws NotFoundException when pack does not exist', async () => {
    mockPackRepo.findPackById.mockResolvedValue(null);

    await expect(service.exportPack('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when pack is not PUBLISHED and allowDraft is false or omitted', async () => {
    const draftPack = {
      id: 'draft-id',
      code: 'DRAFT_PACK',
      version: 1,
      status: 'DRAFT',
      schemaVersion: '1.0.0',
      name: 'Draft Pack',
      description: null,
      metadata: {},
    };
    mockPackRepo.findPackById.mockResolvedValue(draftPack);

    await expect(service.exportPack('draft-id')).rejects.toThrow(BadRequestException);
    await expect(service.exportPack('draft-id')).rejects.toThrow('Only a PUBLISHED pack can be exported.');
    await expect(service.exportPack('draft-id', { allowDraft: false })).rejects.toThrow(
      'Only a PUBLISHED pack can be exported.',
    );
  });

  it('allows exporting a DRAFT pack when allowDraft option is true', async () => {
    const draftPack = {
      id: 'draft-id',
      code: 'DRAFT_PACK',
      version: 1,
      status: 'DRAFT',
      schemaVersion: '1.0.0',
      name: 'Draft Pack',
      description: 'Draft description',
      metadata: {},
    };
    mockPackRepo.findPackById.mockResolvedValue(draftPack);
    mockPackRepo.listItems.mockResolvedValue([]);
    mockPackRepo.listDependencies.mockResolvedValue([]);

    const result = await service.exportPack('draft-id', { allowDraft: true });
    expect(result.pack.code).toBe('DRAFT_PACK');
    expect(result.pack.status).toBe('DRAFT');
    expect(verifyPackChecksum(result)).toBe(true);
  });
});
