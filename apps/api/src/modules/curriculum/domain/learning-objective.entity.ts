import type { ObjectiveStatus } from '@aletheia/contracts';

export class LearningObjectiveEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly subjectId: string,
    public readonly academicYearId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: ObjectiveStatus,
    public readonly targetDate: Date | null,
    public readonly achievedAt: Date | null,
    public readonly order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
