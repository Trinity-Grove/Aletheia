import type {
  AssessmentMethod,
  LearningRecordObjectiveResponseDto,
  LearningRecordResponseDto,
  LearningRecordType,
  MasteryLevel,
} from '@aletheia/contracts';

export class LearningRecordObjectiveEntity {
  constructor(
    public readonly id: string,
    public readonly learningRecordId: string,
    public readonly objectiveId: string,
    public readonly createdAt: Date,
    public readonly objectiveTitle?: string,
  ) {}

  toResponseDto(): LearningRecordObjectiveResponseDto {
    const dto: LearningRecordObjectiveResponseDto = {
      id: this.id,
      learningRecordId: this.learningRecordId,
      objectiveId: this.objectiveId,
      createdAt: this.createdAt.toISOString(),
    };
    if (this.objectiveTitle !== undefined) {
      dto.objectiveTitle = this.objectiveTitle;
    }
    return dto;
  }
}

export class LearningRecordEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly subjectId: string | null,
    public readonly academicYearId: string | null,
    public readonly lessonPlanId: string | null,
    public readonly type: LearningRecordType,
    public readonly title: string,
    public readonly description: string | null,
    public readonly date: Date,
    public readonly durationMinutes: number | null,
    public readonly masteryLevel: MasteryLevel,
    public readonly assessmentMethod: AssessmentMethod,
    public readonly strengths: string | null,
    public readonly areasForGrowth: string | null,
    public readonly characterHabitGrowth: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly objectives: LearningRecordObjectiveEntity[] = [],
    public readonly portfolioItemIds: string[] = [],
    public readonly learnerName?: string,
    public readonly subjectName?: string | null,
    public readonly subjectColor?: string | null,
  ) {}

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): LearningRecordResponseDto {
    const dto: LearningRecordResponseDto = {
      id: this.id,
      familyId: this.familyId,
      learnerId: this.learnerId,
      type: this.type,
      title: this.title,
      date: this.formatDateOnly(this.date),
      masteryLevel: this.masteryLevel,
      assessmentMethod: this.assessmentMethod,
      objectives: this.objectives.map((o) => o.toResponseDto()),
      portfolioItemIds: this.portfolioItemIds,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.subjectId !== undefined) {
      dto.subjectId = this.subjectId;
    }
    if (this.subjectName !== undefined) {
      dto.subjectName = this.subjectName;
    }
    if (this.subjectColor !== undefined) {
      dto.subjectColor = this.subjectColor;
    }
    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.lessonPlanId !== undefined) {
      dto.lessonPlanId = this.lessonPlanId;
    }
    if (this.description !== undefined) {
      dto.description = this.description;
    }
    if (this.durationMinutes !== undefined) {
      dto.durationMinutes = this.durationMinutes;
    }
    if (this.strengths !== undefined) {
      dto.strengths = this.strengths;
    }
    if (this.areasForGrowth !== undefined) {
      dto.areasForGrowth = this.areasForGrowth;
    }
    if (this.characterHabitGrowth !== undefined) {
      dto.characterHabitGrowth = this.characterHabitGrowth;
    }
    if (this.notes !== undefined) {
      dto.notes = this.notes;
    }

    return dto;
  }
}
