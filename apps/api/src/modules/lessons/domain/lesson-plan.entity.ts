import type { LessonPlanLearnerResponseDto, LessonPlanObjectiveResponseDto, LessonPlanResponseDto, LessonStatus } from '@aletheia/contracts';

export class LessonPlanLearnerEntity {
  constructor(
    public readonly id: string,
    public readonly lessonPlanId: string,
    public readonly learnerId: string,
    public readonly notes: string | null,
    public readonly completed: boolean,
    public readonly createdAt: Date,
    public readonly learnerName?: string,
  ) {}

  toResponseDto(): LessonPlanLearnerResponseDto {
    const dto: LessonPlanLearnerResponseDto = {
      id: this.id,
      lessonPlanId: this.lessonPlanId,
      learnerId: this.learnerId,
      completed: this.completed,
    };
    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.notes !== undefined) {
      dto.notes = this.notes;
    }
    return dto;
  }
}

export class LessonPlanObjectiveEntity {
  constructor(
    public readonly id: string,
    public readonly lessonPlanId: string,
    public readonly objectiveId: string,
    public readonly createdAt: Date,
    public readonly title?: string,
  ) {}

  toResponseDto(): LessonPlanObjectiveResponseDto {
    const dto: LessonPlanObjectiveResponseDto = {
      id: this.id,
      lessonPlanId: this.lessonPlanId,
      objectiveId: this.objectiveId,
    };
    if (this.title !== undefined) {
      dto.title = this.title;
    }
    return dto;
  }
}

export class LessonPlanEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly academicYearId: string | null,
    public readonly subjectId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly date: Date,
    public readonly startTime: string | null,
    public readonly endTime: string | null,
    public readonly durationMinutes: number | null,
    public readonly actualDurationMinutes: number | null,
    public readonly status: LessonStatus,
    public readonly materials: string | null,
    public readonly homework: string | null,
    public readonly notes: string | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly learners: LessonPlanLearnerEntity[] = [],
    public readonly objectives: LessonPlanObjectiveEntity[] = [],
    public readonly subjectName?: string,
    public readonly subjectColor?: string | null,
  ) {}

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): LessonPlanResponseDto {
    const dto: LessonPlanResponseDto = {
      id: this.id,
      familyId: this.familyId,
      subjectId: this.subjectId,
      title: this.title,
      date: this.formatDateOnly(this.date),
      status: this.status,
      learners: this.learners.map((l) => l.toResponseDto()),
      objectives: this.objectives.map((o) => o.toResponseDto()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.subjectName !== undefined) {
      dto.subjectName = this.subjectName;
    }
    if (this.subjectColor !== undefined) {
      dto.subjectColor = this.subjectColor;
    }
    if (this.description !== undefined) {
      dto.description = this.description;
    }
    if (this.startTime !== undefined) {
      dto.startTime = this.startTime;
    }
    if (this.endTime !== undefined) {
      dto.endTime = this.endTime;
    }
    if (this.durationMinutes !== undefined) {
      dto.durationMinutes = this.durationMinutes;
    }
    if (this.actualDurationMinutes !== undefined) {
      dto.actualDurationMinutes = this.actualDurationMinutes;
    }
    if (this.materials !== undefined) {
      dto.materials = this.materials;
    }
    if (this.homework !== undefined) {
      dto.homework = this.homework;
    }
    if (this.notes !== undefined) {
      dto.notes = this.notes;
    }
    if (this.completedAt !== null && this.completedAt !== undefined) {
      dto.completedAt = this.completedAt.toISOString();
    } else if (this.completedAt === null) {
      dto.completedAt = null;
    }

    return dto;
  }
}
