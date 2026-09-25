import { ReportService } from './report.service.js';
import { OfficialReportEntity } from '../domain/official-report.entity.js';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: any;
  let reportRepo: any;
  let attendanceService: any;
  let pdfRenderer: any;
  let attendanceCertificateRenderer: any;
  let portfolioRenderer: any;
  let complianceRenderer: any;
  let settingsApi: any;
  let privacyPublicApi: any;
  let recordedAccess: Array<Record<string, unknown>>;

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
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
          fullName: 'Jane Guardian',
          email: 'jane@example.com',
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
            notes: 'Excelente progresso.',
            date: new Date('2026-05-10'),
            subject: { id: SUBJECT_ID, name: 'Mathematics' },
          },
          {
            id: 'rec-2',
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            subjectId: SUBJECT_ID,
            masteryLevel: 'MASTERED',
            notes: 'Domínio alcançado.',
            date: new Date('2026-06-15'),
            subject: { id: SUBJECT_ID, name: 'Mathematics' },
          },
        ]),
      },
      evidenceSubmission: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ev-1',
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            textContent: 'Trabalho de ciências sobre células vegetais',
            fileUrl: 'https://storage.test/ev-1.pdf',
            validationStatus: 'VALIDATED',
            createdAt: new Date('2026-05-15'),
            evidenceType: { name: 'PROJECT_REPORT' },
            competencies: [{ competencyDefinition: { name: 'Biologia Celular' } }],
          },
        ]),
      },
      portfolioItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'port-1',
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            title: 'Pintura a óleo',
            description: 'Estudo de cores e luz',
            type: 'ARTWORK',
            fileUrl: 'https://storage.test/art.jpg',
            createdAt: new Date('2026-05-20'),
            tags: ['Artes'],
          },
        ]),
      },
      jurisdictionDefinition: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'j-br-1',
          code: 'BR',
          version: 1,
          name: 'Brasil (Referencial Nacional)',
          status: 'PUBLISHED',
          metadata: {
            minInstructionalDays: 200,
            minInstructionalHours: 800,
            officialSource: 'LDB Lei nº 9.394/1996 art. 24',
            confidenceLevel: 'ESTABLISHED',
          },
        }),
      },
      officialReport: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    reportRepo = {
      create: jest.fn().mockImplementation((familyId, dto, content, generatedByUserId) =>
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
            generatedByUserId ?? null,
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

    pdfRenderer = {
      render: jest.fn().mockResolvedValue({
        bytes: new Uint8Array([1, 2, 3]),
        documentHash: 'a'.repeat(64),
      }),
    };

    attendanceCertificateRenderer = {
      render: jest.fn().mockResolvedValue({
        bytes: new Uint8Array([4, 5, 6]),
        documentHash: 'b'.repeat(64),
      }),
    };

    portfolioRenderer = {
      render: jest.fn().mockResolvedValue({
        bytes: new Uint8Array([7, 8, 9]),
        documentHash: 'c'.repeat(64),
      }),
    };

    complianceRenderer = {
      render: jest.fn().mockResolvedValue({
        bytes: new Uint8Array([10, 11, 12]),
        documentHash: 'd'.repeat(64),
      }),
    };

    settingsApi = {
      getSettings: jest.fn().mockResolvedValue({
        id: 'settings-1',
        familyId: FAMILY_ID,
        homeschoolName: null,
        defaultGradingScale: 'MASTERY_QUALITATIVE',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        devotionalReminderTime: null,
        dailyScheduleReminderTime: null,
        attendanceReminderEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };

    recordedAccess = [];
    privacyPublicApi = {
      recordSensitiveDataAccess: jest.fn(async (entry: Record<string, unknown>) => {
        recordedAccess.push(entry);
      }),
    };

    service = new ReportService(
      prisma,
      reportRepo,
      attendanceService,
      pdfRenderer,
      attendanceCertificateRenderer,
      portfolioRenderer,
      complianceRenderer,
      settingsApi,
      privacyPublicApi,
    );
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
        null,
      );
    });

    it('uses the configured homeschool name over the default when set', async () => {
      settingsApi.getSettings.mockResolvedValue({
        homeschoolName: 'Grace Classical Academy',
      });

      await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        type: 'ACADEMIC_TRANSCRIPT',
        title: 'Official Transcript 2026',
        gradingScale: 'LETTER_A_F',
        includeAttendance: true,
      });

      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.anything(),
        expect.objectContaining({ familyOrganizationName: 'Grace Classical Academy' }),
        null,
      );
    });

    it('records who generated the report when a user id is provided', async () => {
      const USER_ID = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
      await service.generateReport(
        FAMILY_ID,
        {
          learnerId: LEARNER_ID,
          academicYearId: YEAR_ID,
          type: 'ACADEMIC_TRANSCRIPT',
          title: 'Official Transcript 2026',
          gradingScale: 'LETTER_A_F',
          includeAttendance: true,
        },
        USER_ID,
      );

      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.anything(),
        expect.anything(),
        USER_ID,
      );
      expect(recordedAccess).toContainEqual(
        expect.objectContaining({
          actorUserId: USER_ID,
          familyId: FAMILY_ID,
          action: 'CREATE',
          resourceType: 'OFFICIAL_REPORT',
        }),
      );
    });

    it('does not record sensitive data access when no user id is provided', async () => {
      await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        type: 'ACADEMIC_TRANSCRIPT',
        title: 'Official Transcript 2026',
        gradingScale: 'LETTER_A_F',
        includeAttendance: true,
      });

      expect(recordedAccess).toHaveLength(0);
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
      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.objectContaining({ type: 'ATTENDANCE_SUMMARY' }),
        expect.objectContaining({
          learnerId: LEARNER_ID,
          familyOrganizationName: 'Smith Homeschool',
          attendanceSummary: expect.objectContaining({ isCompliant: true }),
        }),
        null,
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

    it('records a sensitive data access log entry when an actor is provided', async () => {
      const USER_ID = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
      await service.exportReport(FAMILY_ID, REPORT_ID, 'CSV', USER_ID);

      expect(recordedAccess).toContainEqual(
        expect.objectContaining({
          actorUserId: USER_ID,
          familyId: FAMILY_ID,
          action: 'EXPORT',
          resourceType: 'OFFICIAL_REPORT',
          resourceId: REPORT_ID,
        }),
      );
    });

    it('exports report as JSON', async () => {
      const exportData = await service.exportReport(FAMILY_ID, REPORT_ID, 'JSON');

      expect(exportData.mimeType).toBe('application/json');
      expect(exportData.filename).toContain('.json');
      expect(JSON.parse(exportData.content)).toHaveProperty('subjectGrades');
    });

    it('rejects PDF format on the JSON export endpoint, directing to the dedicated PDF route', async () => {
      await expect(service.exportReport(FAMILY_ID, REPORT_ID, 'PDF')).rejects.toThrow(
        'GET :id/export/pdf',
      );
    });
  });

  describe('deleteReport', () => {
    it('deletes the report and records a sensitive data access log entry', async () => {
      const USER_ID = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
      const result = await service.deleteReport(FAMILY_ID, REPORT_ID, USER_ID);

      expect(result).toBe(true);
      expect(reportRepo.delete).toHaveBeenCalledWith(FAMILY_ID, REPORT_ID);
      expect(recordedAccess).toContainEqual(
        expect.objectContaining({
          actorUserId: USER_ID,
          familyId: FAMILY_ID,
          learnerId: LEARNER_ID,
          action: 'DELETE',
          resourceType: 'OFFICIAL_REPORT',
          resourceId: REPORT_ID,
        }),
      );
    });

    it('throws NotFoundException without recording access when the report does not exist', async () => {
      reportRepo.delete.mockResolvedValue(false);
      const USER_ID = 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

      await expect(service.deleteReport(FAMILY_ID, 'missing-id', USER_ID)).rejects.toThrow(
        'Official report not found',
      );
      expect(recordedAccess).toHaveLength(0);
    });
  });

  describe('exportReportPdf', () => {
    it('renders a real PDF and returns its content hash', async () => {
      const result = await service.exportReportPdf(FAMILY_ID, REPORT_ID);

      expect(pdfRenderer.render).toHaveBeenCalledWith(
        expect.objectContaining({ id: REPORT_ID, type: 'ACADEMIC_TRANSCRIPT' }),
        null,
      );
      expect(result.documentHash).toBe('a'.repeat(64));
      expect(result.filename).toContain('.pdf');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });

    it('resolves the generating user into a human-readable label when present', async () => {
      reportRepo.findById.mockResolvedValueOnce(
        new OfficialReportEntity(
          REPORT_ID,
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          'ACADEMIC_TRANSCRIPT',
          'Official Transcript 2026',
          'LETTER_A_F',
          { learnerName: 'Alice', subjectGrades: [] },
          new Date(),
          new Date(),
          new Date(),
          'Alice',
          'Academic Year 2026',
          'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
        ),
      );

      await service.exportReportPdf(FAMILY_ID, REPORT_ID);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66' },
      });
      expect(pdfRenderer.render).toHaveBeenCalledWith(expect.anything(), 'Jane Guardian');
    });

    it('renders a learning portfolio dossier PDF via portfolioRenderer', async () => {
      reportRepo.findById.mockResolvedValueOnce(
        new OfficialReportEntity(
          REPORT_ID,
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          'LEARNING_PORTFOLIO_DOSSIER',
          'Portfolio Dossier',
          'LETTER_A_F',
          { learnerName: 'Alice', portfolioItems: [] },
          new Date(),
          new Date(),
          new Date(),
        ),
      );

      const result = await service.exportReportPdf(FAMILY_ID, REPORT_ID);

      expect(portfolioRenderer.render).toHaveBeenCalledWith(
        expect.objectContaining({ id: REPORT_ID, type: 'LEARNING_PORTFOLIO_DOSSIER' }),
        null,
      );
      expect(result.documentHash).toBe('c'.repeat(64));
      expect(result.filename).toContain('.pdf');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });

    it('renders an annual compliance report PDF via complianceRenderer', async () => {
      reportRepo.findById.mockResolvedValueOnce(
        new OfficialReportEntity(
          REPORT_ID,
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          'ANNUAL_COMPLIANCE_REPORT',
          'Compliance Report',
          'MASTERY_QUALITATIVE',
          { learnerName: 'Alice', jurisdiction: { code: 'BR' } },
          new Date(),
          new Date(),
          new Date(),
        ),
      );

      const result = await service.exportReportPdf(FAMILY_ID, REPORT_ID);

      expect(complianceRenderer.render).toHaveBeenCalledWith(
        expect.objectContaining({ id: REPORT_ID, type: 'ANNUAL_COMPLIANCE_REPORT' }),
        null,
      );
      expect(result.documentHash).toBe('d'.repeat(64));
      expect(result.filename).toContain('.pdf');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });

    it('renders an attendance certificate PDF via the dedicated renderer for ATTENDANCE_SUMMARY reports', async () => {
      reportRepo.findById.mockResolvedValueOnce(
        new OfficialReportEntity(
          REPORT_ID,
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          'ATTENDANCE_SUMMARY',
          'Attendance Certificate 2026',
          'MASTERY_QUALITATIVE',
          {
            learnerName: 'Alice',
            familyOrganizationName: 'Smith Homeschool',
            generatedDate: '2026-08-26',
            attendanceSummary: { totalDaysLogged: 100, presentDays: 98, absentDays: 2, totalHoursLogged: 400, isCompliant: true },
          },
          new Date(),
          new Date(),
          new Date(),
        ),
      );

      const result = await service.exportReportPdf(FAMILY_ID, REPORT_ID);

      expect(attendanceCertificateRenderer.render).toHaveBeenCalledWith(
        expect.objectContaining({ id: REPORT_ID, type: 'ATTENDANCE_SUMMARY' }),
        null,
      );
      expect(pdfRenderer.render).not.toHaveBeenCalled();
      expect(result.documentHash).toBe('b'.repeat(64));
      expect(result.filename).toContain('.pdf');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('previewReport', () => {
    it('generates an in-memory draft preview without persisting to database', async () => {
      const preview = await service.previewReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        type: 'LEARNING_PORTFOLIO_DOSSIER',
        title: 'Prévia de Portfólio',
      });

      expect(reportRepo.create).not.toHaveBeenCalled();
      expect(preview.type).toBe('LEARNING_PORTFOLIO_DOSSIER');
      expect(preview.learnerName).toBe('Alice');
      expect(preview.previewSummary).toBeDefined();
      expect((preview.draftContent as any).portfolioItems).toBeDefined();
    });
  });

  describe('Dossier and Annual Compliance Report Generation', () => {
    it('generates LEARNING_PORTFOLIO_DOSSIER aggregating evidence submissions and portfolio items', async () => {
      const report = await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        type: 'LEARNING_PORTFOLIO_DOSSIER',
        title: 'Dossiê Anual de Aprendizagem',
      });

      expect(report.type).toBe('LEARNING_PORTFOLIO_DOSSIER');
      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.anything(),
        expect.objectContaining({
          portfolioItems: expect.arrayContaining([
            expect.objectContaining({ evidenceTypeName: 'PROJECT_REPORT' }),
            expect.objectContaining({ title: 'Pintura a óleo' }),
          ]),
          learningHighlights: expect.arrayContaining([
            expect.objectContaining({ subjectName: 'Mathematics', notes: 'Excelente progresso.' }),
          ]),
        }),
        null,
      );
    });

    it('generates ANNUAL_COMPLIANCE_REPORT with jurisdiction rule citation and legal disclaimer', async () => {
      const report = await service.generateReport(FAMILY_ID, {
        learnerId: LEARNER_ID,
        type: 'ANNUAL_COMPLIANCE_REPORT',
        title: 'Relatório Anual de Cumprimento Legal',
      });

      expect(report.type).toBe('ANNUAL_COMPLIANCE_REPORT');
      expect(reportRepo.create).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.anything(),
        expect.objectContaining({
          jurisdiction: expect.objectContaining({ code: 'BR' }),
          legalDisclaimer: expect.stringContaining('não constitui salvo-conduto'),
        }),
        null,
      );
    });
  });

  describe('verifyReport', () => {
    it('returns VERIFIED with document hash and disclaimer when report is found by ID', async () => {
      const mockReport = {
        id: REPORT_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        type: 'ACADEMIC_TRANSCRIPT',
        gradingScale: 'LETTER_A_F',
        title: 'Histórico Escolar 2026',
        content: { learnerName: 'Alice', familyOrganizationName: 'Smith Academy' },
        generatedAt: new Date('2026-08-26T12:00:00Z'),
        learner: { firstName: 'Alice', lastName: 'Smith', preferredName: 'Alice' },
        family: { name: 'Smith' },
        academicYear: { title: 'Ano 2026' },
      };

      prisma.officialReport.findUnique.mockResolvedValueOnce(mockReport);

      const result = await service.verifyReport(REPORT_ID);

      expect(result.status).toBe('VERIFIED');
      expect(result.reportId).toBe(REPORT_ID);
      expect(result.learnerName).toBe('Alice');
      expect(result.documentHash).toHaveLength(64);
      expect(result.legalDisclaimer).toContain('não constitui salvo-conduto');
    });

    it('returns VERIFIED when looked up by matching SHA-256 hash', async () => {
      const mockReport = {
        id: REPORT_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        type: 'ACADEMIC_TRANSCRIPT',
        gradingScale: 'LETTER_A_F',
        title: 'Histórico Escolar 2026',
        content: { learnerName: 'Alice', familyOrganizationName: 'Smith Academy' },
        generatedAt: new Date('2026-08-26T12:00:00Z'),
        learner: { firstName: 'Alice', lastName: 'Smith', preferredName: 'Alice' },
        family: { name: 'Smith' },
        academicYear: { title: 'Ano 2026' },
      };

      const expectedHash = service.computeContentHash({
        id: mockReport.id,
        type: mockReport.type,
        gradingScale: mockReport.gradingScale,
        content: mockReport.content,
      });

      prisma.officialReport.findMany.mockResolvedValueOnce([mockReport]);

      const result = await service.verifyReport(expectedHash);

      expect(result.status).toBe('VERIFIED');
      expect(result.documentHash).toBe(expectedHash);
      expect(result.reportId).toBe(REPORT_ID);
    });

    it('returns NOT_FOUND when report does not exist for the hash', async () => {
      prisma.officialReport.findMany.mockResolvedValueOnce([]);

      const unknownHash = 'f'.repeat(64);
      const result = await service.verifyReport(unknownHash);

      expect(result.status).toBe('NOT_FOUND');
      expect(result.documentHash).toBe(unknownHash);
      expect(result.reportId).toBeNull();
    });

    it('returns INVALID when identifier format is neither UUID nor SHA-256', async () => {
      const result = await service.verifyReport('invalid-identifier');

      expect(result.status).toBe('INVALID');
      expect(result.reportId).toBeNull();
    });
  });
});
