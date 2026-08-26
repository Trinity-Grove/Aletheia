import type { DataExportJobResponseDto, ExportStatus } from '@aletheia/contracts';

export interface DataExportJobProps {
  id: string;
  familyId: string;
  requestedById: string;
  status: ExportStatus;
  downloadUrl?: string | null | undefined;
  fileSizeBytes?: number | null | undefined;
  completedAt?: Date | null | undefined;
  errorReason?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class DataExportJobEntity {
  constructor(private readonly props: DataExportJobProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get requestedById(): string {
    return this.props.requestedById;
  }

  get status(): ExportStatus {
    return this.props.status;
  }

  get downloadUrl(): string | null | undefined {
    return this.props.downloadUrl;
  }

  get fileSizeBytes(): number | null | undefined {
    return this.props.fileSizeBytes;
  }

  get completedAt(): Date | null | undefined {
    return this.props.completedAt;
  }

  get errorReason(): string | null | undefined {
    return this.props.errorReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markProcessing(): void {
    this.props.status = 'PROCESSING';
    this.props.updatedAt = new Date();
  }

  markCompleted(downloadUrl: string, fileSizeBytes: number, completedAt?: Date): void {
    this.props.status = 'COMPLETED';
    this.props.downloadUrl = downloadUrl;
    this.props.fileSizeBytes = fileSizeBytes;
    this.props.completedAt = completedAt ?? new Date();
    this.props.errorReason = null;
    this.props.updatedAt = new Date();
  }

  markFailed(errorReason: string): void {
    this.props.status = 'FAILED';
    this.props.errorReason = errorReason;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toResponseDto(): DataExportJobResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      requestedById: this.requestedById,
      status: this.status,
      downloadUrl: this.downloadUrl ?? null,
      fileSizeBytes: this.fileSizeBytes ?? null,
      completedAt: this.completedAt ? this.completedAt.toISOString() : null,
      errorReason: this.errorReason ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
