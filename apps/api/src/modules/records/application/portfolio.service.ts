import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioRepository } from '../infrastructure/portfolio.repository.js';
import { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';
import { AV_SCANNER, type AvScanner } from '../../../platform/storage/av-scanner.js';
import type {
  CreatePortfolioItemDto,
  PortfolioDownloadUrlResponseDto,
  PortfolioItemFilterDto,
  PortfolioItemResponseDto,
  PortfolioUploadUrlResponseDto,
  RequestPortfolioUploadDto,
  UpdatePortfolioItemDto,
} from '@aletheia/contracts';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepo: PortfolioRepository,
    private readonly objectStorage: ObjectStorageService,
    @Inject(AV_SCANNER) private readonly avScanner: AvScanner,
  ) {}

  async createItem(familyId: string, dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.create(familyId, dto);
    return item.toResponseDto();
  }

  async getItem(familyId: string, id: string): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item.toResponseDto();
  }

  async listItems(
    familyId: string,
    filter: PortfolioItemFilterDto = {},
  ): Promise<PortfolioItemResponseDto[]> {
    const items = await this.portfolioRepo.list(familyId, filter);
    return items.map((i) => i.toResponseDto());
  }

  async updateItem(
    familyId: string,
    id: string,
    dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    const updated = await this.portfolioRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Portfolio item not found');
    }
    return updated.toResponseDto();
  }

  async deleteItem(familyId: string, id: string): Promise<boolean> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    if (item.storageKey) {
      await this.objectStorage.deleteObject(item.storageKey);
    }

    await this.portfolioRepo.softDelete(familyId, id);
    return true;
  }

  async requestUpload(
    familyId: string,
    id: string,
    dto: RequestPortfolioUploadDto,
  ): Promise<PortfolioUploadUrlResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    const storageKey = this.objectStorage.buildStorageKey(familyId, id, dto.fileName);
    const saved = await this.portfolioRepo.savePendingUpload(familyId, id, storageKey);
    if (!saved) {
      throw new NotFoundException('Portfolio item not found');
    }

    const { uploadUrl, expiresAt } = await this.objectStorage.getPresignedUploadUrl(
      storageKey,
      dto.mimeType,
    );

    return { uploadUrl, storageKey, expiresAt: expiresAt.toISOString() };
  }

  async confirmUpload(familyId: string, id: string): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    if (!item.storageKey) {
      throw new BadRequestException('No pending upload for this portfolio item.');
    }

    // Never trust client-reported metadata — verify the object actually
    // landed in storage and read its real content-type/size.
    const metadata = await this.objectStorage.headObject(item.storageKey);
    if (!metadata || metadata.contentLength === undefined) {
      throw new BadRequestException('Upload has not completed yet.');
    }

    const scanResult = await this.avScanner.scan(item.storageKey);
    if (!scanResult.clean) {
      await this.objectStorage.deleteObject(item.storageKey);
      throw new BadRequestException('Uploaded file failed the security scan.');
    }

    const checksumSha256 = await this.objectStorage.computeChecksumSha256(item.storageKey);
    const updated = await this.portfolioRepo.confirmUpload(familyId, id, {
      mimeType: metadata.contentType ?? 'application/octet-stream',
      fileSizeBytes: metadata.contentLength,
      checksumSha256,
    });
    if (!updated) {
      throw new NotFoundException('Portfolio item not found');
    }

    return updated.toResponseDto();
  }

  async getDownloadUrl(familyId: string, id: string): Promise<PortfolioDownloadUrlResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item || !item.storageKey) {
      throw new NotFoundException('Portfolio item not found');
    }

    const { downloadUrl, expiresAt } = await this.objectStorage.getPresignedDownloadUrl(
      item.storageKey,
    );
    return { downloadUrl, expiresAt: expiresAt.toISOString() };
  }
}
