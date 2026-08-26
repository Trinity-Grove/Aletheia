import { describe, expect, it } from 'vitest';
import {
  notificationTypeSchema,
  createNotificationSchema,
  notificationItemResponseSchema,
  notificationFilterSchema,
  markNotificationReadSchema,
} from './notification.js';

const NOTIFICATION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FAMILY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const USER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('Notification Contracts', () => {
  describe('notificationTypeSchema', () => {
    it('validates all notification types', () => {
      const types = [
        'DEVOTIONAL_REMINDER',
        'DAILY_SCHEDULE_REMINDER',
        'ATTENDANCE_MISSING_REMINDER',
        'PRAYER_ANSWERED_ALERT',
        'SYSTEM_NOTICE',
      ] as const;

      for (const type of types) {
        expect(notificationTypeSchema.parse(type)).toBe(type);
      }
    });

    it('rejects invalid notification type', () => {
      expect(() => notificationTypeSchema.parse('INVALID_TYPE')).toThrow();
    });
  });

  describe('createNotificationSchema', () => {
    it('validates create notification payload', () => {
      const payload = {
        userId: USER_ID,
        type: 'DEVOTIONAL_REMINDER' as const,
        title: 'Momento Devocional em Família',
        message: 'O devocional de hoje sobre Sabedoria em Provérbios está pronto.',
        linkUrl: '/devotionals/daily',
        metadata: { devotionalId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' },
      };

      const parsed = createNotificationSchema.parse(payload);
      expect(parsed.userId).toBe(USER_ID);
      expect(parsed.type).toBe('DEVOTIONAL_REMINDER');
      expect(parsed.title).toBe('Momento Devocional em Família');
      expect(parsed.linkUrl).toBe('/devotionals/daily');
      expect(parsed.metadata).toEqual({ devotionalId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' });
    });

    it('rejects empty title or message', () => {
      const invalid = {
        userId: USER_ID,
        type: 'SYSTEM_NOTICE' as const,
        title: '',
        message: '',
      };

      expect(() => createNotificationSchema.parse(invalid)).toThrow();
    });
  });

  describe('notificationItemResponseSchema', () => {
    it('validates notification item response DTO', () => {
      const response = {
        id: NOTIFICATION_ID,
        familyId: FAMILY_ID,
        userId: USER_ID,
        type: 'ATTENDANCE_MISSING_REMINDER' as const,
        title: 'Registro de Frequência Pendente',
        message: 'Lembre-se de registrar a frequência de hoje para os educandos.',
        linkUrl: '/attendance',
        isRead: false,
        readAt: null,
        metadata: null,
        createdAt: '2026-08-26T15:00:00.000Z',
        updatedAt: '2026-08-26T15:00:00.000Z',
      };

      const parsed = notificationItemResponseSchema.parse(response);
      expect(parsed.id).toBe(NOTIFICATION_ID);
      expect(parsed.isRead).toBe(false);
      expect(parsed.readAt).toBeNull();
    });
  });

  describe('notificationFilterSchema', () => {
    it('validates filter parameters', () => {
      const filter = {
        isRead: false,
        type: 'DEVOTIONAL_REMINDER' as const,
        limit: 20,
        offset: 0,
      };

      const parsed = notificationFilterSchema.parse(filter);
      expect(parsed.isRead).toBe(false);
      expect(parsed.type).toBe('DEVOTIONAL_REMINDER');
      expect(parsed.limit).toBe(20);
    });
  });

  describe('markNotificationReadSchema', () => {
    it('validates default mark as read', () => {
      const parsed = markNotificationReadSchema.parse({});
      expect(parsed.isRead).toBe(true);
    });
  });
});
