import { NotFoundException } from '@nestjs/common';
import { DataExportService } from './data-export.service.js';
import { DataExportRepository } from '../infrastructure/data-export.repository.js';
import { DataExportJobEntity } from '../domain/data-export-job.entity.js';
import type {
  ExportStatus,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';

describe('DataExportService', () => {
  let service: DataExportService;
  let jobs: Map<string, DataExportJobEntity>;
  let mockExportData: FamilyDataExportPackageDto;

  beforeEach(() => {
    jobs = new Map();

    mockExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      family: { id: 'fam-1', name: 'Smith Family', countryCode: 'US' },
      settings: {
        id: 'settings-1',
        familyId: 'fam-1',
        defaultGradingScale: 'MASTERY_QUALITATIVE',
      },
      members: [{ id: 'm-1', familyId: 'fam-1', userId: 'u-1', role: 'ADMIN' }],
      learners: [{ id: 'l-1', familyId: 'fam-1', firstName: 'John' }],
      devotionals: [{ id: 'd-1', familyId: 'fam-1', bibleReference: 'John 3:16' }],
      prayerRequests: [{ id: 'p-1', familyId: 'fam-1', title: 'Health' }],
      academicYears: [{ id: 'ay-1', familyId: 'fam-1', year: 2026, title: '2026-2027' }],
      subjects: [{ id: 's-1', familyId: 'fam-1', name: 'Math' }],
      curriculumPlans: [{ id: 'cp-1', familyId: 'fam-1' }],
      lessonPlans: [{ id: 'lp-1', familyId: 'fam-1', title: 'Algebra 101' }],
      scheduleSlots: [{ id: 'ss-1', familyId: 'fam-1', dayOfWeek: 1 }],
      learningRecords: [{ id: 'lr-1', familyId: 'fam-1', title: 'Lesson 1' }],
      portfolioItems: [{ id: 'pi-1', familyId: 'fam-1', title: 'Art Piece' }],
      attendanceRecords: [{ id: 'ar-1', familyId: 'fam-1', status: 'PRESENT' }],
      complianceRequirements: [{ id: 'cr-1', familyId: 'fam-1' }],
      officialReports: [{ id: 'or-1', familyId: 'fam-1', title: 'Transcript' }],
    };

    const mockRepo = {
      createJob: async (familyId: string, requestedById: string) => {
        const id = `job-${jobs.size + 1}`;
        const entity = new DataExportJobEntity({
          id,
          familyId,
          requestedById,
          status: 'PENDING',
          downloadUrl: null,
          fileSizeBytes: null,
          completedAt: null,
          errorReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        jobs.set(id, entity);
        return entity;
      },
      findById: async (familyId: string, id: string) => {
        const job = jobs.get(id);
        if (!job || job.familyId !== familyId) return null;
        return job;
      },
      findRecentJobs: async (familyId: string, limit = 20) => {
        return Array.from(jobs.values())
          .filter((j) => j.familyId === familyId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      },
      updateJob: async (
        familyId: string,
        id: string,
        data: {
          status?: ExportStatus;
          downloadUrl?: string | null;
          fileSizeBytes?: number | null;
          completedAt?: Date | null;
          errorReason?: string | null;
        },
      ) => {
        const job = jobs.get(id);
        if (!job || job.familyId !== familyId) return null;

        const updated = new DataExportJobEntity({
          id: job.id,
          familyId: job.familyId,
          requestedById: job.requestedById,
          status: data.status !== undefined ? data.status : job.status,
          downloadUrl: data.downloadUrl !== undefined ? data.downloadUrl : job.downloadUrl,
          fileSizeBytes: data.fileSizeBytes !== undefined ? data.fileSizeBytes : job.fileSizeBytes,
          completedAt: data.completedAt !== undefined ? data.completedAt : job.completedAt,
          errorReason: data.errorReason !== undefined ? data.errorReason : job.errorReason,
          createdAt: job.createdAt,
          updatedAt: new Date(),
        });
        jobs.set(id, updated);
        return updated;
      },
      aggregateFamilyData: async (_familyId: string) => {
        return mockExportData;
      },
    } as unknown as DataExportRepository;

    service = new DataExportService(mockRepo);
  });

  describe('createExportJob', () => {
    it('creates a new export job with PENDING status', async () => {
      const job = await service.createExportJob('fam-1', 'user-1');

      expect(job.id).toBeDefined();
      expect(job.familyId).toBe('fam-1');
      expect(job.requestedById).toBe('user-1');
      expect(job.status).toBe('PENDING');
      expect(job.downloadUrl).toBeNull();
      expect(job.fileSizeBytes).toBeNull();
    });
  });

  describe('getExportJob', () => {
    it('returns export job by id', async () => {
      const created = await service.createExportJob('fam-1', 'user-1');
      const found = await service.getExportJob('fam-1', created.id);

      expect(found.id).toBe(created.id);
      expect(found.status).toBe('PENDING');
    });

    it('throws NotFoundException if job not found', async () => {
      await expect(service.getExportJob('fam-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listExportJobs', () => {
    it('lists recent export jobs for the family', async () => {
      await service.createExportJob('fam-1', 'user-1');
      await service.createExportJob('fam-1', 'user-1');
      await service.createExportJob('fam-2', 'user-2');

      const list = await service.listExportJobs('fam-1');
      expect(list).toHaveLength(2);
      expect(list[0]?.familyId).toBe('fam-1');
    });
  });

  describe('exportFamilyData', () => {
    it('aggregates complete family data across all domains into FamilyDataExportPackageDto', async () => {
      const result = await service.exportFamilyData('fam-1');

      expect(result.version).toBe('1.0.0');
      expect(result.family).toBeDefined();
      expect(result.settings).toBeDefined();
      expect(result.members).toHaveLength(1);
      expect(result.learners).toHaveLength(1);
      expect(result.devotionals).toHaveLength(1);
      expect(result.prayerRequests).toHaveLength(1);
      expect(result.academicYears).toHaveLength(1);
      expect(result.subjects).toHaveLength(1);
      expect(result.curriculumPlans).toHaveLength(1);
      expect(result.lessonPlans).toHaveLength(1);
      expect(result.scheduleSlots).toHaveLength(1);
      expect(result.learningRecords).toHaveLength(1);
      expect(result.portfolioItems).toHaveLength(1);
      expect(result.attendanceRecords).toHaveLength(1);
      expect(result.complianceRequirements).toHaveLength(1);
      expect(result.officialReports).toHaveLength(1);
    });
  });

  describe('processExportJob', () => {
    it('processes job, completes it with size and download URL, and returns package', async () => {
      const created = await service.createExportJob('fam-1', 'user-1');
      const { job, data } = await service.processExportJob('fam-1', created.id);

      expect(job.status).toBe('COMPLETED');
      expect(job.downloadUrl).toBe(
        `/api/v1/families/fam-1/backup/export-jobs/${created.id}/download`,
      );
      expect(job.fileSizeBytes).toBeGreaterThan(0);
      expect(job.completedAt).toBeDefined();
      expect(data.version).toBe('1.0.0');
    });

    it('marks job as FAILED and rethrows if an error occurs during aggregation', async () => {
      const created = await service.createExportJob('fam-1', 'user-1');

      // Force aggregateFamilyData to throw
      (service['dataExportRepository'].aggregateFamilyData as jest.Mock | any) = async () => {
        throw new Error('Database connection failed');
      };

      await expect(service.processExportJob('fam-1', created.id)).rejects.toThrow(
        'Database connection failed',
      );

      const failedJob = await service.getExportJob('fam-1', created.id);
      expect(failedJob.status).toBe('FAILED');
      expect(failedJob.errorReason).toBe('Database connection failed');
    });
  });
});
