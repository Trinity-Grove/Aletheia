import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from '../infrastructure/notification.repository.js';
import { NotificationEntity } from '../domain/notification.entity.js';
import type {
  CreateNotificationDto,
  NotificationFilterDto,
} from '@aletheia/contracts';

describe('NotificationService', () => {
  let service: NotificationService;
  let notifications: Map<string, NotificationEntity>;

  beforeEach(() => {
    notifications = new Map();

    const mockRepo = {
      create: async (familyId: string, dto: CreateNotificationDto) => {
        const id = `notif-${notifications.size + 1}`;
        const entity = new NotificationEntity({
          id,
          familyId,
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          linkUrl: dto.linkUrl ?? null,
          isRead: false,
          readAt: null,
          metadata: dto.metadata ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        notifications.set(id, entity);
        return entity;
      },
      findById: async (familyId: string, id: string) => {
        const item = notifications.get(id);
        if (!item || item.familyId !== familyId) return null;
        return item;
      },
      findMany: async (
        familyId: string,
        userId: string,
        filter?: NotificationFilterDto,
      ) => {
        let items = Array.from(notifications.values()).filter(
          (n) => n.familyId === familyId && n.userId === userId,
        );
        if (filter?.isRead !== undefined) {
          items = items.filter((n) => n.isRead === filter.isRead);
        }
        if (filter?.type !== undefined) {
          items = items.filter((n) => n.type === filter.type);
        }
        const offset = filter?.offset ?? 0;
        const limit = filter?.limit ?? 50;
        return items.slice(offset, offset + limit);
      },
      countUnread: async (familyId: string, userId: string) => {
        return Array.from(notifications.values()).filter(
          (n) => n.familyId === familyId && n.userId === userId && !n.isRead,
        ).length;
      },
      updateReadStatus: async (
        familyId: string,
        id: string,
        userId: string,
        isRead: boolean,
        readAt?: Date | null,
      ) => {
        const item = notifications.get(id);
        if (!item || item.familyId !== familyId || item.userId !== userId) {
          return null;
        }
        if (isRead) {
          item.markAsRead(readAt ?? new Date());
        } else {
          item.markAsUnread();
        }
        return item;
      },
      markAllAsRead: async (familyId: string, userId: string) => {
        let count = 0;
        for (const item of notifications.values()) {
          if (item.familyId === familyId && item.userId === userId && !item.isRead) {
            item.markAsRead();
            count++;
          }
        }
        return count;
      },
    } as unknown as NotificationRepository;

    service = new NotificationService(mockRepo);
  });

  describe('createNotification', () => {
    it('creates a new notification', async () => {
      const result = await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DEVOTIONAL_REMINDER',
        title: 'Morning Devotional',
        message: 'Time for family devotional.',
        linkUrl: '/devotional',
        metadata: { reminderId: '123' },
      });

      expect(result.id).toBeDefined();
      expect(result.familyId).toBe('fam-1');
      expect(result.userId).toBe('user-1');
      expect(result.type).toBe('DEVOTIONAL_REMINDER');
      expect(result.title).toBe('Morning Devotional');
      expect(result.message).toBe('Time for family devotional.');
      expect(result.linkUrl).toBe('/devotional');
      expect(result.isRead).toBe(false);
      expect(result.metadata).toEqual({ reminderId: '123' });
    });
  });

  describe('listNotifications', () => {
    it('lists notifications for a user in a family', async () => {
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DEVOTIONAL_REMINDER',
        title: 'Devotional 1',
        message: 'Msg 1',
      });
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DAILY_SCHEDULE_REMINDER',
        title: 'Schedule 1',
        message: 'Msg 2',
      });
      await service.createNotification('fam-1', {
        userId: 'user-2',
        type: 'SYSTEM_NOTICE',
        title: 'Notice',
        message: 'Msg 3',
      });

      const list = await service.listNotifications('fam-1', 'user-1');
      expect(list).toHaveLength(2);
    });

    it('filters notifications by isRead and type', async () => {
      const notif1 = await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DEVOTIONAL_REMINDER',
        title: 'Devotional 1',
        message: 'Msg 1',
      });
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'ATTENDANCE_MISSING_REMINDER',
        title: 'Attendance',
        message: 'Msg 2',
      });

      await service.markAsRead('fam-1', notif1.id, 'user-1');

      const unread = await service.listNotifications('fam-1', 'user-1', { isRead: false });
      expect(unread).toHaveLength(1);
      expect(unread[0]?.title).toBe('Attendance');

      const devotionalList = await service.listNotifications('fam-1', 'user-1', {
        type: 'DEVOTIONAL_REMINDER',
      });
      expect(devotionalList).toHaveLength(1);
      expect(devotionalList[0]?.title).toBe('Devotional 1');
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const created = await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'PRAYER_ANSWERED_ALERT',
        title: 'Prayer Answered',
        message: 'Praise God!',
      });

      const updated = await service.markAsRead('fam-1', created.id, 'user-1');
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('throws NotFoundException if notification does not exist or user mismatch', async () => {
      await expect(service.markAsRead('fam-1', 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read for user', async () => {
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DEVOTIONAL_REMINDER',
        title: '1',
        message: '1',
      });
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DAILY_SCHEDULE_REMINDER',
        title: '2',
        message: '2',
      });

      const result = await service.markAllAsRead('fam-1', 'user-1');
      expect(result.count).toBe(2);

      const unreadCount = await service.getUnreadCount('fam-1', 'user-1');
      expect(unreadCount.count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('returns the number of unread notifications', async () => {
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DEVOTIONAL_REMINDER',
        title: '1',
        message: '1',
      });
      await service.createNotification('fam-1', {
        userId: 'user-1',
        type: 'DAILY_SCHEDULE_REMINDER',
        title: '2',
        message: '2',
      });

      const count = await service.getUnreadCount('fam-1', 'user-1');
      expect(count.count).toBe(2);
    });
  });
});
