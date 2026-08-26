import { ReportService } from './report.service.js';
import { OfficialReportEntity } from '../domain/official-report.entity.js';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: any;
  let reportRepo: any;
  let attendanceService: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const YEAR_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const SUBJECT_ID = 's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const REPORT_ID = 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  beforeEach(() => {
    prisma = {
      learner: {
        findFirst: jest.fn().mockResolvedValue({
          id: LEARNER_ID,
          familyId: FAMILY_ID,
          firstName: 'Alice',
          lastName: 'Smith',
          preferredName: 'Alice',
          birthDate: new Date('2016-05-12'),
          stage: 'PRIMARY_GRAMMAR',
          customGrade: '4th Grade',
        }),
      },
      family: {
        findUnique: jest.fn().mockResolvedValue({
          id: FAMILY_ID,
          name: 'Smith',
        }),
      },
      academicYear: {
        findFirst: jest.fn().mockResolvedValue({
          id: YEAR_ID,
          familyId: FAMILY_ID,
          title: 'Academic Year 2026',
        }),
      },
      learningRecord: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rec-1',
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            subjectId: SUBJECT_ID,
            masteryLevel: 'AUTONOMOUS',
            subject: { id: SUBJECT_ID, name: 'Mathematics' },
          },
          {
            id: 'rec-2',
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            subjectId: SUBJECT_ID,
            masteryLevel: 'MASTERED',
            subject: { id: SUBJECT_ID, name: 'Mathematics' },
          },
        ]),
      },
    };

    reportRepo = {
      create: jest.fn().mockImplementation((familyId, dto, content) =>
        Promise.resolve(
          new OfficialReportEntity(
            REPORT_ID,
            familyId,
            dto.learnerId,
            dto.academicYearId ?? null,
            dto.type,
            dto.title,
            dto.gradingScale ?? 'MASTERY_QUALITATIVE',
            content,
            new Date(),
            new Date(),
            new Date(),
            'Alice',
            'Academic Year 2026',
          ),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) =>
        Promise.resolve(
          new OfficialReportEntity(
            id,
            familyId,
            LEARNER_ID,
            YEAR_ID,
            'ACADEMIC_TRANSCRIPT',
            'Official Transcript 2026',
            'LETTER_A_F',
            {
              learnerName: 'Alice',
              subjectGrades: [
                {
                  subjectId: SUBJECT_ID,
                  subjectName: 'Mathematics',
                  evaluationCount: 2,
                  averageMasteryLevel: 'MASTERED',
                  calculatedGrade: 'A',
                  letterGrade: 'A',
                  numericGrade: 92.5,
                  narrativeSummary: 'Domínio completo.',
                },
              ],
              attendanceSummary: {
                totalDaysLogged: 100,
                presentDays: 98,
                absentDays: 2,
                totalHoursLogged: 400,
                isCompliant: true,
              },
            },
            new Date(),
            new Date(),
            new Date(),
            'Alice',
            'Academic Year 2026',
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
    };

    attendanceService = {
      getComplianceSummary: jest.fn().mockResolvedValue({
        learnerId: LEARNER_ID,
        learnerName: 'Alice',
        totalDaysLogged: 180,
        presentDays: 178,
        absentDays: 2,
        totalHoursLogged: 750,
        requiredDays: 180,
        requiredHours: 720,
        daysCompliancePercentage: 98.9,
        hoursCompliancePercentage: 104.2,
        isCompliant: true,
      }),
    };

    service = new ReportService(prisma, reportRepo, attendanceService);
  });

  describe('Generate Academic Transcript', () => {
    it('generates an Academic Transcript report with converted grades and attendance', async () => {
      const res = await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        type: 'ACADEMIC_TRANSCRIPT',
        title: 'Official Transcript 2026',
        gradingScale: 'LETTER_A_F',
        includeAttendance: true,
      });

      expect(res.id).toBe(REPORT_ID);
      expect(res.type).toBe('ACADEMIC_TRANSCRIPT');
      expect(res.title).toBe('Official Transcript 2026');
      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.objectContaining({ type: 'ACADEMIC_TRANSCRIPT' }),
        expect.objectContaining({
          learnerId: LEARNER_ID,
          familyOrganizationName: 'Smith Homeschool',
          gradingScale: 'LETTER_A_F',
          subjectGrades: expect.arrayContaining([
            expect.objectContaining({
              subjectId: SUBJECT_ID,
              subjectName: 'Mathematics',
              evaluationCount: 2,
              calculatedGrade: 'A',
            }),
          ]),
        }),
      );
    });

    it('generates Attendance Summary report', async () => {
      const res = await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        type: 'ATTENDANCE_SUMMARY',
        title: 'Attendance Report 2026',
      });

      expect(res.id).toBe(REPORT_ID);
      expect(res.type).toBe('ATTENDANCE_SUMMARY');
      expect(attendanceService.getComplianceSummary).toHaveBeenCalledWith(
        FAMILY_ID,
        LEARNER_ID,
        YEAR_ID,
      );
    });

    it('throws NotFoundException when learner not found', async () => {
      prisma.learner.findFirst.mockResolvedValue(null);
      await expect(
        service.generateReport(FAMILY_ID, {
          learnerId: 'non-existent',
          type: 'ACADEMIC_TRANSCRIPT',
          title: 'Report',
        }),
      ).rejects.toThrow('Learner not found: non-existent');
    });
  });

  describe('Export Report', () => {
    it('exports report as CSV', async () => {
      const exportData = await service.exportReport(FAMILY_ID, REPORT_ID, 'CSV');

      expect(exportData.mimeType).toBe('text/csv');
      expect(exportData.filename).toContain('.csv');
      expect(exportData.content).toContain('Official Transcript 2026');
      expect(exportData.content).toContain('Mathematics');
      expect(exportData.content).toContain('Attendance Summary');
    });

    it('exports report as JSON', async () => {
      const exportData = await service.exportReport(FAMILY_ID, REPORT_ID, 'JSON');

      expect(exportData.mimeType).toBe('application/json');
      expect(exportData.filename).toContain('.json');
      expect(JSON.parse(exportData.content)).toHaveProperty('subjectGrades');
    });
  });
});
