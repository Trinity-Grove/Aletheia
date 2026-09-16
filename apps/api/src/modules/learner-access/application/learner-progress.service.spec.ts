import { ForbiddenException } from '@nestjs/common';
import { LearnerProgressService } from './learner-progress.service.js';
import { LearnerAccessGrantRepository } from '../infrastructure/learner-access-grant.repository.js';
import { LearnerAccessGrantEntity, type LearnerAccessGrantProps } from '../domain/learner-access-grant.entity.js';
import type {
  EvidenceSubmissionPublicApi,
  LearnerCompetencyTrackingPublicApi,
} from '../../curriculum/application/public-api.js';
import type { LearnerSubmitEvidenceOutput } from '@aletheia/contracts';

const FAMILY_ID = 'fam-1';
const LEARNER_ID = 'learner-1';
const SIBLING_LEARNER_ID = 'learner-2';
const GUARDIAN_ID = 'guardian-1';

function makeGrant(overrides: Partial<LearnerAccessGrantProps> = {}) {
  return new LearnerAccessGrantEntity({
    id: 'grant-1',
    learnerId: LEARNER_ID,
    familyId: FAMILY_ID,
    codeHash: 'hash',
    enabled: true,
    createdBy: GUARDIAN_ID,
    createdAt: new Date(),
    regeneratedAt: null,
    revokedAt: null,
    lastUsedAt: null,
    ...overrides,
  });
}

describe('LearnerProgressService', () => {
  let evidenceApi: jest.Mocked<EvidenceSubmissionPublicApi>;
  let trackingApi: jest.Mocked<LearnerCompetencyTrackingPublicApi>;
  let grantRepository: jest.Mocked<LearnerAccessGrantRepository>;
  let service: LearnerProgressService;

  beforeEach(() => {
    evidenceApi = {
      createEvidenceSubmission: jest.fn(),
    } as unknown as jest.Mocked<EvidenceSubmissionPublicApi>;
    trackingApi = {
      listTrackedCompetencies: jest.fn(),
    } as unknown as jest.Mocked<LearnerCompetencyTrackingPublicApi>;
    grantRepository = {
      findByLearnerId: jest.fn(),
    } as unknown as jest.Mocked<LearnerAccessGrantRepository>;

    service = new LearnerProgressService(evidenceApi, trackingApi, grantRepository);
  });

  describe('submitEvidence', () => {
    const dto: LearnerSubmitEvidenceOutput = {
      evidenceTypeId: 'evidence-type-1',
      competencies: [{ competencyDefinitionId: 'competency-1' }],
      textContent: 'I did the thing.',
    };

    it('forwards to the shared EvidenceSubmissionService, attributing authorship to the granting guardian', async () => {
      grantRepository.findByLearnerId.mockResolvedValue(makeGrant());
      evidenceApi.createEvidenceSubmission.mockResolvedValue({ id: 'evidence-1' } as never);

      await service.submitEvidence(FAMILY_ID, LEARNER_ID, dto);

      expect(evidenceApi.createEvidenceSubmission).toHaveBeenCalledWith(FAMILY_ID, GUARDIAN_ID, {
        ...dto,
        learnerId: LEARNER_ID,
      });
    });

    it('always forces learnerId to the caller-supplied learnerId, never anything from the dto', async () => {
      grantRepository.findByLearnerId.mockResolvedValue(makeGrant());
      evidenceApi.createEvidenceSubmission.mockResolvedValue({ id: 'evidence-1' } as never);

      // Even if some upstream bug smuggled a learnerId onto the dto object,
      // the service must still send the verified, caller-supplied learnerId.
      const dtoWithSmuggledLearnerId = { ...dto, learnerId: SIBLING_LEARNER_ID } as unknown as LearnerSubmitEvidenceOutput;

      await service.submitEvidence(FAMILY_ID, LEARNER_ID, dtoWithSmuggledLearnerId);

      expect(evidenceApi.createEvidenceSubmission).toHaveBeenCalledWith(
        FAMILY_ID,
        GUARDIAN_ID,
        expect.objectContaining({ learnerId: LEARNER_ID }),
      );
    });

    it('throws Forbidden when no grant exists for the learner', async () => {
      grantRepository.findByLearnerId.mockResolvedValue(null);

      await expect(service.submitEvidence(FAMILY_ID, LEARNER_ID, dto)).rejects.toThrow(ForbiddenException);
      expect(evidenceApi.createEvidenceSubmission).not.toHaveBeenCalled();
    });

    it('throws Forbidden when the grant belongs to a different family', async () => {
      grantRepository.findByLearnerId.mockResolvedValue(makeGrant({ familyId: 'other-family' }));

      await expect(service.submitEvidence(FAMILY_ID, LEARNER_ID, dto)).rejects.toThrow(ForbiddenException);
      expect(evidenceApi.createEvidenceSubmission).not.toHaveBeenCalled();
    });

    it('throws Forbidden when the grant is disabled', async () => {
      grantRepository.findByLearnerId.mockResolvedValue(makeGrant({ enabled: false }));

      await expect(service.submitEvidence(FAMILY_ID, LEARNER_ID, dto)).rejects.toThrow(ForbiddenException);
      expect(evidenceApi.createEvidenceSubmission).not.toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    it('lists tracked competencies scoped to the given family and learner only', async () => {
      trackingApi.listTrackedCompetencies.mockResolvedValue([{ id: 'tracking-1' } as never]);

      const result = await service.getProgress(FAMILY_ID, LEARNER_ID, 'ACTIVE');

      expect(trackingApi.listTrackedCompetencies).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, 'ACTIVE');
      expect(result).toEqual([{ id: 'tracking-1' }]);
    });

    it('never accepts a learnerId other than the one explicitly passed in', async () => {
      trackingApi.listTrackedCompetencies.mockResolvedValue([]);

      await service.getProgress(FAMILY_ID, LEARNER_ID);

      // Sanity: the sibling id never appears anywhere in the call.
      expect(trackingApi.listTrackedCompetencies).not.toHaveBeenCalledWith(
        FAMILY_ID,
        SIBLING_LEARNER_ID,
        undefined,
      );
    });
  });
});
