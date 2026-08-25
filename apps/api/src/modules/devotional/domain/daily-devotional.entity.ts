import type { DailyDevotionalResponseDto } from '@aletheia/contracts';

export interface DailyDevotionalProps {
  id: string;
  familyId: string;
  date: Date;
  bibleReference: string;
  bibleVersionId?: string | null | undefined;
  passageText?: string | null | undefined;
  reflection?: string | null | undefined;
  memoryVerse?: string | null | undefined;
  hymnOrSong?: string | null | undefined;
  discussionQuestions?: string | null | undefined;
  practicalApplication?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class DailyDevotionalEntity {
  constructor(private readonly props: DailyDevotionalProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get date(): Date {
    return this.props.date;
  }

  get bibleReference(): string {
    return this.props.bibleReference;
  }

  get bibleVersionId(): string | null | undefined {
    return this.props.bibleVersionId;
  }

  get passageText(): string | null | undefined {
    return this.props.passageText;
  }

  get reflection(): string | null | undefined {
    return this.props.reflection;
  }

  get memoryVerse(): string | null | undefined {
    return this.props.memoryVerse;
  }

  get hymnOrSong(): string | null | undefined {
    return this.props.hymnOrSong;
  }

  get discussionQuestions(): string | null | undefined {
    return this.props.discussionQuestions;
  }

  get practicalApplication(): string | null | undefined {
    return this.props.practicalApplication;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  toResponseDto(): DailyDevotionalResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      date: this.formatDateOnly(this.date),
      bibleReference: this.bibleReference,
      bibleVersionId: this.bibleVersionId ?? null,
      passageText: this.passageText ?? null,
      reflection: this.reflection ?? null,
      memoryVerse: this.memoryVerse ?? null,
      hymnOrSong: this.hymnOrSong ?? null,
      discussionQuestions: this.discussionQuestions ?? null,
      practicalApplication: this.practicalApplication ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
