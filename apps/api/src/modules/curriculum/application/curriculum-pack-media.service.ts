import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurriculumPackMedia } from '@prisma/client';
import {
  curriculumPackMediaResponseSchema,
  type CurriculumPackMediaResponseDto,
} from '@aletheia/contracts';
import { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { CurriculumPackMediaRepository } from '../infrastructure/curriculum-pack-media.repository.js';

@Injectable()
export class CurriculumPackMediaService {
  constructor(
    private readonly mediaRepository: CurriculumPackMediaRepository,
    private readonly packRepository: CurriculumPackRepository,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  async listPublic(packId: string): Promise<CurriculumPackMediaResponseDto[]> {
    const pack = await this.packRepository.findPackById(packId);
    if (!pack || pack.status !== 'PUBLISHED' || pack.moderationStatus !== 'APPROVED') {
      throw new NotFoundException('Curriculum pack not found.');
    }

    const rows = await this.mediaRepository.listPublicMedia(packId);
    return Promise.all(rows.map((row) => this.toDto(row)));
  }

  private async toDto(row: CurriculumPackMedia): Promise<CurriculumPackMediaResponseDto> {
    let url = row.url;
    if (row.sourceType === 'UPLOAD') {
      if (!row.storageKey || row.storageKey.startsWith('families/')) {
        throw new BadRequestException('Public media has an invalid storage namespace.');
      }
      url = (await this.objectStorage.getPresignedDownloadUrl(row.storageKey)).downloadUrl;
    }

    return curriculumPackMediaResponseSchema.parse({
      id: row.id,
      curriculumPackId: row.curriculumPackId,
      mediaType: row.mediaType,
      sourceType: row.sourceType,
      provider: row.provider,
      title: row.title,
      description: row.description,
      url,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
