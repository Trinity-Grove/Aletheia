import type { FamilySettingsResponseDto, GradingScale } from '@aletheia/contracts';

export interface FamilySettingsProps {
  id: string;
  familyId: string;
  homeschoolName?: string | null | undefined;
  defaultGradingScale: GradingScale;
  timezone: string;
  language: string;
  devotionalReminderTime?: string | null | undefined;
  dailyScheduleReminderTime?: string | null | undefined;
  attendanceReminderEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FamilySettingsEntity {
  constructor(private readonly props: FamilySettingsProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get homeschoolName(): string | null | undefined {
    return this.props.homeschoolName;
  }

  get defaultGradingScale(): GradingScale {
    return this.props.defaultGradingScale;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get language(): string {
    return this.props.language;
  }

  get devotionalReminderTime(): string | null | undefined {
    return this.props.devotionalReminderTime;
  }

  get dailyScheduleReminderTime(): string | null | undefined {
    return this.props.dailyScheduleReminderTime;
  }

  get attendanceReminderEnabled(): boolean {
    return this.props.attendanceReminderEnabled;
  }

  get emailNotificationsEnabled(): boolean {
    return this.props.emailNotificationsEnabled;
  }

  get inAppNotificationsEnabled(): boolean {
    return this.props.inAppNotificationsEnabled;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toResponseDto(): FamilySettingsResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      homeschoolName: this.homeschoolName ?? null,
      defaultGradingScale: this.defaultGradingScale,
      timezone: this.timezone,
      language: this.language,
      devotionalReminderTime: this.devotionalReminderTime ?? null,
      dailyScheduleReminderTime: this.dailyScheduleReminderTime ?? null,
      attendanceReminderEnabled: this.attendanceReminderEnabled,
      emailNotificationsEnabled: this.emailNotificationsEnabled,
      inAppNotificationsEnabled: this.inAppNotificationsEnabled,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
