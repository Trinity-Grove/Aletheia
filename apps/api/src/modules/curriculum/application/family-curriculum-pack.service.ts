import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type CurriculumPack,
  type FamilyCurriculumPack,
  type FamilyCurriculumPackMedia,
  type FamilyCurriculumPackRevision,
} from '@prisma/client';
import {
  ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES,
  FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES,
  curriculumPackExportDocumentSchema,
  type ApplyPackUpdateDto,
  type ApplyPackUpdateResponseDto,
  type CurriculumPackExportDocument,
  type CurriculumPackResponseDto,
  type DefinitionStatus,
  type FamilyCurriculumPackResponseDto,
  type FamilyCurriculumPackRevisionResponseDto,
  type InstallFamilyCurriculumPackDto,
  type PackDiffReport,
  type PublishFamilyCurriculumPackToCommunityOutput,
  type UpdateFamilyCurriculumPackDto,
} from '@aletheia/contracts';
import { calculatePackChecksum } from '../domain/pack-checksum.js';
import { PackMergeEngine } from '../domain/pack-merge-engine.js';
import { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import { CurriculumPackImportService } from './curriculum-pack-import.service.js';
import { CurriculumPackService } from './curriculum-pack.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { FamilyCurriculumPackRepository } from '../infrastructure/family-curriculum-pack.repository.js';
import { FamilyCurriculumPackMediaRepository } from '../infrastructure/family-curriculum-pack-media.repository.js';
import { CurriculumPackMediaRepository } from '../infrastructure/curriculum-pack-media.repository.js';
import { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';

@Injectable()
export class FamilyCurriculumPackService {
  constructor(
    private readonly repository: FamilyCurriculumPackRepository,
    private readonly curriculumPackRepository: CurriculumPackRepository,
    private readonly exportService: CurriculumPackExportService,
    private readonly importService: CurriculumPackImportService,
    private readonly curriculumPackService: CurriculumPackService,
    private readonly familyMediaRepository: FamilyCurriculumPackMediaRepository,
    private readonly publicMediaRepository: CurriculumPackMediaRepository,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  async install(
    familyId: string,
    dto: InstallFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    const source = await this.curriculumPackRepository.findPackById(dto.sourcePackId);
    if (!source) throw new NotFoundException('Curriculum pack not found.');
    if (source.status !== 'PUBLISHED') {
      throw new BadRequestException('Only published curriculum packs can be installed by a family.');
    }

    const document = await this.exportService.exportPack(source.id);
    try {
      const row = await this.repository.createInstance(
        familyId,
        source.id,
        source.code,
        source.version,
        document,
      );
      return this.toDto(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This curriculum pack is already installed for the family.');
      }
      throw error;
    }
  }

  async list(familyId: string): Promise<FamilyCurriculumPackResponseDto[]> {
    const rows = await this.repository.listByFamily(familyId);
    return rows.map((row) => this.toDto(row));
  }

  async listAvailable(): Promise<CurriculumPackResponseDto[]> {
    const rows = await this.curriculumPackRepository.listPublishedPacks();
    return rows.map((row) => this.toAvailablePackDto(row));
  }

  async get(familyId: string, id: string): Promise<FamilyCurriculumPackResponseDto> {
    const row = await this.requireInstance(familyId, id);
    return this.toDto(row);
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdateFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    const current = await this.requireInstance(familyId, id);
    const document = this.parseDocument(dto.document);
    if (
      document.pack.code !== current.sourcePackCode ||
      document.pack.version !== current.sourcePackVersion
    ) {
      throw new BadRequestException('A family pack revision cannot change its source pack identity.');
    }

    const updated = await this.repository.updateDocument(id, familyId, document);
    if (!updated) throw new NotFoundException('Family curriculum pack not found.');
    return this.toDto(updated);
  }

  async revisions(familyId: string, id: string): Promise<FamilyCurriculumPackRevisionResponseDto[]> {
    await this.requireInstance(familyId, id);
    const rows = await this.repository.listRevisions(id);
    return rows.map((row) => this.toRevisionDto(row));
  }

  async checkUpdates(familyId: string, id: string): Promise<PackDiffReport> {
    const familyPack = await this.requireInstance(familyId, id);
    const latestPack = await this.curriculumPackRepository.findLatestPublishedByCode(
      familyPack.sourcePackCode,
    );

    if (!latestPack) {
      throw new NotFoundException(
        `No published version found for curriculum pack code "${familyPack.sourcePackCode}".`,
      );
    }

    const baseDoc = await this.exportService.exportPack(familyPack.sourcePackId);
    const familyDoc = this.parseDocument(familyPack.document as CurriculumPackExportDocument);
    const upstreamDoc =
      latestPack.id === familyPack.sourcePackId
        ? baseDoc
        : await this.exportService.exportPack(latestPack.id);

    return PackMergeEngine.computeDiff(baseDoc, familyDoc, upstreamDoc);
  }

  async applyUpdate(
    familyId: string,
    id: string,
    dto: ApplyPackUpdateDto = {},
  ): Promise<ApplyPackUpdateResponseDto> {
    const familyPack = await this.requireInstance(familyId, id);
    const latestPack = await this.curriculumPackRepository.findLatestPublishedByCode(
      familyPack.sourcePackCode,
    );

    if (!latestPack) {
      throw new NotFoundException(
        `No published version found for curriculum pack code "${familyPack.sourcePackCode}".`,
      );
    }

    if (latestPack.version <= familyPack.sourcePackVersion) {
      throw new BadRequestException('Curriculum pack is already at the latest version.');
    }

    const baseDoc = await this.exportService.exportPack(familyPack.sourcePackId);
    const familyDoc = this.parseDocument(familyPack.document as CurriculumPackExportDocument);
    const upstreamDoc = await this.exportService.exportPack(latestPack.id);

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    if (dto.notes) {
      mergedDocument.pack.metadata = {
        ...(mergedDocument.pack.metadata || {}),
        updateNotes: dto.notes,
      };
      mergedDocument.checksumSha256 = calculatePackChecksum(mergedDocument);
    }

    const result = await this.repository.updateWithRevision(id, familyId, {
      sourcePackId: latestPack.id,
      sourcePackVersion: latestPack.version,
      document: mergedDocument,
    });

    if (!result) {
      throw new NotFoundException('Family curriculum pack not found.');
    }

    return {
      updatedFamilyPack: this.toDto(result.updated),
      diffReport,
      previousRevision: result.previousRevision,
      newRevision: result.newRevision,
    };
  }

  // Publish the family's customized copy as a new, distinct community
  // submission (issue #244) -- a derivative work, not a mutation of the
  // pack it was installed from, so it always needs its own code/version.
  // Reuses CurriculumPackImportService.importPack, which already knows
  // how to turn a CurriculumPackExportDocument into real CurriculumPack/
  // CurriculumPackItem rows against the shared catalog -- the family's
  // document already IS that shape (see install() above).
  async publishToCommunity(
    familyId: string,
    id: string,
    userId: string,
    dto: PublishFamilyCurriculumPackToCommunityOutput,
  ): Promise<CurriculumPackResponseDto> {
    const instance = await this.requireInstance(familyId, id);

    const existingOrigin = await this.curriculumPackRepository.findPackByOriginFamilyPackId(instance.id);
    if (existingOrigin) return this.curriculumPackService.getPack(existingOrigin.id);

    const alreadyExists = await this.curriculumPackRepository.findPackByCodeVersion(dto.code, 1);
    if (alreadyExists) {
      throw new BadRequestException(
        `A curriculum pack with code "${dto.code}" already exists. Choose a different code.`,
      );
    }

    const sourceDocument = this.parseDocument(instance.document as CurriculumPackExportDocument);
    const newDocument: CurriculumPackExportDocument = {
      ...sourceDocument,
      exportedAt: new Date().toISOString(),
      pack: {
        ...sourceDocument.pack,
        code: dto.code,
        version: 1,
        status: 'DRAFT',
        name: dto.name,
        description: dto.description ?? sourceDocument.pack.description ?? null,
      },
    };
    newDocument.checksumSha256 = calculatePackChecksum(newDocument);

    const copiedKeys: string[] = [];
    let created: { id: string } | null = null;
    try {
      const publicMedia = await this.prepareCommunityMedia(instance.id, copiedKeys);
      await this.importService.importPack(newDocument, false, userId, {
        originFamilyCurriculumPackId: instance.id,
      });

      created = await this.curriculumPackRepository.findPackByCodeVersion(dto.code, 1);
      if (!created) throw new BadRequestException('Failed to create the community curriculum pack.');

      await this.publicMediaRepository.createCommunityMedia(created.id, publicMedia);
      return this.curriculumPackService.getPack(created.id);
    } catch (error) {
      await Promise.allSettled(copiedKeys.map((key) => this.objectStorage.deleteObject(key)));
      if (created) await this.curriculumPackRepository.deletePack(created.id).catch(() => undefined);
      throw error;
    }
  }

  private async prepareCommunityMedia(
    familyCurriculumPackId: string,
    copiedKeys: string[],
  ): Promise<Array<Omit<Prisma.CurriculumPackMediaUncheckedCreateInput, 'curriculumPackId'>>> {
    const sourceMedia = await this.familyMediaRepository.listByFamilyCurriculumPackId(familyCurriculumPackId);
    const result: Array<Omit<Prisma.CurriculumPackMediaUncheckedCreateInput, 'curriculumPackId'>> = [];

    for (const media of sourceMedia) {
      if (media.sourceType === 'EXTERNAL_URL') {
        let isHttps = false;
        try {
          isHttps = Boolean(media.url && new URL(media.url).protocol === 'https:');
        } catch {
          isHttps = false;
        }
        if (!isHttps) {
          throw new BadRequestException('Community media URLs must use HTTPS.');
        }
        result.push({
          sourceFamilyMediaId: media.id,
          mediaType: media.mediaType,
          sourceType: media.sourceType,
          provider: media.provider,
          title: media.title,
          description: media.description,
          url: media.url,
          storageKey: null,
          mimeType: null,
          sizeBytes: null,
        });
        continue;
      }

      const storageKey = this.validateUploadMetadata(media);
      const metadata = await this.objectStorage.headObject(storageKey);
      if (!metadata || metadata.contentLength === undefined || !metadata.contentType) {
        throw new BadRequestException('Uploaded community media is not available.');
      }
      this.validateMimeAndSize(media.mediaType, metadata.contentType, metadata.contentLength);

      const publicKey = this.objectStorage.buildCommunityCurriculumPackMediaStorageKey(media.id, media.title);
      copiedKeys.push(publicKey);
      await this.objectStorage.copyObject(storageKey, publicKey, metadata.contentType);
      result.push({
        sourceFamilyMediaId: media.id,
        mediaType: media.mediaType,
        sourceType: media.sourceType,
        provider: media.provider,
        title: media.title,
        description: media.description,
        url: null,
        storageKey: publicKey,
        mimeType: metadata.contentType,
        sizeBytes: metadata.contentLength,
      });
    }

    return result;
  }

  private validateUploadMetadata(media: FamilyCurriculumPackMedia): string {
    if (!media.storageKey || !media.mimeType || media.sizeBytes === null) {
      throw new BadRequestException('Only confirmed uploads can be published.');
    }
    this.validateMimeAndSize(media.mediaType, media.mimeType, media.sizeBytes);
    return media.storageKey;
  }

  private validateMimeAndSize(mediaType: string, mimeType: string, sizeBytes: number): void {
    if (!(ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException('Uploaded file type is not allowed.');
    }
    if (sizeBytes > FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Uploaded file is too large.');
    }
    const matches =
      (mediaType === 'IMAGE' && mimeType.startsWith('image/')) ||
      (mediaType === 'VIDEO' && mimeType.startsWith('video/')) ||
      (mediaType === 'DOCUMENT' && mimeType === 'application/pdf');
    if (!matches) throw new BadRequestException('MIME type does not match the media type.');
  }

  private async requireInstance(familyId: string, id: string): Promise<FamilyCurriculumPack> {
    const row = await this.repository.findByIdAndFamily(id, familyId);
    if (!row) throw new NotFoundException('Family curriculum pack not found.');
    return row;
  }

  private parseDocument(document: CurriculumPackExportDocument): CurriculumPackExportDocument {
    return curriculumPackExportDocumentSchema.parse(document);
  }

  private toDto(row: FamilyCurriculumPack): FamilyCurriculumPackResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      sourcePackId: row.sourcePackId,
      sourcePackCode: row.sourcePackCode,
      sourcePackVersion: row.sourcePackVersion,
      revision: row.revision,
      document: this.parseDocument(row.document as CurriculumPackExportDocument),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRevisionDto(row: FamilyCurriculumPackRevision): FamilyCurriculumPackRevisionResponseDto {
    return {
      id: row.id,
      familyCurriculumPackId: row.familyCurriculumPackId,
      revision: row.revision,
      document: this.parseDocument(row.document as CurriculumPackExportDocument),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toAvailablePackDto(row: CurriculumPack): CurriculumPackResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }
}
