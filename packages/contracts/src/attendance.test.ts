import { describe, expect, it } from 'vitest';
import {
  attendanceStatusSchema,
  logAttendanceSchema,
  bulkLogAttendanceSchema,
  attendanceResponseSchema,
  attendanceFilterSchema,
  upsertComplianceRequirementSchema,
  complianceRequirementResponseSchema,
  attendanceComplianceSummarySchema,
} from './attendance.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const LEARNER_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const ATTENDANCE_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const REQUIREMENT_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

describe('Attendance and Compliance Contracts', () => {
  describe('attendanceStatusSchema', () => {
    it('validates all allowed attendance status values', () => {
      const validStatuses = [
        'PRESENT',
        'EXCUSED_ABSENCE',
        'UNEXCUSED_ABSENCE',
        'HOLIDAY',
        'FIELD_TRIP',
        'SICK',
      ] as const;

      for (const status of validStatuses) {
        expect(attendanceStatusSchema.parse(status)).toBe(status);
      }
    });

    it('rejects invalid status', () => {
      expect(() => attendanceStatusSchema.parse('INVALID_STATUS')).toThrow();
    });
  });

  describe('logAttendanceSchema', () => {
    it('validates a valid log attendance payload with defaults', () => {
      const payload = {
        learnerId: LEARNER_ID,
        date: '2026-03-15',
      };

      const parsed = logAttendanceSchema.parse(payload);
      expect(parsed.learnerId).toBe(LEARNER_ID);
      expect(parsed.date).toBe('2026-03-15');
      expect(parsed.status).toBe('PRESENT');
      expect(parsed.isAutoLogged).toBe(false);
      expect(parsed.hoursSpent).toBeUndefined();
      expect(parsed.notes).toBeUndefined();
    });

    it('validates a complete log attendance payload with custom hours and notes', () => {
      const payload = {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        date: '2026-03-15',
        status: 'FIELD_TRIP' as const,
        hoursSpent: 5.5,
        notes: 'Visita ao museu de ciências e jardim botânico',
        isAutoLogged: true,
      };

      const parsed = logAttendanceSchema.parse(payload);
      expect(parsed.status).toBe('FIELD_TRIP');
      expect(parsed.hoursSpent).toBe(5.5);
      expect(parsed.isAutoLogged).toBe(true);
    });

    it('rejects invalid date format', () => {
      const invalid = {
        learnerId: LEARNER_ID,
        date: '15/03/2026',
      };

      expect(() => logAttendanceSchema.parse(invalid)).toThrow('date must be in YYYY-MM-DD format');
    });

    it('rejects invalid hours spent', () => {
      const invalid = {
        learnerId: LEARNER_ID,
        date: '2026-03-15',
        hoursSpent: 25,
      };

      expect(() => logAttendanceSchema.parse(invalid)).toThrow();
    });
  });

  describe('bulkLogAttendanceSchema', () => {
    it('validates bulk attendance logging for multiple learners', () => {
      const payload = {
        learnerIds: [LEARNER_ID, LEARNER_2_ID],
        academicYearId: YEAR_ID,
        date: '2026-03-15',
        status: 'PRESENT' as const,
        hoursSpent: 4,
        notes: 'Dia letivo regular em família',
      };

      const parsed = bulkLogAttendanceSchema.parse(payload);
      expect(parsed.learnerIds).toHaveLength(2);
      expect(parsed.date).toBe('2026-03-15');
      expect(parsed.status).toBe('PRESENT');
      expect(parsed.hoursSpent).toBe(4);
    });

    it('rejects empty learnerIds in bulk logging', () => {
      const invalid = {
        learnerIds: [],
        date: '2026-03-15',
      };

      expect(() => bulkLogAttendanceSchema.parse(invalid)).toThrow();
    });
  });

  describe('attendanceResponseSchema', () => {
    it('validates attendance response DTO', () => {
      const response = {
        id: ATTENDANCE_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        academicYearId: YEAR_ID,
        date: '2026-03-15',
        status: 'PRESENT' as const,
        hoursSpent: 4.5,
        notes: 'Aulas completadas com sucesso',
        isAutoLogged: false,
        createdAt: '2026-03-15T12:00:00.000Z',
        updatedAt: '2026-03-15T12:00:00.000Z',
      };

      const parsed = attendanceResponseSchema.parse(response);
      expect(parsed.id).toBe(ATTENDANCE_ID);
      expect(parsed.learnerName).toBe('Ester Sá');
      expect(parsed.hoursSpent).toBe(4.5);
    });
  });

  describe('attendanceFilterSchema', () => {
    it('validates attendance filter query parameters', () => {
      const filter = {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: 'PRESENT' as const,
      };

      const parsed = attendanceFilterSchema.parse(filter);
      expect(parsed.learnerId).toBe(LEARNER_ID);
      expect(parsed.startDate).toBe('2026-01-01');
      expect(parsed.status).toBe('PRESENT');
    });
  });

  describe('upsertComplianceRequirementSchema', () => {
    it('validates upserting compliance requirement', () => {
      const requirement = {
        academicYearId: YEAR_ID,
        learnerId: LEARNER_ID,
        jurisdiction: 'Brazil - LDB 200 days / 800 hours',
        minInstructionalDays: 200,
        minInstructionalHours: 800,
        notes: 'Requisito padrão nacional',
      };

      const parsed = upsertComplianceRequirementSchema.parse(requirement);
      expect(parsed.academicYearId).toBe(YEAR_ID);
      expect(parsed.minInstructionalDays).toBe(200);
      expect(parsed.minInstructionalHours).toBe(800);
    });
  });

  describe('complianceRequirementResponseSchema', () => {
    it('validates compliance requirement response', () => {
      const response = {
        id: REQUIREMENT_ID,
        familyId: FAMILY_ID,
        academicYearId: YEAR_ID,
        academicYearTitle: 'Ano Letivo 2026',
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        jurisdiction: 'State Requirements',
        minInstructionalDays: 180,
        minInstructionalHours: 900,
        notes: 'Diretriz estadual',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const parsed = complianceRequirementResponseSchema.parse(response);
      expect(parsed.id).toBe(REQUIREMENT_ID);
      expect(parsed.minInstructionalDays).toBe(180);
    });
  });

  describe('attendanceComplianceSummarySchema', () => {
    it('validates compliance summary statistics', () => {
      const summary = {
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        academicYearId: YEAR_ID,
        totalDaysLogged: 120,
        presentDays: 115,
        absentDays: 5,
        totalHoursLogged: 480,
        requiredDays: 200,
        requiredHours: 800,
        daysCompliancePercentage: 57.5,
        hoursCompliancePercentage: 60.0,
        isCompliant: false,
      };

      const parsed = attendanceComplianceSummarySchema.parse(summary);
      expect(parsed.totalDaysLogged).toBe(120);
      expect(parsed.presentDays).toBe(115);
      expect(parsed.daysCompliancePercentage).toBe(57.5);
      expect(parsed.isCompliant).toBe(false);
    });
  });
});
