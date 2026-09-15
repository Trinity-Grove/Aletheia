import { BadRequestException } from '@nestjs/common';
import { FamilyCurriculumPackMediaService } from './family-curriculum-pack-media.service.js';

describe('FamilyCurriculumPackMediaService upload flow', () => {
  const mediaRow = {
    id: '00000000-0000-4000-8000-000000000001',
    familyCurriculumPackId: '00000000-0000-4000-8000-000000000002',
    mediaType: 'IMAGE',
    sourceType: 'UPLOAD',
    provider: null,
    title: 'Drawing',
    description: null,
    url: null,
    storageKey: 'families/family/curriculum-packs/pack/drawing.png',
    mimeType: 'image/png',
    sizeBytes: null,
    createdAt: new Date('2026-09-15T12:00:00Z'),
    updatedAt: new Date('2026-09-15T12:00:00Z'),
  } as const;

  it('creates a pending media row and returns a presigned upload URL', async () => {
    const repository = {
      createPendingUpload: jest.fn().mockResolvedValue(mediaRow),
    };
    const objectStorage = {
      buildStorageKey: jest.fn().mockReturnValue(mediaRow.storageKey),
      getPresignedUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://storage.example/upload',
        expiresAt: new Date('2026-09-15T12:05:00Z'),
      }),
    };
    const service = new FamilyCurriculumPackMediaService(repository as never, objectStorage as never);

    const result = await service.requestUpload('00000000-0000-4000-8000-000000000003', mediaRow.familyCurriculumPackId, {
      mediaType: 'IMAGE',
      title: 'Drawing',
      fileName: 'drawing.png',
      mimeType: 'image/png',
      fileSizeBytes: 4096,
    });

    expect(result.mediaId).toBe(mediaRow.id);
    expect(result.uploadUrl).toBe('https://storage.example/upload');
    expect(objectStorage.getPresignedUploadUrl).toHaveBeenCalledWith(mediaRow.storageKey, 'image/png');
  });

  it('rejects a completed upload whose actual MIME type does not match its media type', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(mediaRow),
    };
    const objectStorage = {
      headObject: jest.fn().mockResolvedValue({ contentType: 'application/pdf', contentLength: 100 }),
      deleteObject: jest.fn(),
    };
    const service = new FamilyCurriculumPackMediaService(repository as never, objectStorage as never);

    await expect(
      service.confirmUpload('family', mediaRow.familyCurriculumPackId, mediaRow.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
