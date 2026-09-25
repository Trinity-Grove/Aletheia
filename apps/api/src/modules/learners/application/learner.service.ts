import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LearnerRepository } from '../infrastructure/learner.repository.js';
import {
  resolvePrivacyRegime,
  type CreateLearnerDto,
  type LearnerResponseDto,
  type LearnerSummaryDto,
  type UpdateLearnerDto,
} from '@aletheia/contracts';
import { PRIVACY_PUBLIC_API, type PrivacyPublicApi } from '../../privacy/application/public-api.js';
import type { LearnersPublicApi } from './public-api.js';

@Injectable()
export class LearnerService implements LearnersPublicApi {
  constructor(
    private readonly learnerRepository: LearnerRepository,
    @Inject(PRIVACY_PUBLIC_API) private readonly privacyPublicApi: PrivacyPublicApi,
  ) {}

  async createLearner(
    familyId: string,
    dto: CreateLearnerDto,
    actorUserId: string,
  ): Promise<LearnerResponseDto> {
    // Guardian consent for processing this learner's data (issue: guardian
    // consent at learner creation). The countryCode read here is the
    // family's own -- already collected at onboarding -- not something the
    // caller passes, so the regime can never be spoofed by the client.
    // Resolved and validated *before* creating the learner: a learner
    // should never end up existing without a recorded consent for it, the
    // same fail-loud-if-seed-missing discipline AuthService.register uses.
    const countryCode = await this.learnerRepository.findFamilyCountryCode(familyId);
    const regime = resolvePrivacyRegime(countryCode ?? '');
    const learnerScopedDefinitions = await this.privacyPublicApi.getPublishedDefinitions('LEARNER');
    const consentDefinition = learnerScopedDefinitions.find(
      (def) => def.code === `LEARNER_DATA_PROCESSING_${regime}`,
    );
    if (!consentDefinition) {
      throw new BadRequestException(
        'O consentimento de tratamento de dados não está disponível no momento. Tente novamente em instantes.',
      );
    }

    const learner = await this.learnerRepository.create(familyId, dto);
    await this.privacyPublicApi.grantConsent(
      familyId,
      actorUserId,
      { consentDefinitionId: consentDefinition.id, learnerId: learner.id },
      { ipAddress: null, userAgent: null },
    );

    return learner.toResponseDto();
  }

  async getFamilyLearners(familyId: string, includeArchived = false): Promise<LearnerResponseDto[]> {
    const learners = await this.learnerRepository.findByFamilyId(familyId, includeArchived);
    return learners.map((learner) => learner.toResponseDto());
  }

  async getLearnerById(familyId: string, learnerId: string): Promise<LearnerResponseDto> {
    const learner = await this.learnerRepository.findByIdAndFamilyId(familyId, learnerId);
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }
    return learner.toResponseDto();
  }

  async updateLearner(
    familyId: string,
    learnerId: string,
    dto: UpdateLearnerDto,
  ): Promise<LearnerResponseDto> {
    const updated = await this.learnerRepository.update(familyId, learnerId, dto);
    if (!updated) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }
    return updated.toResponseDto();
  }

  async archiveLearner(familyId: string, learnerId: string): Promise<LearnerResponseDto> {
    const updated = await this.learnerRepository.update(familyId, learnerId, {
      archivedAt: new Date(),
    });
    if (!updated) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }
    return updated.toResponseDto();
  }

  async reactivateLearner(familyId: string, learnerId: string): Promise<LearnerResponseDto> {
    const updated = await this.learnerRepository.update(familyId, learnerId, {
      archivedAt: null,
    });
    if (!updated) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }
    return updated.toResponseDto();
  }

  async findLearnerById(familyId: string, learnerId: string): Promise<LearnerSummaryDto | null> {
    const learner = await this.learnerRepository.findByIdAndFamilyId(familyId, learnerId);
    if (!learner || learner.isArchived) {
      return null;
    }
    return learner.toSummaryDto();
  }

  async listActiveLearners(familyId: string): Promise<LearnerSummaryDto[]> {
    const learners = await this.learnerRepository.findByFamilyId(familyId, false);
    return learners.map((learner) => learner.toSummaryDto());
  }
}
