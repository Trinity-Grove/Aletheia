import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../src/modules/families/application/public-api.js';
import { AttendanceService } from '../src/modules/reports/application/attendance.service.js';
import { ReportService } from '../src/modules/reports/application/report.service.js';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  GenerateReportDto,
  LogAttendanceDto,
  OfficialReportResponseDto,
  ReportType,
  UpsertComplianceRequirementDto,
} from '@aletheia/contracts';

describe('Compliance, Attendance & Reports E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = '00000000-0000-0000-0000-000000000001';
  const familyBId = '00000000-0000-0000-0000-000000000002';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';

  const learnerAId = '10000000-0000-0000-0000-000000000001';
  const learnerBId = '10000000-0000-0000-0000-000000000002';
  const academicYearId = '20000000-0000-0000-0000-000000000001';

  let attendanceStore: AttendanceResponseDto[] = [];
  let complianceStore: ComplianceRequirementResponseDto[] = [];
  let reportsStore: OfficialReportResponseDto[] = [];

  beforeAll(async () => {
    app = await createApplication();

    // 1. Auth mocking
    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: 'guardian-a@test.com' };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: 'guardian-b@test.com' };
      }
      return null;
    });

    // 2. Multi-tenant Family membership check
    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    // 3. AttendanceService mocking
    const attendanceService = app.get(AttendanceService);
    jest.spyOn(attendanceService, 'logAttendance').mockImplementation(async (familyId: string, dto: LogAttendanceDto) => {
      const rec: AttendanceResponseDto = {
        id: randomUUID(),
        familyId,
        learnerId: dto.learnerId,
        learnerName: 'Learner A',
        academicYearId: dto.academicYearId ?? undefined,
        date: dto.date,
        status: dto.status ?? 'PRESENT',
        hoursSpent: dto.hoursSpent ?? undefined,
        notes: dto.notes ?? undefined,
        isAutoLogged: dto.isAutoLogged ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      attendanceStore.push(rec);
      return rec;
    });

    jest.spyOn(attendanceService, 'bulkLogAttendance').mockImplementation(async (familyId: string, dto: BulkLogAttendanceDto) => {
      const created: AttendanceResponseDto[] = dto.learnerIds.map((lId) => ({
        id: randomUUID(),
        familyId,
        learnerId: lId,
        learnerName: lId === learnerAId ? 'Learner A' : 'Learner B',
        academicYearId: dto.academicYearId ?? undefined,
        date: dto.date,
        status: dto.status ?? 'PRESENT',
        hoursSpent: dto.hoursSpent ?? undefined,
        notes: dto.notes ?? undefined,
        isAutoLogged: dto.isAutoLogged ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      attendanceStore.push(...created);
      return created;
    });

    jest.spyOn(attendanceService, 'listAttendance').mockImplementation(async (familyId: string, filter: AttendanceFilterDto = {}) => {
      return attendanceStore.filter((a) => {
        if (a.familyId !== familyId) return false;
        if (filter.learnerId && a.learnerId !== filter.learnerId) return false;
        if (filter.academicYearId && a.academicYearId !== filter.academicYearId) return false;
        if (filter.status && a.status !== filter.status) return false;
        return true;
      });
    });

    jest.spyOn(attendanceService, 'getComplianceSummary').mockImplementation(async (familyId: string, learnerId: string, acYearId?: string) => {
      const recs = attendanceStore.filter((a) => a.familyId === familyId && a.learnerId === learnerId);
      const presentDays = recs.filter((a) => a.status === 'PRESENT' || a.status === 'FIELD_TRIP').length;
      const absentDays = recs.filter((a) => a.status === 'UNEXCUSED_ABSENCE' || a.status === 'EXCUSED_ABSENCE' || a.status === 'SICK').length;
      const totalHours = recs.reduce((acc, r) => acc + (r.hoursSpent || 0), 0);

      const summary: AttendanceComplianceSummaryDto = {
        learnerId,
        learnerName: 'Learner A',
        academicYearId: acYearId ?? undefined,
        totalDaysLogged: recs.length,
        presentDays,
        absentDays,
        totalHoursLogged: totalHours,
        requiredDays: 180,
        requiredHours: 800,
        daysCompliancePercentage: 10,
        hoursCompliancePercentage: 10,
        isCompliant: true,
      };
      return summary;
    });

    jest.spyOn(attendanceService, 'upsertComplianceRequirement').mockImplementation(async (familyId: string, dto: UpsertComplianceRequirementDto) => {
      const req: ComplianceRequirementResponseDto = {
        id: randomUUID(),
        familyId,
        academicYearId: dto.academicYearId,
        learnerId: dto.learnerId ?? undefined,
        jurisdiction: dto.jurisdiction ?? undefined,
        minInstructionalDays: dto.minInstructionalDays ?? undefined,
        minInstructionalHours: dto.minInstructionalHours ?? undefined,
        notes: dto.notes ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = complianceStore.findIndex(
        (c) => c.familyId === familyId && c.academicYearId === dto.academicYearId && (c.learnerId ?? null) === (dto.learnerId ?? null),
      );
      if (idx >= 0) {
        complianceStore[idx] = req;
      } else {
        complianceStore.push(req);
      }
      return req;
    });

    jest.spyOn(attendanceService, 'listComplianceRequirements').mockImplementation(async (familyId: string, acYearId?: string) => {
      return complianceStore.filter((c) => c.familyId === familyId && (!acYearId || c.academicYearId === acYearId));
    });

    // 4. ReportService mocking
    const reportService = app.get(ReportService);
    jest.spyOn(reportService, 'generateReport').mockImplementation(async (familyId: string, dto: GenerateReportDto) => {
      const report: OfficialReportResponseDto = {
        id: randomUUID(),
        familyId,
        learnerId: dto.learnerId,
        learnerName: 'Learner A',
        academicYearId: dto.academicYearId ?? undefined,
        type: dto.type,
        title: dto.title,
        gradingScale: dto.gradingScale ?? 'MASTERY_QUALITATIVE',
        content: {
          learnerId: dto.learnerId,
          learnerName: 'Learner A',
          academicYearId: dto.academicYearId ?? null,
          subjectGrades: [],
          notes: dto.notes ?? null,
        },
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reportsStore.push(report);
      return report;
    });

    jest.spyOn(reportService, 'listReports').mockImplementation(
      async (familyId: string, filter: { learnerId?: string; academicYearId?: string; type?: ReportType } = {}) => {
        return reportsStore.filter((r) => {
          if (r.familyId !== familyId) return false;
          if (filter.learnerId && r.learnerId !== filter.learnerId) return false;
          if (filter.academicYearId && r.academicYearId !== filter.academicYearId) return false;
          if (filter.type && r.type !== filter.type) return false;
          return true;
        });
      },
    );

    jest.spyOn(reportService, 'getReport').mockImplementation(async (familyId: string, id: string) => {
      const found = reportsStore.find((r) => r.familyId === familyId && r.id === id);
      if (!found) throw new NotFoundException('Official report not found');
      return found;
    });

    jest.spyOn(reportService, 'exportReport').mockImplementation(async (familyId: string, id: string, _format = 'CSV') => {
      const found = reportsStore.find((r) => r.familyId === familyId && r.id === id);
      if (!found) throw new NotFoundException('Official report not found');
      return {
        content: 'Report Title,Learner,Grade\nTest Report,Learner A,Mastered',
        mimeType: 'text/csv',
        filename: `${found.title.replace(/\s+/g, '_')}_${found.id}.csv`,
      };
    });

    jest.spyOn(reportService, 'deleteReport').mockImplementation(async (familyId: string, id: string) => {
      const idx = reportsStore.findIndex((r) => r.familyId === familyId && r.id === id);
      if (idx === -1) throw new NotFoundException('Official report not found');
      reportsStore.splice(idx, 1);
      return true;
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    attendanceStore = [];
    complianceStore = [];
    reportsStore = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Multi-Tenant Access Control', () => {
    it('denies Guardian A access to Family B attendance endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/attendance`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(res.status).toBe(403);
    });

    it('denies Guardian A access to Family B reports endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/reports`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated requests to attendance endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/attendance`);

      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to reports endpoints', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/reports`);

      expect(res.status).toBe(401);
    });
  });

  describe('Attendance Lifecycle', () => {
    it('logs single attendance, bulk attendance, lists records, gets summary, and manages compliance requirements', async () => {
      // 1. POST /api/v1/families/:familyId/attendance
      const logRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/attendance`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          academicYearId,
          date: '2026-08-26',
          status: 'PRESENT',
          hoursSpent: 5,
          notes: 'Regular homeschool day with math and history',
        });

      expect(logRes.status).toBe(201);
      expect(logRes.body.learnerId).toBe(learnerAId);
      expect(logRes.body.status).toBe('PRESENT');

      // 2. POST /api/v1/families/:familyId/attendance/bulk
      const bulkRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/attendance/bulk`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerIds: [learnerAId, learnerBId],
          academicYearId,
          date: '2026-08-27',
          status: 'FIELD_TRIP',
          hoursSpent: 6,
          notes: 'Science museum field trip',
        });

      expect(bulkRes.status).toBe(201);
      expect(bulkRes.body).toHaveLength(2);

      // 3. GET /api/v1/families/:familyId/attendance
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/attendance?learnerId=${learnerAId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(2);

      // 4. GET /api/v1/families/:familyId/attendance/summary
      const summaryRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/attendance/summary?learnerId=${learnerAId}&academicYearId=${academicYearId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.totalDaysLogged).toBe(2);
      expect(summaryRes.body.isCompliant).toBe(true);

      // 5. PUT /api/v1/families/:familyId/attendance/requirements
      const putReqRes = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/attendance/requirements`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          academicYearId,
          learnerId: learnerAId,
          jurisdiction: 'Brazil / Custom Guidelines',
          minInstructionalDays: 200,
          minInstructionalHours: 800,
          notes: 'Standard annual requirement',
        });

      expect(putReqRes.status).toBe(200);
      expect(putReqRes.body.minInstructionalDays).toBe(200);

      // 6. GET /api/v1/families/:familyId/attendance/requirements
      const getReqRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/attendance/requirements?academicYearId=${academicYearId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(getReqRes.status).toBe(200);
      expect(getReqRes.body).toHaveLength(1);
      expect(getReqRes.body[0].jurisdiction).toBe('Brazil / Custom Guidelines');
    });
  });

  describe('Reports & Transcript Lifecycle', () => {
    it('generates a report, lists reports, gets report by id, exports as csv, and deletes report', async () => {
      // 1. POST /api/v1/families/:familyId/reports/generate
      const genRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/reports/generate`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          academicYearId,
          type: 'ACADEMIC_TRANSCRIPT',
          title: 'Histórico Escolar Oficial 2026',
          gradingScale: 'MASTERY_QUALITATIVE',
          includeAttendance: true,
          includePortfolioHighlights: true,
          notes: 'Transcript for annual assessment',
        });

      expect(genRes.status).toBe(201);
      expect(genRes.body.title).toBe('Histórico Escolar Oficial 2026');
      expect(genRes.body.type).toBe('ACADEMIC_TRANSCRIPT');
      const reportId = genRes.body.id;

      // 2. GET /api/v1/families/:familyId/reports
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/reports?learnerId=${learnerAId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(reportId);

      // 3. GET /api/v1/families/:familyId/reports/:id
      const getRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(reportId);
      expect(getRes.body.title).toBe('Histórico Escolar Oficial 2026');

      // 4. GET /api/v1/families/:familyId/reports/:id/export/csv
      const exportRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/reports/${reportId}/export/csv`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.mimeType).toBe('text/csv');
      expect(exportRes.body.content).toBeDefined();

      // 5. DELETE /api/v1/families/:familyId/reports/:id
      const delRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deletion
      const listAfterDel = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/reports`)
        .set('Authorization', `Bearer ${guardianAToken}`);

      expect(listAfterDel.status).toBe(200);
      expect(listAfterDel.body).toHaveLength(0);
    });
  });
});
