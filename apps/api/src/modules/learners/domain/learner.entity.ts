import { EducationalStage } from './educational-stage.js';
import type { LearnerResponseDto, LearnerSummaryDto } from '@aletheia/contracts';

export interface LearnerProps {
  id: string;
  familyId: string;
  firstName: string;
  lastName?: string | null | undefined;
  preferredName?: string | null | undefined;
  birthDate: Date;
  stage: EducationalStage;
  customGrade?: string | null | undefined;
  avatarColor?: string | null | undefined;
  specialNeeds?: string | null | undefined;
  notes?: string | null | undefined;
  archivedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class LearnerEntity {
  constructor(private readonly props: LearnerProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string | null | undefined {
    return this.props.lastName;
  }

  get preferredName(): string | null | undefined {
    return this.props.preferredName;
  }

  get birthDate(): Date {
    return this.props.birthDate;
  }

  get stage(): EducationalStage {
    return this.props.stage;
  }

  get customGrade(): string | null | undefined {
    return this.props.customGrade;
  }

  get avatarColor(): string | null | undefined {
    return this.props.avatarColor;
  }

  get specialNeeds(): string | null | undefined {
    return this.props.specialNeeds;
  }

  get notes(): string | null | undefined {
    return this.props.notes;
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

  get displayName(): string {
    if (this.props.preferredName && this.props.preferredName.trim().length > 0) {
      return this.props.preferredName.trim();
    }
    if (this.props.lastName && this.props.lastName.trim().length > 0) {
      return `${this.props.firstName.trim()} ${this.props.lastName.trim()}`;
    }
    return this.props.firstName.trim();
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): LearnerResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      firstName: this.firstName,
      lastName: this.lastName ?? null,
      preferredName: this.preferredName ?? null,
      birthDate: this.formatDateOnly(this.birthDate),
      stage: this.stage,
      customGrade: this.customGrade ?? null,
      avatarColor: this.avatarColor ?? null,
      specialNeeds: this.specialNeeds ?? null,
      notes: this.notes ?? null,
      archivedAt: this.archivedAt ? this.archivedAt.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  toSummaryDto(): LearnerSummaryDto {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName ?? null,
      preferredName: this.preferredName ?? null,
      stage: this.stage,
      avatarColor: this.avatarColor ?? null,
    };
  }
}
