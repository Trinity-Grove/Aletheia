import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type {
  AcademicTranscriptDto,
  AttendanceComplianceSummaryDto,
  AttendanceResponseDto,
  ComplianceRequirementResponseDto,
  LearnerSummaryDto,
  OfficialReportResponseDto,
} from '@aletheia/contracts';
import { ComplianceGauge } from '../src/components/reports/compliance-gauge';
import { AttendanceTrackerView } from '../src/components/reports/attendance-tracker-view';
import { ReportGeneratorView } from '../src/components/reports/report-generator-view';
import { PrintableTranscript } from '../src/components/reports/printable-transcript';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const mockLearners: LearnerSummaryDto[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    firstName: 'Samuel',
    lastName: 'Silva',
    preferredName: 'Samuca',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#3B82F6',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    firstName: 'Ester',
    lastName: 'Silva',
    preferredName: 'Teca',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#EC4899',
  },
];

const mockComplianceSummary: AttendanceComplianceSummaryDto = {
  learnerId: '00000000-0000-0000-0000-000000000001',
  learnerName: 'Samuca',
  academicYearId: 'year-2026',
  totalDaysLogged: 160,
  presentDays: 155,
  absentDays: 5,
  totalHoursLogged: 620,
  requiredDays: 200,
  requiredHours: 800,
  daysCompliancePercentage: 78,
  hoursCompliancePercentage: 78,
  isCompliant: false,
};

