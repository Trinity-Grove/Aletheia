import type { ComplianceRequirementResponseDto } from '@aletheia/contracts';

export class ComplianceRequirementEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly academicYearId: string,
    public readonly learnerId: string | null,
    public readonly jurisdiction: string | null,
    public readonly minInstructionalDays: number | null,
    public readonly minInstructionalHours: number | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly academicYearTitle?: string,
    public readonly learnerName?: string,
  ) {}

  toResponseDto(): ComplianceRequirementResponseDto {
    const dto: ComplianceRequirementResponseDto = {
      id: this.id,
      familyId: this.familyId,
      academicYearId: this.academicYearId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.academicYearTitle !== undefined) {
      dto.academicYearTitle = this.academicYearTitle;
    }
    if (this.learnerId !== undefined) {
      dto.learnerId = this.learnerId;
    }
    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.jurisdiction !== undefined) {
      dto.jurisdiction = this.jurisdiction;
    }
    if (this.minInstructionalDays !== undefined) {
      dto.minInstructionalDays = this.minInstructionalDays;
    }
    if (this.minInstructionalHours !== undefined) {
      dto.minInstructionalHours = this.minInstructionalHours;
    }
    if (this.notes !== undefined) {
      dto.notes = this.notes;
    }

    return dto;
  }
}
