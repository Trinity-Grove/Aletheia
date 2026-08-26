import type { NotificationItemResponseDto, NotificationType } from '@aletheia/contracts';

export interface NotificationProps {
  id: string;
  familyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null | undefined;
  isRead: boolean;
  readAt?: Date | null | undefined;
  metadata?: Record<string, any> | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationEntity {
  constructor(private readonly props: NotificationProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get linkUrl(): string | null | undefined {
    return this.props.linkUrl;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get readAt(): Date | null | undefined {
    return this.props.readAt;
  }

  get metadata(): Record<string, any> | null | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsRead(readAt?: Date): void {
    this.props.isRead = true;
    this.props.readAt = readAt ?? new Date();
    this.props.updatedAt = new Date();
  }

  markAsUnread(): void {
    this.props.isRead = false;
    this.props.readAt = null;
    this.props.updatedAt = new Date();
  }

  toResponseDto(): NotificationItemResponseDto {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      linkUrl: this.linkUrl ?? null,
      isRead: this.isRead,
      readAt: this.readAt ? this.readAt.toISOString() : null,
      metadata: this.metadata ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