const mockComplianceRequirement: ComplianceRequirementResponseDto = {
  id: 'req-1',
  familyId: 'fam-1',
  academicYearId: 'year-2026',
  academicYearTitle: 'Ano Letivo 2026',
  learnerId: null,
  jurisdiction: 'MEC / Lei de Diretrizes Básicas',
  minInstructionalDays: 200,
  minInstructionalHours: 800,
  notes: 'Requisito anual padrão',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockAttendanceRecords: AttendanceResponseDto[] = [
  {
    id: 'att-1',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    learnerName: 'Samuca',
    academicYearId: 'year-2026',
    date: '2026-08-26',
    status: 'PRESENT',
    hoursSpent: 4.5,
    notes: 'Aulas de Latim e História Geral.',
    isAutoLogged: false,
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
  {
    id: 'att-2',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000002',
    learnerName: 'Teca',
    academicYearId: 'year-2026',
    date: '2026-08-26',
    status: 'FIELD_TRIP',
    hoursSpent: 5,
    notes: 'Visita ao observatório astronômico.',
    isAutoLogged: false,
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
  {
    id: 'att-3',
    familyId: 'fam-1',
    learnerId: '00000000-0000-0000-0000-000000000001',
    learnerName: 'Samuca',
    academicYearId: 'year-2026',
    date: '2026-08-25',
    status: 'EXCUSED_ABSENCE',
    hoursSpent: null,
    notes: 'Consulta odontológica preventiva.',
    isAutoLogged: false,
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
  },
];

const mockTranscriptData: AcademicTranscriptDto = {
  learnerId: '00000000-0000-0000-0000-000000000001',
  learnerName: 'Samuel Silva',
  learnerBirthDate: '2016-05-12',
  gradeLevel: 'Primary Grammar (4º Ano)',
  academicYearId: 'year-2026',
  academicYearTitle: 'Ano Letivo 2026',
  familyOrganizationName: 'Academia Familiar Silva',
  gradingScale: 'MASTERY_QUALITATIVE',
  generatedDate: '2026-08-26',
  attendanceSummary: mockComplianceSummary,
  subjectGrades: [
    {
      subjectId: 'sub-1',
      subjectName: 'Latim Clássico',
      evaluationCount: 14,
      averageMasteryLevel: 'MASTERED',
      calculatedGrade: 'Dominado com Excelência',
      letterGrade: 'A',
      numericGrade: 9.5,
      narrativeSummary: 'Demonstra fluência na declinação e tradução com rigor e alegria.',
    },
    {
      subjectId: 'sub-2',
      subjectName: 'História & Geografia Bíblica',
      evaluationCount: 10,
      averageMasteryLevel: 'AUTONOMOUS',
      calculatedGrade: 'Autônomo',
      letterGrade: 'B',
      numericGrade: 8.5,
      narrativeSummary: 'Compreensão sólida da linha do tempo histórica.',
    },
  ],
  generalNotes: 'Aluno dedicado com hábitos consolidados de atenção e excelência.',
};

const mockOfficialReport: OfficialReportResponseDto = {
  id: 'rep-1',
  familyId: 'fam-1',
  learnerId: '00000000-0000-0000-0000-000000000001',
  learnerName: 'Samuel Silva',
  academicYearId: 'year-2026',
  academicYearTitle: 'Ano Letivo 2026',
  type: 'ACADEMIC_TRANSCRIPT',
  title: 'Histórico Escolar Oficial - Samuel Silva 2026',
  gradingScale: 'MASTERY_QUALITATIVE',
  content: mockTranscriptData,
  generatedAt: '2026-08-26T12:00:00.000Z',
  createdAt: '2026-08-26T12:00:00.000Z',
  updatedAt: '2026-08-26T12:00:00.000Z',
};

describe('Attendance Tracker, Compliance Gauges & Official Transcript Web Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('ComplianceGauge', () => {
    it('renders progress bars, percentage, and compliance target metrics', () => {
      render(
        <ComplianceGauge
          summary={mockComplianceSummary}
          requirement={mockComplianceRequirement}
          learnerName="Samuca"
        />
      );

      // Verify Title & Learner
      expect(screen.getByTestId('compliance-gauge-title')).toBeDefined();
      expect(screen.getByText(/Progresso individual de Samuca/i)).toBeDefined();

      // Verify Percentage displays
      const percentageEl = screen.getByTestId('compliance-percentage');
      expect(percentageEl.textContent).toContain('78%');

      const hoursPercentageEl = screen.getByTestId('hours-compliance-percentage');
      expect(hoursPercentageEl.textContent).toContain('78%');

      // Verify Progress Bars
      const daysBar = screen.getByTestId('days-progress-bar');
      expect(daysBar.getAttribute('style')).toContain('width: 78%');

      const hoursBar = screen.getByTestId('hours-progress-bar');
      expect(hoursBar.getAttribute('style')).toContain('width: 78%');

      // Verify Compliance Target Metrics
      const daysProgress = screen.getByTestId('metric-days-progress');
      expect(daysProgress.textContent).toContain('155 dias');
      expect(daysProgress.textContent).toContain('200 dias');

      const hoursProgress = screen.getByTestId('metric-hours-progress');
      expect(hoursProgress.textContent).toContain('620 h');
      expect(hoursProgress.textContent).toContain('800 h');

      // Verify Status Badge
      const statusBadge = screen.getByTestId('compliance-status-badge');
      expect(statusBadge.textContent).toContain('Em Progresso');
    });

    it('renders 100% compliant state properly when requirements are met', () => {
      const compliantSummary: AttendanceComplianceSummaryDto = {
        ...mockComplianceSummary,
        presentDays: 205,
        totalHoursLogged: 850,
        daysCompliancePercentage: 100,
        hoursCompliancePercentage: 100,
        isCompliant: true,
      };

      render(
        <ComplianceGauge
          summary={compliantSummary}
          requirement={mockComplianceRequirement}
        />
      );

      const statusBadge = screen.getByTestId('compliance-status-badge');
      expect(statusBadge.textContent).toContain('Conforme com as Metas Legais');
    });

    it('renders empty fallback when summary is null', () => {
      render(<ComplianceGauge summary={null} />);
      expect(screen.getByTestId('compliance-gauge-empty')).toBeDefined();
    });
  });

  describe('AttendanceTrackerView', () => {
    it('logs individual and bulk attendance with status badges', async () => {
      const logSingleMock = vi.fn().mockResolvedValue(undefined);
      const logBulkMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <AttendanceTrackerView
            records={mockAttendanceRecords}
            complianceSummary={mockComplianceSummary}
            complianceRequirement={mockComplianceRequirement}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={logSingleMock}
            onBulkLogAttendance={logBulkMock}
          />
        </AuthProvider>
      );

      // Verify Attendance Table & Status Badges
      expect(screen.getByTestId('attendance-table-container')).toBeDefined();
      expect(screen.getByTestId('attendance-status-badge-att-1').textContent).toContain('Presente');
      expect(screen.getByTestId('attendance-status-badge-att-2').textContent).toContain('Passeio Educativo');
      expect(screen.getByTestId('attendance-status-badge-att-3').textContent).toContain('Falta Justificada');

      // --- Test Individual Attendance Logging ---
      fireEvent.click(screen.getByTestId('open-log-attendance-btn'));
      expect(screen.getByTestId('single-attendance-modal')).toBeDefined();

      fireEvent.change(screen.getByTestId('attendance-learner-select'), {
        target: { value: mockLearners[0]!.id },
      });
      fireEvent.change(screen.getByTestId('attendance-date-input'), {
        target: { value: '2026-08-27' },
      });
      fireEvent.change(screen.getByTestId('attendance-status-select'), {
        target: { value: 'PRESENT' },
      });
      fireEvent.change(screen.getByTestId('attendance-hours-input'), {
        target: { value: '4' },
      });
      fireEvent.change(screen.getByTestId('attendance-notes-input'), {
        target: { value: 'Lição individual concluída com êxito.' },
      });

      await fireEvent.click(screen.getByTestId('save-attendance-btn'));

      expect(logSingleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          learnerId: mockLearners[0]!.id,
          date: '2026-08-27',
          status: 'PRESENT',
          hoursSpent: 4,
          notes: 'Lição individual concluída com êxito.',
        })
      );
    });

    it('logs bulk attendance for multiple selected learners', async () => {
      const logSingleMock = vi.fn().mockResolvedValue(undefined);
      const logBulkMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <AttendanceTrackerView
            records={mockAttendanceRecords}
            complianceSummary={mockComplianceSummary}
            complianceRequirement={mockComplianceRequirement}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={logSingleMock}
            onBulkLogAttendance={logBulkMock}
          />
        </AuthProvider>
      );

      // --- Test Bulk Attendance Logging ---
      fireEvent.click(screen.getByTestId('open-bulk-attendance-btn'));
      expect(screen.getByTestId('bulk-attendance-modal')).toBeDefined();

      fireEvent.change(screen.getByTestId('bulk-attendance-date-input'), {
        target: { value: '2026-08-28' },
      });
      fireEvent.change(screen.getByTestId('bulk-attendance-status-select'), {
        target: { value: 'FIELD_TRIP' },
      });
      fireEvent.change(screen.getByTestId('bulk-attendance-hours-input'), {
        target: { value: '6' },
      });
      fireEvent.change(screen.getByTestId('bulk-attendance-notes-input'), {
        target: { value: 'Passeio botânico e histórico em família.' },
      });

      await fireEvent.click(screen.getByTestId('save-bulk-attendance-btn'));

      expect(logBulkMock).toHaveBeenCalledWith(
        expect.objectContaining({
          learnerIds: expect.arrayContaining([mockLearners[0]!.id, mockLearners[1]!.id]),
          date: '2026-08-28',
          status: 'FIELD_TRIP',
          hoursSpent: 6,
          notes: 'Passeio botânico e histórico em família.',
        })
      );
    });
  });

  describe('ReportGeneratorView', () => {
    it('allows generating official reports with grading scale selection', async () => {
      const generateReportMock = vi.fn().mockResolvedValue(mockOfficialReport);
      const deleteReportMock = vi.fn().mockResolvedValue(undefined);
      const exportCsvMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <ReportGeneratorView
            reports={[mockOfficialReport]}
            learners={mockLearners}
            activeLearnerId={null}
            onGenerateReport={generateReportMock}
            onDeleteReport={deleteReportMock}
            onExportCsv={exportCsvMock}
          />
        </AuthProvider>
      );

      // Verify report card rendered
      expect(screen.getByTestId('report-card-rep-1')).toBeDefined();
      expect(screen.getByText('Histórico Escolar Oficial - Samuel Silva 2026')).toBeDefined();

      // Open Generate Modal
      fireEvent.click(screen.getByTestId('open-generate-report-btn'));
      expect(screen.getByTestId('generate-report-modal')).toBeDefined();

      // Fill Learner
      fireEvent.change(screen.getByTestId('report-learner-select'), {
        target: { value: mockLearners[1]!.id },
      });

      // Fill Type
      fireEvent.change(screen.getByTestId('report-type-select'), {
        target: { value: 'ACADEMIC_TRANSCRIPT' },
      });

      // Fill Title
      fireEvent.change(screen.getByTestId('report-title-input'), {
        target: { value: 'Histórico Escolar Oficial - Ester Silva 2026' },
      });

      // Select Grading Scale (e.g. LETTER_A_F)
      fireEvent.change(screen.getByTestId('report-grading-scale-select'), {
        target: { value: 'LETTER_A_F' },
      });

      // Check attendance & portfolio checkboxes
      fireEvent.click(screen.getByTestId('report-include-attendance-checkbox')); // toggle
      fireEvent.click(screen.getByTestId('report-include-attendance-checkbox')); // toggle back to true

      // Fill Notes
      fireEvent.change(screen.getByTestId('report-notes-input'), {
        target: { value: 'Excelente desenvolvimento em artes e música.' },
      });

      // Submit
      fireEvent.click(screen.getByTestId('generate-report-btn'));

      expect(generateReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          learnerId: mockLearners[1]!.id,
          type: 'ACADEMIC_TRANSCRIPT',
          title: 'Histórico Escolar Oficial - Ester Silva 2026',
          gradingScale: 'LETTER_A_F',
          includeAttendance: true,
          includePortfolioHighlights: true,
          notes: 'Excelente desenvolvimento em artes e música.',
        })
      );

      // Test Export CSV on card
      fireEvent.click(screen.getByTestId('export-csv-btn-rep-1'));
      expect(exportCsvMock).toHaveBeenCalledWith('rep-1');

      // Test Delete Report
      fireEvent.click(screen.getByTestId('delete-report-btn-rep-1'));
      expect(deleteReportMock).toHaveBeenCalledWith('rep-1');
    });

    it('hides generate and delete report buttons for EDUCATOR role', () => {
      render(
        <AuthProvider role="EDUCATOR">
          <ReportGeneratorView
            reports={[mockOfficialReport]}
            learners={mockLearners}
            activeLearnerId={null}
            onGenerateReport={vi.fn()}
            onDeleteReport={vi.fn()}
            onExportCsv={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.queryByTestId('open-generate-report-btn')).toBeNull();
      expect(screen.queryByTestId('delete-report-btn-rep-1')).toBeNull();
      // Educator can still view and export CSV of generated reports
      expect(screen.getByTestId('view-report-btn-rep-1')).toBeDefined();
      expect(screen.getByTestId('export-csv-btn-rep-1')).toBeDefined();
    });
  });

  describe('PrintableTranscript', () => {
    it('displays official school header, subject grade table, attendance summary, and download CSV button', () => {
      const exportCsvMock = vi.fn();
      const printMock = vi.fn();

      render(
        <PrintableTranscript
          report={mockOfficialReport}
          transcript={mockTranscriptData}
          onExportCsv={exportCsvMock}
          onPrint={printMock}
        />
      );

      // Verify Official School Header
      const orgName = screen.getByTestId('transcript-organization-name');
      expect(orgName.textContent).toContain('Academia Familiar Silva');

      const title = screen.getByTestId('transcript-title');
      expect(title.textContent).toContain('Histórico Escolar Oficial - Samuel Silva 2026');

      // Verify Learner Info Block
      expect(screen.getByTestId('transcript-learner-name').textContent).toContain('Samuel Silva');
      expect(screen.getByTestId('transcript-learner-birth').textContent).toContain('2016-05-12');
      expect(screen.getByTestId('transcript-grade-level').textContent).toContain('Primary Grammar (4º Ano)');
      expect(screen.getByTestId('transcript-academic-year').textContent).toContain('Ano Letivo 2026');

      // Verify Grading Scale Badge
      expect(screen.getByTestId('transcript-grading-scale').textContent).toContain('Escala Qualitativa de Domínio');

      // Verify Subject Grade Table
      expect(screen.getByTestId('subject-grades-table')).toBeDefined();
      expect(screen.getByTestId('subject-grade-row-sub-1')).toBeDefined();
      expect(screen.getByText('Latim Clássico')).toBeDefined();
      expect(screen.getByText('História & Geografia Bíblica')).toBeDefined();

      // Verify Attendance Summary
      const attendanceSection = screen.getByTestId('transcript-attendance-summary');
      expect(attendanceSection.textContent).toContain('160');
      expect(attendanceSection.textContent).toContain('155');
      expect(attendanceSection.textContent).toContain('620 h');

      // Verify Signatures
      expect(screen.getByTestId('transcript-signatures')).toBeDefined();

      // Verify Download CSV Button
      const downloadCsvBtn = screen.getByTestId('download-csv-btn');
      fireEvent.click(downloadCsvBtn);
      expect(exportCsvMock).toHaveBeenCalledWith('rep-1');

      // Verify Print Button
      const printBtn = screen.getByTestId('print-transcript-btn');
      fireEvent.click(printBtn);
      expect(printMock).toHaveBeenCalled();
    });
  });
});
