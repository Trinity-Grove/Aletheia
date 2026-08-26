import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { NotificationEntity } from '../domain/notification.entity.js';
import type {
  CreateNotificationDto,
  NotificationFilterDto,
  NotificationType,
} from '@aletheia/contracts';

interface NotificationDbRecord {
  id: string;
  familyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateNotificationDto): Promise<NotificationEntity> {
    const record = await this.prisma.notificationItem.create({
      data: {
        familyId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title.trim(),
        message: dto.message.trim(),
        linkUrl: dto.linkUrl?.trim() || null,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return this.mapToEntity(record as NotificationDbRecord);
  }

  async findById(familyId: string, id: string): Promise<NotificationEntity | null> {
    const record = await this.prisma.notificationItem.findFirst({
      where: {
        id,
        familyId,
      },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as NotificationDbRecord);
  }

  async findMany(
    familyId: string,
    userId: string,
    filter?: NotificationFilterDto,
  ): Promise<NotificationEntity[]> {
    const where: Prisma.NotificationItemWhereInput = {
      familyId,
      userId,
    };

    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }

    if (filter?.type !== undefined) {
      where.type = filter.type;
    }

    const records = await this.prisma.notificationItem.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: filter?.limit ?? 50,
      skip: filter?.offset ?? 0,
    });

    return records.map((record) => this.mapToEntity(record as NotificationDbRecord));
  }

  async countUnread(familyId: string, userId: string): Promise<number> {
    return this.prisma.notificationItem.count({
      where: {
        familyId,
        userId,
        isRead: false,
      },
    });
  }

  async updateReadStatus(
    familyId: string,
    id: string,
    userId: string,
    isRead: boolean,
    readAt?: Date | null,
  ): Promise<NotificationEntity | null> {
    const existing = await this.prisma.notificationItem.findFirst({
      where: {
        id,
        familyId,
        userId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.notificationItem.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? (readAt ?? new Date()) : null,
      },
    });

    return this.mapToEntity(updated as NotificationDbRecord);
  }

  async markAllAsRead(familyId: string, userId: string): Promise<number> {
    const result = await this.prisma.notificationItem.updateMany({
      where: {
        familyId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  private mapToEntity(record: NotificationDbRecord): NotificationEntity {
    return new NotificationEntity({
      id: record.id,
      familyId: record.familyId,
      userId: record.userId,
      type: record.type,
      title: record.title,
      message: record.message,
      linkUrl: record.linkUrl,
      isRead: record.isRead,
      readAt: record.readAt,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
