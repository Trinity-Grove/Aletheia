import { Injectable, NotFoundException } from '@nestjs/common';
import { LearnerRepository } from '../infrastructure/learner.repository.js';
import type {
  CreateLearnerDto,
  LearnerResponseDto,
  UpdateLearnerDto,
} from '@aletheia/contracts';

@Injectable()
export class LearnerService {
  constructor(private readonly learnerRepository: LearnerRepository) {}

  async createLearner(familyId: string, dto: CreateLearnerDto): Promise<LearnerResponseDto> {
    const learner = await this.learnerRepository.create(familyId, dto);
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
}
