import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FamilyCurriculumPackMedia } from '@prisma/client';
import {
  addFamilyCurriculumPackMediaSchema,
  familyCurriculumPackMediaResponseSchema,
  type AddFamilyCurriculumPackMediaDto,
  type FamilyCurriculumPackMediaResponseDto,
} from '@aletheia/contracts';
import { FamilyCurriculumPackMediaRepository } from '../infrastructure/family-curriculum-pack-media.repository.js';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);

@Injectable()
export class FamilyCurriculumPackMediaService {
  constructor(private readonly repository: FamilyCurriculumPackMediaRepository) {}

  async add(
    familyId: string,
    familyCurriculumPackId: string,
    dto: AddFamilyCurriculumPackMediaDto,
  ): Promise<FamilyCurriculumPackMediaResponseDto> {
    const input = addFamilyCurriculumPackMediaSchema.parse(dto);
    const provider = input.sourceType === 'EXTERNAL_URL' ? this.detectProvider(input.url, input.mediaType) : null;
    const row = await this.repository.create(familyId, familyCurriculumPackId, {
      familyCurriculumPackId,
      mediaType: input.mediaType,
      sourceType: input.sourceType,
      provider,
      title: input.title,
      description: input.description ?? null,
      url: input.url ?? null,
      storageKey: input.sourceType === 'UPLOAD' ? input.storageKey : null,
      mimeType: input.sourceType === 'UPLOAD' ? input.mimeType ?? null : null,
      sizeBytes: input.sourceType === 'UPLOAD' ? input.sizeBytes ?? null : null,
    });
    if (!row) throw new NotFoundException('Family curriculum pack not found.');
    return this.toDto(row);
  }

  async list(
    familyId: string,
    familyCurriculumPackId: string,
  ): Promise<FamilyCurriculumPackMediaResponseDto[]> {
    const rows = await this.repository.list(familyId, familyCurriculumPackId);
    if (!rows) throw new NotFoundException('Family curriculum pack not found.');
    return rows.map((row) => this.toDto(row));
  }

  async remove(familyId: string, familyCurriculumPackId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(familyId, familyCurriculumPackId, id);
    if (!deleted) throw new NotFoundException('Family curriculum pack media not found.');
  }

  private detectProvider(url: string, mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT'): string {
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      throw new BadRequestException('Media URL is invalid.');
    }

    if (YOUTUBE_HOSTS.has(hostname)) {
      if (mediaType !== 'VIDEO') {
        throw new BadRequestException('YouTube URLs can only be attached as videos.');
      }
      return 'YOUTUBE';
    }
    return 'OTHER';
  }

  private toDto(row: FamilyCurriculumPackMedia): FamilyCurriculumPackMediaResponseDto {
    return familyCurriculumPackMediaResponseSchema.parse({
      id: row.id,
      familyCurriculumPackId: row.familyCurriculumPackId,
      mediaType: row.mediaType,
      sourceType: row.sourceType,
      provider: row.provider,
      title: row.title,
      description: row.description,
      url: row.url,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
