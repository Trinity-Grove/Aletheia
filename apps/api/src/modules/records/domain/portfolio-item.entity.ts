import type {
  EvidenceType,
  PortfolioItemResponseDto,
} from '@aletheia/contracts';

export class PortfolioItemEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly learningRecordId: string | null,
    public readonly academicYearId: string | null,
    public readonly subjectId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly type: EvidenceType,
    public readonly fileUrl: string | null,
    public readonly textContent: string | null,
    public readonly mimeType: string | null,
    public readonly fileSizeBytes: number | null,
    public readonly capturedAt: Date | null,
    public readonly isHighlight: boolean,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly learnerName?: string,
    public readonly subjectName?: string | null,
  ) {}

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): PortfolioItemResponseDto {
    const dto: PortfolioItemResponseDto = {
      id: this.id,
      familyId: this.familyId,
      learnerId: this.learnerId,
      title: this.title,
      type: this.type,
      isHighlight: this.isHighlight,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };

    if (this.learnerName !== undefined) {
      dto.learnerName = this.learnerName;
    }
    if (this.learningRecordId !== undefined) {
      dto.learningRecordId = this.learningRecordId;
    }
    if (this.academicYearId !== undefined) {
      dto.academicYearId = this.academicYearId;
    }
    if (this.subjectId !== undefined) {
      dto.subjectId = this.subjectId;
    }
    if (this.subjectName !== undefined) {
      dto.subjectName = this.subjectName;
    }
    if (this.description !== undefined) {
      dto.description = this.description;
    }
    if (this.fileUrl !== undefined) {
      dto.fileUrl = this.fileUrl;
    }
    if (this.textContent !== undefined) {
      dto.textContent = this.textContent;
    }
    if (this.mimeType !== undefined) {
      dto.mimeType = this.mimeType;
    }
    if (this.fileSizeBytes !== undefined) {
      dto.fileSizeBytes = this.fileSizeBytes;
    }
    if (this.capturedAt !== null && this.capturedAt !== undefined) {
      dto.capturedAt = this.formatDateOnly(this.capturedAt);
    } else if (this.capturedAt === null) {
      dto.capturedAt = null;
    }

    return dto;
  }
}
