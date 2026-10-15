import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { canAccessPortfolio, type PortfolioPermissionAction } from '@aletheia/contracts';
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
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../../families/application/public-api.js';

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
    @Inject(FAMILY_PUBLIC_API)
    private readonly familyApi: FamilyPublicApi,
  ) {}

  async createItem(
    familyId: string,
    dto: CreatePortfolioItemDto,
    actorUserId: string,
  ): Promise<PortfolioItemResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'create_portfolio_items');
    await this.ensureContext(familyId, dto);
    const item = await this.portfolioRepo.create(familyId, dto);
    await this.recordPortfolioAudit(actorUserId, familyId, item.learnerId, 'CREATE', item.id);
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
    actorUserId: string,
  ): Promise<PortfolioItemResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'create_portfolio_items');
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

    await this.ensureContext(familyId, {
      learnerId: source.learnerId,
      academicYearId: dto.academicYearId ?? null,
      subjectId: dto.subjectId ?? null,
    });

    let promotedStorageKey: string | null = null;
    if (source.storageKey) {
      if (!source.storageKey.startsWith(`families/${familyId}/`)) {
        throw new BadRequestException('Evidence media does not belong to this family.');
      }
      const fileName = source.storageKey.split('/').pop() || 'evidence-media';
      promotedStorageKey = this.objectStorage.buildStorageKey(
        familyId,
        evidenceSubmissionId,
        fileName,
        'portfolio-promoted',
      );
      await this.objectStorage.copyObject(source.storageKey, promotedStorageKey, source.mimeType ?? undefined);
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
        storageKey: promotedStorageKey,
        textContent: source.textContent,
        mimeType: source.mimeType,
        fileSizeBytes: source.fileSizeBytes,
        checksumSha256: source.checksumSha256,
        capturedAt: source.createdAt.slice(0, 10),
        isHighlight: dto.isHighlight,
        tags: dto.tags,
      });
    } catch (error) {
      if (promotedStorageKey) {
        await this.objectStorage.deleteObject(promotedStorageKey).catch(() => undefined);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This evidence submission has already been added to the portfolio.');
      }
      throw error;
    }

    await this.recordPortfolioAudit(actorUserId, familyId, item.learnerId, 'CREATE', item.id, {
      operation: 'EVIDENCE_SUBMISSION_PROMOTION',
    });
    return item.toResponseDto();
  }

  async getItem(familyId: string, id: string, actorUserId: string): Promise<PortfolioItemResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'view_portfolio');
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item.toResponseDto();
  }

  async listItems(
    familyId: string,
    actorUserId: string,
    filter: PortfolioItemFilterDto = {},
  ): Promise<PortfolioItemResponseDto[]> {
    await this.ensurePermission(familyId, actorUserId, 'view_portfolio');
    const items = await this.portfolioRepo.list(familyId, filter);
    return items.map((i) => i.toResponseDto());
  }

  async updateItem(
    familyId: string,
    id: string,
    dto: UpdatePortfolioItemDto,
    actorUserId: string,
  ): Promise<PortfolioItemResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'edit_portfolio_items');
    const existing = await this.portfolioRepo.findById(familyId, id);
    if (!existing) {
      throw new NotFoundException('Portfolio item not found');
    }

    await this.ensureContext(familyId, {
      learnerId: dto.learnerId ?? existing.learnerId,
      learningRecordId: dto.learningRecordId !== undefined ? dto.learningRecordId : existing.learningRecordId,
      academicYearId: dto.academicYearId !== undefined ? dto.academicYearId : existing.academicYearId,
      subjectId: dto.subjectId !== undefined ? dto.subjectId : existing.subjectId,
    });

    const updated = await this.portfolioRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Portfolio item not found');
    }
    await this.recordPortfolioAudit(actorUserId, familyId, updated.learnerId, 'UPDATE', updated.id);
    return updated.toResponseDto();
  }

  private async ensureContext(
    familyId: string,
    input: Parameters<PortfolioRepository['validateContext']>[1],
  ): Promise<void> {
    const validation = await this.portfolioRepo.validateContext(familyId, input);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }
  }

  async deleteItem(familyId: string, id: string, actorUserId: string): Promise<boolean> {
    await this.ensurePermission(familyId, actorUserId, 'delete_portfolio_items');
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
    actorUserId: string,
  ): Promise<PortfolioUploadUrlResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'edit_portfolio_items');
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

  async confirmUpload(
    familyId: string,
    id: string,
    actorUserId: string,
  ): Promise<PortfolioItemResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'edit_portfolio_items');
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

    await this.recordPortfolioAudit(actorUserId, familyId, updated.learnerId, 'UPDATE', updated.id, {
      operation: 'UPLOAD',
    });

    return updated.toResponseDto();
  }

  async getDownloadUrl(
    familyId: string,
    id: string,
    actorUserId: string,
  ): Promise<PortfolioDownloadUrlResponseDto> {
    await this.ensurePermission(familyId, actorUserId, 'view_portfolio');
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item || !item.storageKey) {
      throw new NotFoundException('Portfolio item not found');
    }

    const { downloadUrl, expiresAt } = await this.objectStorage.getPresignedDownloadUrl(
      item.storageKey,
    );

    await this.recordPortfolioAudit(actorUserId, familyId, item.learnerId, 'READ', id);

    return { downloadUrl, expiresAt: expiresAt.toISOString() };
  }

  private async ensurePermission(
    familyId: string,
    actorUserId: string,
    action: PortfolioPermissionAction,
  ): Promise<void> {
    const role = await this.familyApi.getFamilyMemberRole(actorUserId, familyId);
    if (!canAccessPortfolio(role, action)) {
      const messages: Record<PortfolioPermissionAction, string> = {
        view_portfolio: 'You do not have permission to view this portfolio.',
        create_portfolio_items: 'You do not have permission to add portfolio evidence.',
        edit_portfolio_items: 'You do not have permission to edit portfolio evidence.',
        delete_portfolio_items: 'Only family guardians can delete portfolio evidence.',
      };
      throw new ForbiddenException(messages[action]);
    }
  }

  private async recordPortfolioAudit(
    actorUserId: string,
    familyId: string,
    learnerId: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    resourceId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.privacyPublicApi.recordSensitiveDataAccess({
      actorUserId,
      familyId,
      learnerId,
      action,
      resourceType: 'PORTFOLIO_ITEM',
      resourceId,
      ...(metadata ? { metadata } : {}),
    });
  }
}
