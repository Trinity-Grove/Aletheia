import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EvidenceSubmissionService } from './evidence-submission.service.js';

describe('EvidenceSubmissionService preview', () => {
  const repository = { findById: jest.fn() };
  const achievementRepository = {};
  const privacyPublicApi = { recordSensitiveDataAccess: jest.fn() };
  const objectStorage = { getPresignedDownloadUrl: jest.fn() };

  const createService = () => new EvidenceSubmissionService(
    repository as never,
    achievementRepository as never,
    privacyPublicApi as never,
    objectStorage as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a short-lived URL only for validated private media', async () => {
    const expiresAt = new Date('2026-10-15T12:05:00.000Z');
    repository.findById.mockResolvedValue({
      id: 'submission-1',
      learnerId: 'learner-1',
      validationStatus: 'VALIDATED',
      storageKey: 'families/family-1/evidence/private.jpg',
    });
    objectStorage.getPresignedDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://storage.example.com/signed',
      expiresAt,
    });

    await expect(createService().getDownloadUrl('family-1', 'submission-1', 'guardian-1')).resolves.toEqual({
      downloadUrl: 'https://storage.example.com/signed',
      expiresAt: expiresAt.toISOString(),
    });
    expect(objectStorage.getPresignedDownloadUrl).toHaveBeenCalledWith('families/family-1/evidence/private.jpg');
    expect(privacyPublicApi.recordSensitiveDataAccess).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: 'guardian-1',
      familyId: 'family-1',
      learnerId: 'learner-1',
      action: 'READ',
      resourceType: 'EVIDENCE_SUBMISSION',
      resourceId: 'submission-1',
    }));
  });

  it('rejects missing, unvalidated, and non-private evidence previews', async () => {
    repository.findById.mockResolvedValueOnce(null);
    await expect(createService().getDownloadUrl('family-1', 'missing', 'guardian-1')).rejects.toBeInstanceOf(NotFoundException);

    repository.findById.mockResolvedValueOnce({ validationStatus: 'UNVALIDATED', storageKey: 'private-key' });
    await expect(createService().getDownloadUrl('family-1', 'pending', 'guardian-1')).rejects.toBeInstanceOf(BadRequestException);

    repository.findById.mockResolvedValueOnce({ validationStatus: 'VALIDATED', storageKey: null });
    await expect(createService().getDownloadUrl('family-1', 'text-only', 'guardian-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(objectStorage.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('rejects a private media key owned by another family', async () => {
    repository.findById.mockResolvedValue({
      validationStatus: 'VALIDATED',
      storageKey: 'families/other-family/evidence/private.jpg',
    });

    await expect(createService().getDownloadUrl('family-1', 'cross-family', 'guardian-1')).rejects.toThrow(
      'Evidence media does not belong to this family.',
    );
    expect(objectStorage.getPresignedDownloadUrl).not.toHaveBeenCalled();
  });
});
