import type { DayOfWeek, ScheduleSlotResponseDto } from "@aletheia/contracts";

export class ScheduleSlotEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly academicYearId: string | null,
    public readonly subjectId: string | null,
    public readonly learnerId: string | null,
    public readonly dayOfWeek: DayOfWeek,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly location: string | null,
    public readonly color: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly subjectName?: string | null,
    public readonly learnerName?: string | null,
  ) {}

  toResponseDto(): ScheduleSlotResponseDto {
    const dto: ScheduleSlotResponseDto = {
      id: this.id,
      familyId: this.familyId,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      title: this.title,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.subjectId !== undefined) {
      dto.subjectId = this.subjectId;
    }
    if (this.subjectName !== undefined) {
      dto.subjectName = this.subjectName;
    }
    if (this.learnerId !== undefined) {
      dto.learnerId = this.learnerId;
    }
    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.description !== undefined) {
      dto.description = this.description;
    }
    if (this.location !== undefined) {
      dto.location = this.location;
    }
    if (this.color !== undefined) {
      dto.color = this.color;
    }

    return dto;
  }
}
