import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateNotificationDto,
  NotificationFilterDto,
  NotificationItemResponseDto,
} from '@aletheia/contracts';
import { NotificationRepository } from '../infrastructure/notification.repository.js';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async createNotification(
    familyId: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationItemResponseDto> {
    const notification = await this.notificationRepository.create(familyId, dto);
    return notification.toResponseDto();
  }

  async listNotifications(
    familyId: string,
    userId: string,
    filter?: NotificationFilterDto,
  ): Promise<NotificationItemResponseDto[]> {
    const notifications = await this.notificationRepository.findMany(familyId, userId, filter);
    return notifications.map((n) => n.toResponseDto());
  }

  async markAsRead(
    familyId: string,
    id: string,
    userId: string,
    isRead = true,
  ): Promise<NotificationItemResponseDto> {
    const updated = await this.notificationRepository.updateReadStatus(
      familyId,
      id,
      userId,
      isRead,
      isRead ? new Date() : null,
    );

    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found.`);
    }

    return updated.toResponseDto();
  }

  async markAllAsRead(familyId: string, userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.markAllAsRead(familyId, userId);
    return { count };
  }

  async getUnreadCount(familyId: string, userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(familyId, userId);
    return { count };
  }
}
