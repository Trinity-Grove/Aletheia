import type { PrayerResponseDto, PrayerType } from '@aletheia/contracts';

export interface PrayerRequestProps {
  id: string;
  familyId: string;
  learnerId?: string | null | undefined;
  type: PrayerType;
  title: string;
  description?: string | null | undefined;
  isAnswered: boolean;
  answeredAt?: Date | null | undefined;
  answeredNote?: string | null | undefined;
  archivedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class PrayerRequestEntity {
  constructor(private readonly props: PrayerRequestProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get learnerId(): string | null | undefined {
    return this.props.learnerId;
  }

  get type(): PrayerType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get isAnswered(): boolean {
    return this.props.isAnswered;
  }

  get answeredAt(): Date | null | undefined {
    return this.props.answeredAt;
  }

  get answeredNote(): string | null | undefined {
    return this.props.answeredNote;
  }

  get archivedAt(): Date | null | undefined {
    return this.props.archivedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isArchived(): boolean {
    return this.props.archivedAt !== null && this.props.archivedAt !== undefined;
  }

  toResponseDto(): PrayerResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      learnerId: this.learnerId ?? null,
      type: this.type,
      title: this.title,
      description: this.description ?? null,
      isAnswered: this.isAnswered,
      answeredAt: this.answeredAt ? this.answeredAt.toISOString() : null,
      answeredNote: this.answeredNote ?? null,
      archivedAt: this.archivedAt ? this.archivedAt.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
