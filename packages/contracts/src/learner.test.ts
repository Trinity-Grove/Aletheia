import { describe, expect, it } from 'vitest';
import {
  educationalStageSchema,
  createLearnerSchema,
  updateLearnerSchema,
  learnerResponseSchema,
  learnerSummarySchema,
  type EducationalStage,
  type CreateLearnerDto,
  type UpdateLearnerDto,
  type LearnerResponseDto,
  type LearnerSummaryDto,
} from './learner.js';

describe('learner contracts', () => {
  describe('educationalStageSchema', () => {
    it('accepts valid educational stages', () => {
      const validStages: EducationalStage[] = [
        'EARLY_YEARS',
        'PRIMARY_GRAMMAR',
        'MIDDLE_LOGIC',
        'HIGH_RHETORIC',
        'OTHER',
      ];

      for (const stage of validStages) {
        expect(educationalStageSchema.safeParse(stage).success).toBe(true);
      }
    });

    it('rejects invalid educational stages', () => {
      expect(educationalStageSchema.safeParse('KINDERGARTEN').success).toBe(false);
      expect(educationalStageSchema.safeParse('UNIVERSITY').success).toBe(false);
      expect(educationalStageSchema.safeParse('').success).toBe(false);
    });
  });

  describe('createLearnerSchema', () => {
    it('validates a valid create learner payload and applies default stage', () => {
      const payload = {
        firstName: 'John',
        birthDate: '2016-05-14',
      };

      const result = createLearnerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stage).toBe('PRIMARY_GRAMMAR');
        expect(result.data.firstName).toBe('John');
        expect(result.data.birthDate).toBe('2016-05-14');
      }
    });

    it('validates a full create learner payload', () => {
      const payload: CreateLearnerDto = {
        firstName: 'Alice',
        lastName: 'Smith',
        preferredName: 'Ali',
        birthDate: '2018-09-20',
        stage: 'EARLY_YEARS',
        customGrade: 'Kindergarten',
        avatarColor: '#4F46E5',
        specialNeeds: 'ADHD accommodation needed',
        notes: 'Enjoys reading and puzzles',
      };

      const result = createLearnerSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload);
      }
    });

    it('rejects invalid birthDate format', () => {
      expect(
        createLearnerSchema.safeParse({
          firstName: 'John',
          birthDate: '14-05-2016',
        }).success,
      ).toBe(false);

      expect(
        createLearnerSchema.safeParse({
          firstName: 'John',
          birthDate: '2016/05/14',
        }).success,
      ).toBe(false);

      expect(
        createLearnerSchema.safeParse({
          firstName: 'John',
          birthDate: 'invalid-date',
        }).success,
      ).toBe(false);
    });

    it('rejects empty or overly long firstName', () => {
      expect(
        createLearnerSchema.safeParse({
          firstName: '',
          birthDate: '2016-05-14',
        }).success,
      ).toBe(false);

      expect(
        createLearnerSchema.safeParse({
          firstName: 'A'.repeat(101),
          birthDate: '2016-05-14',
        }).success,
      ).toBe(false);
    });
  });

  describe('updateLearnerSchema', () => {
    it('validates partial updates', () => {
      const partialUpdate: UpdateLearnerDto = {
        stage: 'MIDDLE_LOGIC',
        notes: 'Updated notes',
      };

      const result = updateLearnerSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates empty update payload', () => {
      const result = updateLearnerSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid fields in update', () => {
      const result = updateLearnerSchema.safeParse({
        birthDate: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('learnerResponseSchema & learnerSummarySchema', () => {
    it('validates full learner response DTO', () => {
      const response: LearnerResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        familyId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        birthDate: '2016-05-14',
        stage: 'PRIMARY_GRAMMAR',
        customGrade: '4th Grade',
        avatarColor: '#10B981',
        specialNeeds: null,
        notes: 'Doing great',
        archivedAt: null,
        createdAt: '2026-08-24T12:00:00.000Z',
        updatedAt: '2026-08-24T12:00:00.000Z',
      };

      expect(learnerResponseSchema.safeParse(response).success).toBe(true);
    });

    it('validates learner summary DTO', () => {
      const summary: LearnerSummaryDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        stage: 'PRIMARY_GRAMMAR',
        avatarColor: '#10B981',
      };

      expect(learnerSummarySchema.safeParse(summary).success).toBe(true);
    });
  });
});
