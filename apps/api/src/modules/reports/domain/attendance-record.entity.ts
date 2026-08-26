import type {
  AttendanceResponseDto,
  AttendanceStatus,
} from '@aletheia/contracts';

export class AttendanceRecordEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly academicYearId: string | null,
    public readonly date: Date,
    public readonly status: AttendanceStatus,
    public readonly hoursSpent: number | null,
    public readonly notes: string | null,
    public readonly isAutoLogged: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly learnerName?: string,
  ) {}

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): AttendanceResponseDto {
    const dto: AttendanceResponseDto = {
      id: this.id,
      familyId: this.familyId,
      learnerId: this.learnerId,
      date: this.formatDateOnly(this.date),
      status: this.status,
      isAutoLogged: this.isAutoLogged,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.hoursSpent !== undefined) {
      dto.hoursSpent = this.hoursSpent;
    }
    if (this.notes !== undefined) {
      dto.notes = this.notes;
    }

    return dto;
  }
}
