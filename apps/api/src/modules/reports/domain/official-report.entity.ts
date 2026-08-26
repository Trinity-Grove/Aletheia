import type {
  GradingScale,
  OfficialReportResponseDto,
  ReportType,
} from '@aletheia/contracts';

export class OfficialReportEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly academicYearId: string | null,
    public readonly type: ReportType,
    public readonly title: string,
    public readonly gradingScale: GradingScale,
    public readonly content: Record<string, any>,
    public readonly generatedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly learnerName?: string,
    public readonly academicYearTitle?: string,
  ) {}

  toResponseDto(): OfficialReportResponseDto {
    const dto: OfficialReportResponseDto = {
      id: this.id,
      familyId: this.familyId,
      learnerId: this.learnerId,
      type: this.type,
      title: this.title,
      gradingScale: this.gradingScale,
      content: this.content,
      generatedAt: this.generatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.academicYearTitle !== undefined) {
      dto.academicYearTitle = this.academicYearTitle;
    }

    return dto;
  }
}
