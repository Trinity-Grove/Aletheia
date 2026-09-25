import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PortfolioRepository } from '../infrastructure/portfolio.repository.js';
import { ObjectStorageService } from '../../../platform/storage/object-storage.service.js';
import { AV_SCANNER, type AvScanner } from '../../../platform/storage/av-scanner.js';
import {
  EVIDENCE_SUBMISSION_PUBLIC_API,
  type EvidenceSubmissionPublicApi,
} from '../../curriculum/application/public-api.js';
import { PRIVACY_PUBLIC_API, type PrivacyPublicApi } from '../../privacy/application/public-api.js';
import { mapEvidenceTypeCodeToLegacyType } from './evidence-type-code.mapper.js';
import type {
  CreatePortfolioItemDto,
  CreatePortfolioItemFromEvidenceSubmissionOutput,
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
    @Inject(EVIDENCE_SUBMISSION_PUBLIC_API)
    private readonly evidenceSubmissionApi: EvidenceSubmissionPublicApi,
    @Inject(PRIVACY_PUBLIC_API)
    private readonly privacyPublicApi: PrivacyPublicApi,
  ) {}

  async createItem(familyId: string, dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.create(familyId, dto);
    return item.toResponseDto();
  }

  // Issue #230: promotes a validated EvidenceSubmission (the
  // ActivityDefinition/ProjectDefinition-catalog evidence system) into
  // this family's portfolio -- an explicit action, never an automatic
  // trigger on validation, matching this codebase's "no implicit writes"
  // discipline for the Definition/Version catalog.
  async createItemFromEvidenceSubmission(
    familyId: string,
    evidenceSubmissionId: string,
    dto: CreatePortfolioItemFromEvidenceSubmissionOutput,
  ): Promise<PortfolioItemResponseDto> {
    const source = await this.evidenceSubmissionApi.getEvidenceSubmissionForPortfolio(
      familyId,
      evidenceSubmissionId,
    );
    if (!source) {
      throw new NotFoundException('Evidence submission not found.');
    }
    if (source.validationStatus !== 'VALIDATED') {
      throw new BadRequestException('Only a validated evidence submission can be added to the portfolio.');
    }

    let item;
    try {
      item = await this.portfolioRepo.createFromEvidenceSubmission(familyId, {
        learnerId: source.learnerId,
        evidenceSubmissionId: source.id,
        type: mapEvidenceTypeCodeToLegacyType(source.evidenceTypeCode),
        title: dto.title,
        description: dto.description ?? null,
        academicYearId: dto.academicYearId ?? null,
        subjectId: dto.subjectId ?? null,
        fileUrl: source.fileUrl,
        textContent: source.textContent,
        mimeType: source.mimeType,
        fileSizeBytes: source.fileSizeBytes,
        checksumSha256: source.checksumSha256,
        capturedAt: source.createdAt.slice(0, 10),
        isHighlight: dto.isHighlight,
        tags: dto.tags,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This evidence submission has already been added to the portfolio.');
      }
      throw error;
    }

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

  async deleteItem(familyId: string, id: string, actorUserId: string): Promise<boolean> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    if (item.storageKey) {
      await this.objectStorage.deleteObject(item.storageKey);
    }

    await this.portfolioRepo.softDelete(familyId, id);

    await this.privacyPublicApi.recordSensitiveDataAccess({
      actorUserId,
      familyId,
      learnerId: item.learnerId,
      action: 'DELETE',
      resourceType: 'PORTFOLIO_ITEM',
      resourceId: id,
    });

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

  async getDownloadUrl(
    familyId: string,
    id: string,
    actorUserId: string,
  ): Promise<PortfolioDownloadUrlResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item || !item.storageKey) {
      throw new NotFoundException('Portfolio item not found');
    }

    const { downloadUrl, expiresAt } = await this.objectStorage.getPresignedDownloadUrl(
      item.storageKey,
    );

    await this.privacyPublicApi.recordSensitiveDataAccess({
      actorUserId,
      familyId,
      learnerId: item.learnerId,
      action: 'READ',
      resourceType: 'PORTFOLIO_ITEM',
      resourceId: id,
    });

    return { downloadUrl, expiresAt: expiresAt.toISOString() };
  }
}
