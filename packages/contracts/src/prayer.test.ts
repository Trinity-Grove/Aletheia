import { describe, expect, it } from 'vitest';
import {
  answerPrayerSchema,
  createPrayerSchema,
  prayerResponseSchema,
  prayerTypeSchema,
  updatePrayerSchema,
  type AnswerPrayerDto,
  type CreatePrayerDto,
  type PrayerResponseDto,
  type PrayerType,
  type UpdatePrayerDto,
} from './prayer.js';

describe('prayer contracts', () => {
  describe('prayerTypeSchema', () => {
    it('accepts valid prayer types', () => {
      const petition: PrayerType = 'PETITION';
      const gratitude: PrayerType = 'GRATITUDE';

      expect(prayerTypeSchema.safeParse(petition).success).toBe(true);
      expect(prayerTypeSchema.safeParse(gratitude).success).toBe(true);
    });

    it('rejects invalid prayer types', () => {
      expect(prayerTypeSchema.safeParse('CONFESSION').success).toBe(false);
      expect(prayerTypeSchema.safeParse('').success).toBe(false);
    });
  });

  describe('createPrayerSchema', () => {
    it('validates a valid prayer request with defaults and optional learnerId', () => {
      const payload = {
        title: 'Healing for Grandma',
      };

      const result = createPrayerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('PETITION');
      }
    });

    it('validates a gratitude prayer with learnerId and description', () => {
      const payload: CreatePrayerDto = {
        type: 'GRATITUDE',
        title: 'Thank God for safety on our trip',
        description: 'We had a safe journey home today.',
        learnerId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createPrayerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects empty title or title exceeding max length', () => {
      expect(
        createPrayerSchema.safeParse({
          title: '',
        }).success,
      ).toBe(false);

      expect(
        createPrayerSchema.safeParse({
          title: 'a'.repeat(201),
        }).success,
      ).toBe(false);
    });

    it('rejects invalid learnerId format if not uuid', () => {
      expect(
        createPrayerSchema.safeParse({
          title: 'Valid title',
          learnerId: 'not-a-uuid',
        }).success,
      ).toBe(false);
    });
  });

  describe('updatePrayerSchema', () => {
    it('allows partial updates', () => {
      const payload: UpdatePrayerDto = {
        title: 'Updated title',
      };

      expect(updatePrayerSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('answerPrayerSchema', () => {
    it('validates answer prayer with note', () => {
      const payload: AnswerPrayerDto = {
        answeredNote: 'Grandma is fully recovered!',
      };

      expect(answerPrayerSchema.safeParse(payload).success).toBe(true);
    });

    it('validates answer prayer without note', () => {
      const payload: AnswerPrayerDto = {};
      expect(answerPrayerSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('prayerResponseSchema', () => {
    it('validates full prayer response DTO', () => {
      const response: PrayerResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        familyId: '123e4567-e89b-12d3-a456-426614174001',
        learnerId: '123e4567-e89b-12d3-a456-426614174002',
        type: 'PETITION',
        title: 'Healing for Grandma',
        description: 'She has a fever.',
        isAnswered: true,
        answeredAt: '2026-08-24T12:00:00.000Z',
        answeredNote: 'Praise God she feels much better.',
        archivedAt: null,
        createdAt: '2026-08-24T10:00:00.000Z',
        updatedAt: '2026-08-24T12:00:00.000Z',
      };

      expect(prayerResponseSchema.safeParse(response).success).toBe(true);
    });
  });
});
