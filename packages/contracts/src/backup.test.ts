import { describe, expect, it } from 'vitest';
import {
  exportStatusSchema,
  createExportJobSchema,
  dataExportJobResponseSchema,
  familyDataExportPackageSchema,
} from './backup.js';

const JOB_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FAMILY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const USER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('Data Backup Contracts', () => {
  describe('exportStatusSchema', () => {
    it('validates all export statuses', () => {
      const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;

      for (const status of statuses) {
        expect(exportStatusSchema.parse(status)).toBe(status);
      }
    });

    it('rejects invalid export status', () => {
      expect(() => exportStatusSchema.parse('DONE')).toThrow();
    });
  });

  describe('createExportJobSchema', () => {
    it('validates empty creation payload', () => {
      const parsed = createExportJobSchema.parse({});
      expect(parsed).toEqual({});
    });

    it('validates optional notes', () => {
      const parsed = createExportJobSchema.parse({ notes: 'Backup anual 2026' });
      expect(parsed.notes).toBe('Backup anual 2026');
    });
  });

  describe('dataExportJobResponseSchema', () => {
    it('validates export job response DTO', () => {
      const response = {
        id: JOB_ID,
        familyId: FAMILY_ID,
        requestedById: USER_ID,
        status: 'COMPLETED' as const,
        downloadUrl: `/api/v1/families/${FAMILY_ID}/export/${JOB_ID}/download`,
        fileSizeBytes: 1048576,
        completedAt: '2026-08-26T12:05:00.000Z',
        errorReason: null,
        createdAt: '2026-08-26T12:00:00.000Z',
        updatedAt: '2026-08-26T12:05:00.000Z',
      };

      const parsed = dataExportJobResponseSchema.parse(response);
      expect(parsed.id).toBe(JOB_ID);
      expect(parsed.status).toBe('COMPLETED');
      expect(parsed.fileSizeBytes).toBe(1048576);
    });
  });

  describe('familyDataExportPackageSchema', () => {
    it('validates comprehensive family export package', () => {
      const pkg = {
        exportedAt: '2026-08-26T12:00:00.000Z',
        version: '1.0.0',
        family: {
          id: FAMILY_ID,
          name: 'Família Silva',
          countryCode: 'BR',
        },
        settings: {
          homeschoolName: 'Academia Silva',
          timezone: 'America/Sao_Paulo',
        },
        members: [{ id: USER_ID, role: 'OWNER_GUARDIAN' }],
        learners: [{ id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', firstName: 'Lucas' }],
        devotionals: [],
        prayerRequests: [],
        academicYears: [],
        subjects: [],
        curriculumPlans: [],
        lessonPlans: [],
        scheduleSlots: [],
        learningRecords: [],
        portfolioItems: [],
        attendanceRecords: [],
        complianceRequirements: [],
        officialReports: [],
        notifications: [],
      };

      const parsed = familyDataExportPackageSchema.parse(pkg);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.family.name).toBe('Família Silva');
      expect(parsed.learners).toHaveLength(1);
      expect(parsed.notifications).toEqual([]);
    });
  });
});
