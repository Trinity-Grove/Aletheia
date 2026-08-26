import type {
  CreateLearningRecordDto,
  LearnerProgressSummaryDto,
  LearningRecordFilterDto,
  LearningRecordResponseDto,
} from '@aletheia/contracts';

export const LEARNING_RECORDS_PUBLIC_API = Symbol('LEARNING_RECORDS_PUBLIC_API');

export interface LearningRecordsPublicApi {
  createRecord(familyId: string, dto: CreateLearningRecordDto): Promise<LearningRecordResponseDto>;
  getRecord(familyId: string, id: string): Promise<LearningRecordResponseDto>;
  listRecords(familyId: string, filter?: LearningRecordFilterDto): Promise<LearningRecordResponseDto[]>;
  getProgressSummary(familyId: string, learnerId: string): Promise<LearnerProgressSummaryDto>;
}
