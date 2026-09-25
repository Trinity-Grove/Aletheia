import { Prisma } from '@prisma/client';
import { PortfolioService } from './portfolio.service.js';
import { PortfolioItemEntity } from '../domain/portfolio-item.entity.js';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepo: any;
  let objectStorage: any;
  let avScanner: any;
  let evidenceSubmissionApi: any;
  let privacyPublicApi: any;
  let recordedAccess: Array<Record<string, unknown>>;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const ITEM_ID = 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const ACTOR_USER_ID = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
  const STORAGE_KEY = `families/${FAMILY_ID}/portfolio/${ITEM_ID}/abc-tree.png`;

  beforeEach(() => {
    portfolioRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new PortfolioItemEntity(
            ITEM_ID,
            familyId,
            dto.learnerId,
            dto.learningRecordId ?? null,
            dto.academicYearId ?? null,
            dto.subjectId ?? null,
            dto.title,
            dto.description ?? null,
            dto.type,
            dto.fileUrl ?? null,
            dto.textContent ?? null,
            dto.mimeType ?? null,
            dto.fileSizeBytes ?? null,
            null,
            null,
            null,
            dto.capturedAt ? new Date(dto.capturedAt) : null,
            dto.isHighlight ?? false,
            dto.tags ?? [],
            new Date(),
            new Date(),
            'Alice Smith',
            'Art',
          ),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) =>
        Promise.resolve(
          new PortfolioItemEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            'Drawing of Tree',
            null,
            'IMAGE',
            null,
            null,
            'image/png',
            1024,
            STORAGE_KEY,
            null,
            null,
            new Date('2026-08-25'),
            true,
            ['nature', 'art'],
            new Date(),
            new Date(),
            'Alice Smith',
            'Art',
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation((familyId, id, dto) =>
        Promise.resolve(
          new PortfolioItemEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            dto.title ?? 'Updated Artwork',
            null,
            'IMAGE',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            dto.isHighlight ?? true,
            dto.tags ?? ['art'],
            new Date(),
            new Date(),
            'Alice Smith',
          ),
        ),
      ),
      createFromEvidenceSubmission: jest.fn().mockImplementation((familyId, input) =>
        Promise.resolve(
          new PortfolioItemEntity(
            ITEM_ID,
            familyId,
            input.learnerId,
            null,
            input.academicYearId ?? null,
            input.subjectId ?? null,
            input.title,
            input.description ?? null,
            input.type,
            input.fileUrl ?? null,
            input.textContent ?? null,
            input.mimeType ?? null,
            input.fileSizeBytes ?? null,
            null,
            input.checksumSha256 ?? null,
            null,
            input.capturedAt ? new Date(input.capturedAt) : null,
            input.isHighlight ?? false,
            input.tags ?? [],
            new Date(),
            new Date(),
            'Alice Smith',
            null,
            input.evidenceSubmissionId,
          ),
        ),
      ),
      softDelete: jest.fn().mockResolvedValue(true),
      savePendingUpload: jest.fn().mockResolvedValue(true),
      confirmUpload: jest.fn().mockImplementation((familyId, id, data) =>
        Promise.resolve(
          new PortfolioItemEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            'Drawing of Tree',
            null,
            'IMAGE',
            null,
            null,
            data.mimeType,
            data.fileSizeBytes,
            STORAGE_KEY,
            data.checksumSha256,
            null,
            null,
            true,
            ['nature', 'art'],
            new Date(),
            new Date(),
            'Alice Smith',
            'Art',
          ),
        ),
      ),
    };

    objectStorage = {
      buildStorageKey: jest.fn().mockReturnValue(STORAGE_KEY),
      getPresignedUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://storage.local/upload-signed',
        expiresAt: new Date('2026-08-25T00:05:00.000Z'),
      }),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue({
        downloadUrl: 'https://storage.local/download-signed',
        expiresAt: new Date('2026-08-25T00:05:00.000Z'),
      }),
      headObject: jest.fn().mockResolvedValue({ contentType: 'image/png', contentLength: 2048 }),
      computeChecksumSha256: jest.fn().mockResolvedValue('a'.repeat(64)),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    avScanner = {
      scan: jest.fn().mockResolvedValue({ clean: true }),
    };

    evidenceSubmissionApi = {
      getEvidenceSubmissionForPortfolio: jest.fn(),
    };

    recordedAccess = [];
    privacyPublicApi = {
      recordSensitiveDataAccess: jest.fn(async (entry: Record<string, unknown>) => {
        recordedAccess.push(entry);
      }),
    };

    service = new PortfolioService(
      portfolioRepo,
      objectStorage,
      avScanner,
      evidenceSubmissionApi,
      privacyPublicApi,
    );
  });

  it('creates a portfolio item successfully', async () => {
    const res = await service.createItem(FAMILY_ID, {
      learnerId: LEARNER_ID,
      title: 'Botanical Drawing',
      type: 'IMAGE',
      fileUrl: 'https://example.com/drawing.jpg',
      isHighlight: true,
      tags: ['botany', 'drawing'],
    });

    expect(res.id).toBe(ITEM_ID);
    expect(res.title).toBe('Botanical Drawing');
    expect(res.type).toBe('IMAGE');
    expect(res.isHighlight).toBe(true);
    expect(portfolioRepo.create).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
      title: 'Botanical Drawing',
    }));
  });

  it('retrieves a portfolio item by id', async () => {
    const res = await service.getItem(FAMILY_ID, ITEM_ID);
    expect(res.id).toBe(ITEM_ID);
    expect(res.title).toBe('Drawing of Tree');
    expect(res.capturedAt).toBe('2026-08-25');
  });

  it('throws NotFoundException when item not found by id', async () => {
    portfolioRepo.findById.mockResolvedValue(null);
    await expect(service.getItem(FAMILY_ID, 'non-existent')).rejects.toThrow('Portfolio item not found');
  });

  it('lists portfolio items with filters', async () => {
    portfolioRepo.list.mockResolvedValue([
      new PortfolioItemEntity(
        ITEM_ID,
        FAMILY_ID,
        LEARNER_ID,
        null,
        null,
        null,
        'Drawing of Tree',
        null,
        'IMAGE',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        true,
        ['art'],
        new Date(),
        new Date(),
      ),
    ]);

    const res = await service.listItems(FAMILY_ID, { isHighlight: true });
    expect(res.length).toBe(1);
    expect(portfolioRepo.list).toHaveBeenCalledWith(FAMILY_ID, { isHighlight: true });
  });

  it('updates a portfolio item', async () => {
    const res = await service.updateItem(FAMILY_ID, ITEM_ID, {
      title: 'Updated Artwork',
      isHighlight: false,
    });
    expect(res.title).toBe('Updated Artwork');
    expect(res.isHighlight).toBe(false);
  });

  describe('createItemFromEvidenceSubmission', () => {
    const EVIDENCE_SUBMISSION_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

    const validatedSource = {
      id: EVIDENCE_SUBMISSION_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      evidenceTypeCode: 'PHOTO',
      validationStatus: 'VALIDATED',
      textContent: null,
      fileUrl: 'https://storage.example.com/evidence/garden.jpg',
      storageKey: null,
      mimeType: 'image/jpeg',
      fileSizeBytes: 4096,
      checksumSha256: 'b'.repeat(64),
      createdAt: '2026-05-10T12:00:00.000Z',
    };

    it('promotes a validated evidence submission, mapping its type code to the legacy enum', async () => {
      evidenceSubmissionApi.getEvidenceSubmissionForPortfolio.mockResolvedValue(validatedSource);

      const res = await service.createItemFromEvidenceSubmission(FAMILY_ID, EVIDENCE_SUBMISSION_ID, {
        title: 'Horta comunitária',
        isHighlight: false,
        tags: [],
      });

      expect(res.title).toBe('Horta comunitária');
      expect(res.type).toBe('IMAGE');
      expect(res.evidenceSubmissionId).toBe(EVIDENCE_SUBMISSION_ID);
      expect(portfolioRepo.createFromEvidenceSubmission).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.objectContaining({
          learnerId: LEARNER_ID,
          evidenceSubmissionId: EVIDENCE_SUBMISSION_ID,
          type: 'IMAGE',
          fileUrl: validatedSource.fileUrl,
          capturedAt: '2026-05-10',
        }),
      );
    });

    it('throws NotFoundException when the evidence submission does not exist for this family', async () => {
      evidenceSubmissionApi.getEvidenceSubmissionForPortfolio.mockResolvedValue(null);
      await expect(
        service.createItemFromEvidenceSubmission(FAMILY_ID, 'missing', { title: 'X', isHighlight: false, tags: [] }),
      ).rejects.toThrow('Evidence submission not found.');
    });

    it('rejects an evidence submission that has not been validated yet', async () => {
      evidenceSubmissionApi.getEvidenceSubmissionForPortfolio.mockResolvedValue({
        ...validatedSource,
        validationStatus: 'UNVALIDATED',
      });
      await expect(
        service.createItemFromEvidenceSubmission(FAMILY_ID, EVIDENCE_SUBMISSION_ID, {
          title: 'X',
          isHighlight: false,
          tags: [],
        }),
      ).rejects.toThrow('Only a validated evidence submission can be added to the portfolio.');
    });

    it('rejects promoting the same evidence submission twice', async () => {
      evidenceSubmissionApi.getEvidenceSubmissionForPortfolio.mockResolvedValue(validatedSource);
      const prismaError = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.19.3',
      });
      portfolioRepo.createFromEvidenceSubmission.mockRejectedValueOnce(prismaError);

      await expect(
        service.createItemFromEvidenceSubmission(FAMILY_ID, EVIDENCE_SUBMISSION_ID, {
          title: 'X',
          isHighlight: false,
          tags: [],
        }),
      ).rejects.toThrow('This evidence submission has already been added to the portfolio.');
    });
  });

  describe('deleteItem', () => {
    it('deletes the storage object and soft-deletes the row when a file is attached', async () => {
      const res = await service.deleteItem(FAMILY_ID, ITEM_ID, ACTOR_USER_ID);
      expect(res).toBe(true);
      expect(objectStorage.deleteObject).toHaveBeenCalledWith(STORAGE_KEY);
      expect(portfolioRepo.softDelete).toHaveBeenCalledWith(FAMILY_ID, ITEM_ID);
      expect(recordedAccess).toContainEqual(
        expect.objectContaining({
          actorUserId: ACTOR_USER_ID,
          familyId: FAMILY_ID,
          learnerId: LEARNER_ID,
          action: 'DELETE',
          resourceType: 'PORTFOLIO_ITEM',
          resourceId: ITEM_ID,
        }),
      );
    });

    it('skips storage deletion when the item has no attached file', async () => {
      portfolioRepo.findById.mockResolvedValueOnce(
        new PortfolioItemEntity(
          ITEM_ID, FAMILY_ID, LEARNER_ID, null, null, null,
          'No File', null, 'TEXT', null, 'Some text', null, null,
          null, null, null, null, false, [], new Date(), new Date(),
        ),
      );
      await service.deleteItem(FAMILY_ID, ITEM_ID, ACTOR_USER_ID);
      expect(objectStorage.deleteObject).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the item does not exist', async () => {
      portfolioRepo.findById.mockResolvedValue(null);
      await expect(service.deleteItem(FAMILY_ID, 'missing', ACTOR_USER_ID)).rejects.toThrow('Portfolio item not found');
    });
  });

  describe('requestUpload', () => {
    it('builds a storage key, persists it as pending, and returns a presigned upload URL', async () => {
      const res = await service.requestUpload(FAMILY_ID, ITEM_ID, {
        fileName: 'tree.png',
        mimeType: 'image/png',
        fileSizeBytes: 2048,
      });

      expect(objectStorage.buildStorageKey).toHaveBeenCalledWith(FAMILY_ID, ITEM_ID, 'tree.png');
      expect(portfolioRepo.savePendingUpload).toHaveBeenCalledWith(FAMILY_ID, ITEM_ID, STORAGE_KEY);
      expect(res.storageKey).toBe(STORAGE_KEY);
      expect(res.uploadUrl).toBe('https://storage.local/upload-signed');
    });

    it('throws NotFoundException when the item does not exist', async () => {
      portfolioRepo.findById.mockResolvedValue(null);
      await expect(
        service.requestUpload(FAMILY_ID, 'missing', {
          fileName: 'x.png',
          mimeType: 'image/png',
          fileSizeBytes: 10,
        }),
      ).rejects.toThrow('Portfolio item not found');
    });
  });

  describe('confirmUpload', () => {
    it('verifies the object in storage, scans it, and persists real metadata', async () => {
      const res = await service.confirmUpload(FAMILY_ID, ITEM_ID);

      expect(objectStorage.headObject).toHaveBeenCalledWith(STORAGE_KEY);
      expect(avScanner.scan).toHaveBeenCalled();
      expect(objectStorage.computeChecksumSha256).toHaveBeenCalled();
      expect(portfolioRepo.confirmUpload).toHaveBeenCalledWith(
        FAMILY_ID,
        ITEM_ID,
        expect.objectContaining({ mimeType: 'image/png', fileSizeBytes: 2048 }),
      );
      expect(res.mimeType).toBe('image/png');
    });

    it('rejects when the object has not finished uploading', async () => {
      objectStorage.headObject.mockResolvedValue(null);
      await expect(service.confirmUpload(FAMILY_ID, ITEM_ID)).rejects.toThrow(
        'Upload has not completed yet.',
      );
    });

    it('deletes the object and rejects when the AV scan fails', async () => {
      avScanner.scan.mockResolvedValue({ clean: false, threatName: 'EICAR-Test' });
      await expect(service.confirmUpload(FAMILY_ID, ITEM_ID)).rejects.toThrow(
        'Uploaded file failed the security scan.',
      );
      expect(objectStorage.deleteObject).toHaveBeenCalled();
      expect(portfolioRepo.confirmUpload).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when there is no pending upload', async () => {
      portfolioRepo.findById.mockResolvedValueOnce(
        new PortfolioItemEntity(
          ITEM_ID, FAMILY_ID, LEARNER_ID, null, null, null,
          'No File', null, 'TEXT', null, 'Some text', null, null,
          null, null, null, null, false, [], new Date(), new Date(),
        ),
      );
      await expect(service.confirmUpload(FAMILY_ID, ITEM_ID)).rejects.toThrow(
        'No pending upload for this portfolio item.',
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('returns a presigned download URL when a file is attached', async () => {
      const res = await service.getDownloadUrl(FAMILY_ID, ITEM_ID, ACTOR_USER_ID);
      expect(objectStorage.getPresignedDownloadUrl).toHaveBeenCalledWith(STORAGE_KEY);
      expect(res.downloadUrl).toBe('https://storage.local/download-signed');
      expect(recordedAccess).toContainEqual(
        expect.objectContaining({
          actorUserId: ACTOR_USER_ID,
          familyId: FAMILY_ID,
          learnerId: LEARNER_ID,
          action: 'READ',
          resourceType: 'PORTFOLIO_ITEM',
          resourceId: ITEM_ID,
        }),
      );
    });

    it('throws NotFoundException when there is no attached file', async () => {
      portfolioRepo.findById.mockResolvedValueOnce(
        new PortfolioItemEntity(
          ITEM_ID, FAMILY_ID, LEARNER_ID, null, null, null,
          'No File', null, 'TEXT', null, 'Some text', null, null,
          null, null, null, null, false, [], new Date(), new Date(),
        ),
      );
      await expect(service.getDownloadUrl(FAMILY_ID, ITEM_ID, ACTOR_USER_ID)).rejects.toThrow('Portfolio item not found');
    });
  });
});
