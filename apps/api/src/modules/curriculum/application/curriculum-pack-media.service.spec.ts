import { NotFoundException } from '@nestjs/common';
import { CurriculumPackMediaService } from './curriculum-pack-media.service.js';

describe('CurriculumPackMediaService', () => {
  const publicPack = { id: '00000000-0000-4000-8000-000000000001', status: 'PUBLISHED', moderationStatus: 'APPROVED' };

  it('returns external links and signed URLs for approved public media', async () => {
    const mediaRepository = {
      listPublicMedia: jest.fn().mockResolvedValue([
        {
          id: '00000000-0000-4000-8000-000000000002',
          curriculumPackId: publicPack.id,
          mediaType: 'VIDEO',
          sourceType: 'EXTERNAL_URL',
          provider: 'YOUTUBE',
          title: 'Video',
          description: null,
          url: 'https://www.youtube.com/watch?v=123',
          storageKey: null,
          mimeType: null,
          sizeBytes: null,
          createdAt: new Date('2026-10-15T00:00:00Z'),
          updatedAt: new Date('2026-10-15T00:00:00Z'),
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          curriculumPackId: publicPack.id,
          mediaType: 'DOCUMENT',
          sourceType: 'UPLOAD',
          provider: null,
          title: 'PDF',
          description: null,
          url: null,
          storageKey: 'community/curriculum-media/hash/file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 200,
          createdAt: new Date('2026-10-15T00:00:00Z'),
          updatedAt: new Date('2026-10-15T00:00:00Z'),
        },
      ]),
    };
    const packRepository = { findPackById: jest.fn().mockResolvedValue(publicPack) };
    const objectStorage = {
      getPresignedDownloadUrl: jest.fn().mockResolvedValue({
        downloadUrl: 'https://storage.example/community-file',
        expiresAt: new Date('2026-10-15T00:05:00Z'),
      }),
    };
    const service = new CurriculumPackMediaService(
      mediaRepository as never,
      packRepository as never,
      objectStorage as never,
    );

    const result = await service.listPublic(publicPack.id);

    expect(result[0]?.url).toBe('https://www.youtube.com/watch?v=123');
    expect(result[1]?.url).toBe('https://storage.example/community-file');
    expect(objectStorage.getPresignedDownloadUrl).toHaveBeenCalledWith(
      'community/curriculum-media/hash/file.pdf',
    );
    expect('storageKey' in (result[1] ?? {})).toBe(false);
  });

  it('does not expose media for drafts or unapproved packs', async () => {
    const mediaRepository = { listPublicMedia: jest.fn() };
    const packRepository = {
      findPackById: jest.fn().mockResolvedValue({ ...publicPack, status: 'DRAFT', moderationStatus: 'PENDING_REVIEW' }),
    };
    const service = new CurriculumPackMediaService(mediaRepository as never, packRepository as never, {} as never);

    await expect(service.listPublic(publicPack.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(mediaRepository.listPublicMedia).not.toHaveBeenCalled();
  });
});
