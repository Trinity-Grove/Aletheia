import { describe, expect, it } from 'vitest';
import {
  attendanceSourceSchema,
  logAttendanceSchema,
  attendanceResponseSchema,
  type AttendanceSource,
} from './reports.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ATTENDANCE_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

describe('Attendance Source and Reports Schemas', () => {
  describe('attendanceSourceSchema', () => {
    it('validates all allowed attendance sources', () => {
      const sources: AttendanceSource[] = ['MANUAL', 'AUTO_LESSON', 'BULK_IMPORT'];
      for (const source of sources) {
        expect(attendanceSourceSchema.parse(source)).toBe(source);
      }
    });

    it('rejects invalid attendance source', () => {
      expect(() => attendanceSourceSchema.parse('AUTOMATIC')).toThrow();
    });
  });

  describe('logAttendanceSchema source handling', () => {
    it('defaults source to MANUAL when omitted', () => {
      const parsed = logAttendanceSchema.parse({
        learnerId: LEARNER_ID,
        date: '2026-10-10',
      });
      expect(parsed.source).toBe('MANUAL');
    });

    it('accepts explicit AUTO_LESSON source', () => {
      const parsed = logAttendanceSchema.parse({
        learnerId: LEARNER_ID,
        date: '2026-10-10',
        source: 'AUTO_LESSON',
      });
      expect(parsed.source).toBe('AUTO_LESSON');
    });

    it('accepts explicit BULK_IMPORT source', () => {
      const parsed = logAttendanceSchema.parse({
        learnerId: LEARNER_ID,
        date: '2026-10-10',
        source: 'BULK_IMPORT',
      });
      expect(parsed.source).toBe('BULK_IMPORT');
    });
  });

  describe('attendanceResponseSchema source validation', () => {
    it('validates attendance response containing source', () => {
      const parsed = attendanceResponseSchema.parse({
        id: ATTENDANCE_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        date: '2026-10-10',
        status: 'PRESENT',
        source: 'AUTO_LESSON',
        isAutoLogged: true,
        createdAt: '2026-10-10T12:00:00.000Z',
        updatedAt: '2026-10-10T12:00:00.000Z',
      });
      expect(parsed.source).toBe('AUTO_LESSON');
    });

    it('rejects attendance response missing source', () => {
      expect(() =>
        attendanceResponseSchema.parse({
          id: ATTENDANCE_ID,
          familyId: FAMILY_ID,
          learnerId: LEARNER_ID,
          date: '2026-10-10',
          status: 'PRESENT',
          isAutoLogged: false,
          createdAt: '2026-10-10T12:00:00.000Z',
          updatedAt: '2026-10-10T12:00:00.000Z',
        }),
      ).toThrow();
    });
  });
});
