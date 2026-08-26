import { describe, expect, it } from 'vitest';
import {
  updateFamilySettingsSchema,
  familySettingsResponseSchema,
} from './settings.js';

const SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FAMILY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('Family Settings Contracts', () => {
  describe('updateFamilySettingsSchema', () => {
    it('validates a valid partial update payload', () => {
      const payload = {
        homeschoolName: 'Academia Família Silva',
        defaultGradingScale: 'LETTER_A_F' as const,
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        devotionalReminderTime: '08:00',
        dailyScheduleReminderTime: '07:30',
        attendanceReminderEnabled: true,
        emailNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      };

      const parsed = updateFamilySettingsSchema.parse(payload);
      expect(parsed.homeschoolName).toBe('Academia Família Silva');
      expect(parsed.defaultGradingScale).toBe('LETTER_A_F');
      expect(parsed.timezone).toBe('America/Sao_Paulo');
      expect(parsed.devotionalReminderTime).toBe('08:00');
      expect(parsed.dailyScheduleReminderTime).toBe('07:30');
      expect(parsed.emailNotificationsEnabled).toBe(false);
    });

    it('allows empty/partial fields', () => {
      const payload = {
        timezone: 'UTC',
      };

      const parsed = updateFamilySettingsSchema.parse(payload);
      expect(parsed.timezone).toBe('UTC');
      expect(parsed.homeschoolName).toBeUndefined();
    });

    it('validates nullish reminder times', () => {
      const payload = {
        devotionalReminderTime: null,
        dailyScheduleReminderTime: null,
      };

      const parsed = updateFamilySettingsSchema.parse(payload);
      expect(parsed.devotionalReminderTime).toBeNull();
      expect(parsed.dailyScheduleReminderTime).toBeNull();
    });

    it('rejects invalid time format for reminders', () => {
      const invalid = {
        devotionalReminderTime: '25:99',
      };

      expect(() => updateFamilySettingsSchema.parse(invalid)).toThrow();
    });
  });

  describe('familySettingsResponseSchema', () => {
    it('validates complete family settings response DTO', () => {
      const response = {
        id: SETTINGS_ID,
        familyId: FAMILY_ID,
        homeschoolName: 'Academia Família Silva',
        defaultGradingScale: 'MASTERY_QUALITATIVE' as const,
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        devotionalReminderTime: '08:00',
        dailyScheduleReminderTime: '07:30',
        attendanceReminderEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        createdAt: '2026-08-26T10:00:00.000Z',
        updatedAt: '2026-08-26T10:00:00.000Z',
      };

      const parsed = familySettingsResponseSchema.parse(response);
      expect(parsed.id).toBe(SETTINGS_ID);
      expect(parsed.familyId).toBe(FAMILY_ID);
      expect(parsed.defaultGradingScale).toBe('MASTERY_QUALITATIVE');
      expect(parsed.attendanceReminderEnabled).toBe(true);
    });
  });
});
