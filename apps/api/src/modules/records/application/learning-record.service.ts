import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningRecordRepository } from '../infrastructure/learning-record.repository.js';
import type {
  CreateLearningRecordDto,
  LearnerProgressSummaryDto,
  LearningRecordFilterDto,
  LearningRecordResponseDto,
  LearningRecordType,
  MasteryDistributionDto,
  UpdateLearningRecordDto,
} from '@aletheia/contracts';

@Injectable()
export class LearningRecordService {
  constructor(private readonly recordRepo: LearningRecordRepository) {}

  async createRecord(familyId: string, dto: CreateLearningRecordDto): Promise<LearningRecordResponseDto> {
    const record = await this.recordRepo.create(familyId, dto);
    return record.toResponseDto();
  }

  async getRecord(familyId: string, id: string): Promise<LearningRecordResponseDto> {
    const record = await this.recordRepo.findById(familyId, id);
    if (!record) {
      throw new NotFoundException('Learning record not found');
    }
    return record.toResponseDto();
  }

  async listRecords(
    familyId: string,
    filter: LearningRecordFilterDto = {},
  ): Promise<LearningRecordResponseDto[]> {
    const records = await this.recordRepo.list(familyId, filter);
    return records.map((r) => r.toResponseDto());
  }

  async updateRecord(
    familyId: string,
    id: string,
    dto: UpdateLearningRecordDto,
  ): Promise<LearningRecordResponseDto> {
    const updated = await this.recordRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Learning record not found');
    }
    return updated.toResponseDto();
  }

  async deleteRecord(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.recordRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Learning record not found');
    }
    return true;
  }

  async getProgressSummary(familyId: string, learnerId: string): Promise<LearnerProgressSummaryDto> {
    const records = await this.recordRepo.list(familyId, { learnerId });

    let learnerName: string | undefined = undefined;
    let totalMinutesSpent = 0;

    const masteryDistribution: MasteryDistributionDto = {
      NOT_STARTED: 0,
      EXPOSURE: 0,
      DEVELOPING: 0,
      WITH_ASSISTANCE: 0,
      AUTONOMOUS: 0,
      MASTERED: 0,
    };

    const recordsByType: Record<LearningRecordType, number> = {
      PLANNED_LESSON: 0,
      SPONTANEOUS_EXPERIENCE: 0,
      PROJECT_WORK: 0,
      READING_LOG: 0,
      HABIT_PRACTICE: 0,
    };

    for (const rec of records) {
      if (!learnerName && rec.learnerName) {
        learnerName = rec.learnerName;
      }
      if (rec.durationMinutes) {
        totalMinutesSpent += rec.durationMinutes;
      }
      if (rec.masteryLevel in masteryDistribution) {
        masteryDistribution[rec.masteryLevel] = (masteryDistribution[rec.masteryLevel] ?? 0) + 1;
      }
      if (rec.type in recordsByType) {
        recordsByType[rec.type] = (recordsByType[rec.type] ?? 0) + 1;
      }
    }

    // Milestones: records with AUTONOMOUS or MASTERED level, sorted most recent first (top 5)
    const milestones = records
      .filter((r) => r.masteryLevel === 'AUTONOMOUS' || r.masteryLevel === 'MASTERED')
      .slice(0, 5)
      .map((r) => r.toResponseDto());

    const summary: LearnerProgressSummaryDto = {
      learnerId,
      totalRecordsCount: records.length,
      totalMinutesSpent,
      masteryDistribution,
      recordsByType,
      recentMilestones: milestones,
    };

    if (learnerName !== undefined) {
      summary.learnerName = learnerName;
    }

    return summary;
  }
}
