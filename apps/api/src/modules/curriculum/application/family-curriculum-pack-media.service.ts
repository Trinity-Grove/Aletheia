import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FamilyCurriculumPackMedia } from '@prisma/client';
import {
  ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES,
  FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES,
  addFamilyCurriculumPackMediaSchema,
  familyCurriculumPackMediaResponseSchema,
  familyCurriculumPackMediaUploadUrlResponseSchema,
  requestFamilyCurriculumPackMediaUploadSchema,
  type AddFamilyCurriculumPackMediaDto,
  type FamilyCurriculumPackMediaResponseDto,
  type FamilyCurriculumPackMediaUploadUrlResponseDto,
  type RequestFamilyCurriculumPackMediaUploadDto,
} from '@aletheia/contracts';
import { FamilyCurriculumPackMediaRepository } from '../infrastructure/family-curriculum-pack-media.repository.js';
import { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);

@Injectable()
export class FamilyCurriculumPackMediaService {
  constructor(
    private readonly repository: FamilyCurriculumPackMediaRepository,
    private readonly objectStorage: ObjectStorageService,
  ) {}

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

  async requestUpload(
    familyId: string,
    familyCurriculumPackId: string,
    dto: RequestFamilyCurriculumPackMediaUploadDto,
  ): Promise<FamilyCurriculumPackMediaUploadUrlResponseDto> {
    const input = requestFamilyCurriculumPackMediaUploadSchema.parse(dto);
    this.ensureMimeTypeMatchesMediaType(input.mimeType, input.mediaType);
    const storageKey = this.objectStorage.buildStorageKey(
      familyId,
      familyCurriculumPackId,
      input.fileName,
      'curriculum-packs',
    );
    const row = await this.repository.createPendingUpload(familyId, familyCurriculumPackId, {
      familyCurriculumPackId,
      mediaType: input.mediaType,
      sourceType: 'UPLOAD',
      provider: null,
      title: input.title,
      description: input.description ?? null,
      url: null,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: null,
    });
    if (!row) throw new NotFoundException('Family curriculum pack not found.');

    const { uploadUrl, expiresAt } = await this.objectStorage.getPresignedUploadUrl(
      storageKey,
      input.mimeType,
    );
    return familyCurriculumPackMediaUploadUrlResponseSchema.parse({
      mediaId: row.id,
      uploadUrl,
      storageKey,
      expiresAt: expiresAt.toISOString(),
    });
  }

  async confirmUpload(
    familyId: string,
    familyCurriculumPackId: string,
    id: string,
  ): Promise<FamilyCurriculumPackMediaResponseDto> {
    const row = await this.repository.findById(familyId, familyCurriculumPackId, id);
    if (!row) throw new NotFoundException('Family curriculum pack media not found.');
    if (!row.storageKey) throw new BadRequestException('No pending upload for this media item.');

    const metadata = await this.objectStorage.headObject(row.storageKey);
    if (!metadata || metadata.contentLength === undefined) {
      throw new BadRequestException('Upload has not completed yet.');
    }
    const contentType = metadata.contentType ?? row.mimeType ?? 'application/octet-stream';
    if (!(ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES as readonly string[]).includes(contentType)) {
      await this.objectStorage.deleteObject(row.storageKey);
      throw new BadRequestException('Uploaded file type is not allowed.');
    }
    if (metadata.contentLength > FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES) {
      await this.objectStorage.deleteObject(row.storageKey);
      throw new BadRequestException('Uploaded file is too large.');
    }
    try {
      this.ensureMimeTypeMatchesMediaType(contentType, row.mediaType);
    } catch (error) {
      await this.objectStorage.deleteObject(row.storageKey);
      throw error;
    }

    const updated = await this.repository.confirmUpload(familyId, familyCurriculumPackId, id, {
      mimeType: contentType,
      sizeBytes: metadata.contentLength,
    });
    if (!updated) throw new NotFoundException('Family curriculum pack media not found.');
    return this.toDto(updated);
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

  private ensureMimeTypeMatchesMediaType(
    mimeType: string,
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT',
  ): void {
    const matches =
      (mediaType === 'IMAGE' && mimeType.startsWith('image/')) ||
      (mediaType === 'VIDEO' && mimeType.startsWith('video/')) ||
      (mediaType === 'DOCUMENT' && mimeType === 'application/pdf');
    if (!matches) throw new BadRequestException('MIME type does not match the media type.');
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
