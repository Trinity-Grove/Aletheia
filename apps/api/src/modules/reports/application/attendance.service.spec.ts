import { AttendanceService } from './attendance.service.js';
import { AttendanceRecordEntity } from '../domain/attendance-record.entity.js';
import { ComplianceRequirementEntity } from '../domain/compliance-requirement.entity.js';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let complianceRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const LEARNER_2_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23';
  const YEAR_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const RECORD_ID = 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const REQ_ID = 'req0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  beforeEach(() => {
    attendanceRepo = {
      log: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new AttendanceRecordEntity(
            RECORD_ID,
            familyId,
            dto.learnerId,
            dto.academicYearId ?? null,
            new Date(dto.date),
            dto.status ?? 'PRESENT',
            dto.hoursSpent ?? null,
            dto.notes ?? null,
            dto.isAutoLogged ?? false,
            new Date(),
            new Date(),
            'Alice Smith',
          ),
        ),
      ),
      bulkLog: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          dto.learnerIds.map(
            (id: string, idx: number) =>
              new AttendanceRecordEntity(
                `rec-${idx}`,
                familyId,
                id,
                dto.academicYearId ?? null,
                new Date(dto.date),
                dto.status ?? 'PRESENT',
                dto.hoursSpent ?? null,
                dto.notes ?? null,
                dto.isAutoLogged ?? false,
                new Date(),
                new Date(),
                id === LEARNER_ID ? 'Alice Smith' : 'Bob Smith',
              ),
          ),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) =>
        Promise.resolve(
          new AttendanceRecordEntity(
            id,
            familyId,
            LEARNER_ID,
            YEAR_ID,
            new Date('2026-03-15'),
            'PRESENT',
            4.5,
            'Good progress',
            false,
            new Date(),
            new Date(),
            'Alice Smith',
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
    };

    complianceRepo = {
      upsertRequirement: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new ComplianceRequirementEntity(
            REQ_ID,
            familyId,
            dto.academicYearId,
            dto.learnerId ?? null,
            dto.jurisdiction ?? null,
            dto.minInstructionalDays ?? null,
            dto.minInstructionalHours ?? null,
            dto.notes ?? null,
            new Date(),
            new Date(),
            'Ano Letivo 2026',
            dto.learnerId ? 'Alice Smith' : undefined,
          ),
        ),
      ),
      findRequirement: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new AttendanceService(attendanceRepo, complianceRepo);
  });

  describe('Single & Bulk Logging', () => {
    it('logs attendance for a single learner', async () => {
      const res = await service.logAttendance(FAMILY_ID, {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        date: '2026-03-15',
        status: 'PRESENT',
        hoursSpent: 4,
      });

      expect(res.id).toBe(RECORD_ID);
      expect(res.learnerId).toBe(LEARNER_ID);
      expect(res.status).toBe('PRESENT');
      expect(res.date).toBe('2026-03-15');
      expect(attendanceRepo.log).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.objectContaining({ learnerId: LEARNER_ID }),
      );
    });

    it('bulk logs attendance for multiple learners', async () => {
      const res = await service.bulkLogAttendance(FAMILY_ID, {
        learnerIds: [LEARNER_ID, LEARNER_2_ID],
        academicYearId: YEAR_ID,
        date: '2026-03-15',
        status: 'PRESENT',
        hoursSpent: 5,
      });

      expect(res).toHaveLength(2);
      expect(res[0]?.learnerId).toBe(LEARNER_ID);
      expect(res[1]?.learnerId).toBe(LEARNER_2_ID);
      expect(attendanceRepo.bulkLog).toHaveBeenCalledWith(
        FAMILY_ID,
        expect.objectContaining({ learnerIds: [LEARNER_ID, LEARNER_2_ID] }),
      );
    });
  });

  describe('Get & List Attendance', () => {
    it('retrieves attendance record by id', async () => {
      const res = await service.getAttendance(FAMILY_ID, RECORD_ID);
      expect(res.id).toBe(RECORD_ID);
      expect(res.hoursSpent).toBe(4.5);
    });

    it('throws NotFoundException when record not found', async () => {
      attendanceRepo.findById.mockResolvedValue(null);
      await expect(service.getAttendance(FAMILY_ID, 'non-existent')).rejects.toThrow(
        'Attendance record not found',
      );
    });

    it('deletes an attendance record', async () => {
      const res = await service.deleteAttendance(FAMILY_ID, RECORD_ID);
      expect(res).toBe(true);
      expect(attendanceRepo.delete).toHaveBeenCalledWith(FAMILY_ID, RECORD_ID);
    });
  });

  describe('Compliance Requirements', () => {
    it('upserts a compliance requirement', async () => {
      const res = await service.upsertComplianceRequirement(FAMILY_ID, {
        academicYearId: YEAR_ID,
        minInstructionalDays: 200,
        minInstructionalHours: 800,
        jurisdiction: 'Brazil - LDB',
      });

      expect(res.id).toBe(REQ_ID);
      expect(res.minInstructionalDays).toBe(200);
      expect(res.minInstructionalHours).toBe(800);
    });
  });

  describe('Compliance Summary Calculation', () => {
    it('calculates compliance summary when requirements are met', async () => {
      const records = [
        new AttendanceRecordEntity(
          '1',
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          new Date('2026-03-01'),
          'PRESENT',
          4,
          null,
          false,
          new Date(),
          new Date(),
          'Alice Smith',
        ),
        new AttendanceRecordEntity(
          '2',
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          new Date('2026-03-02'),
          'FIELD_TRIP',
          6,
          null,
          false,
          new Date(),
          new Date(),
          'Alice Smith',
        ),
        new AttendanceRecordEntity(
          '3',
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          new Date('2026-03-03'),
          'SICK',
          0,
          null,
          false,
          new Date(),
          new Date(),
          'Alice Smith',
        ),
      ];

      attendanceRepo.list.mockResolvedValue(records);
      complianceRepo.findRequirement.mockResolvedValue(
        new ComplianceRequirementEntity(
          REQ_ID,
          FAMILY_ID,
          YEAR_ID,
          null,
          'State Requirements',
          2, // required days
          10, // required hours
          null,
          new Date(),
          new Date(),
        ),
      );

      const summary = await service.getComplianceSummary(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(summary.learnerId).toBe(LEARNER_ID);
      expect(summary.learnerName).toBe('Alice Smith');
      expect(summary.totalDaysLogged).toBe(3);
      expect(summary.presentDays).toBe(2); // PRESENT + FIELD_TRIP
      expect(summary.absentDays).toBe(1); // SICK
      expect(summary.totalHoursLogged).toBe(10);
      expect(summary.requiredDays).toBe(2);
      expect(summary.requiredHours).toBe(10);
      expect(summary.daysCompliancePercentage).toBe(100);
      expect(summary.hoursCompliancePercentage).toBe(100);
      expect(summary.isCompliant).toBe(true);
    });

    it('calculates compliance summary when requirements are not yet met', async () => {
      const records = [
        new AttendanceRecordEntity(
          '1',
          FAMILY_ID,
          LEARNER_ID,
          YEAR_ID,
          new Date('2026-03-01'),
          'PRESENT',
          4,
          null,
          false,
          new Date(),
          new Date(),
          'Alice Smith',
        ),
      ];

      attendanceRepo.list.mockResolvedValue(records);
      complianceRepo.findRequirement.mockResolvedValue(
        new ComplianceRequirementEntity(
          REQ_ID,
          FAMILY_ID,
          YEAR_ID,
          null,
          'State Requirements',
          200,
          800,
          null,
          new Date(),
          new Date(),
        ),
      );

      const summary = await service.getComplianceSummary(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(summary.totalDaysLogged).toBe(1);
      expect(summary.presentDays).toBe(1);
      expect(summary.totalHoursLogged).toBe(4);
      expect(summary.daysCompliancePercentage).toBe(0.5);
      expect(summary.hoursCompliancePercentage).toBe(0.5);
      expect(summary.isCompliant).toBe(false);
    });
  });
});
