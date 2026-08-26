import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { AttendanceRecordEntity } from '../domain/attendance-record.entity.js';
import type {
  AttendanceFilterDto,
  BulkLogAttendanceDto,
  LogAttendanceDto,
} from '@aletheia/contracts';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async log(familyId: string, dto: LogAttendanceDto): Promise<AttendanceRecordEntity> {
    const dateObj = new Date(dto.date);

    const upserted = await this.prisma.attendanceRecord.upsert({
      where: {
        familyId_learnerId_date: {
          familyId,
          learnerId: dto.learnerId,
          date: dateObj,
        },
      },
      update: {
        academicYearId: dto.academicYearId ?? null,
        status: dto.status ?? 'PRESENT',
        hoursSpent: dto.hoursSpent ?? null,
        notes: dto.notes ?? null,
        isAutoLogged: dto.isAutoLogged ?? false,
      },
      create: {
        familyId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId ?? null,
        date: dateObj,
        status: dto.status ?? 'PRESENT',
        hoursSpent: dto.hoursSpent ?? null,
        notes: dto.notes ?? null,
        isAutoLogged: dto.isAutoLogged ?? false,
      },
      include: {
        learner: true,
      },
    });

    return this.mapAttendanceRecord(upserted);
  }

  async bulkLog(familyId: string, dto: BulkLogAttendanceDto): Promise<AttendanceRecordEntity[]> {
    const results: AttendanceRecordEntity[] = [];

    for (const learnerId of dto.learnerIds) {
      const record = await this.log(familyId, {
        learnerId,
        academicYearId: dto.academicYearId,
        date: dto.date,
        status: dto.status,
        hoursSpent: dto.hoursSpent,
        notes: dto.notes,
        isAutoLogged: dto.isAutoLogged,
      });
      results.push(record);
    }

    return results;
  }

  async findById(familyId: string, id: string): Promise<AttendanceRecordEntity | null> {
    const row = await this.prisma.attendanceRecord.findFirst({
      where: { id, familyId },
      include: {
        learner: true,
      },
    });

    return row ? this.mapAttendanceRecord(row) : null;
  }

  async list(familyId: string, filter: AttendanceFilterDto = {}): Promise<AttendanceRecordEntity[]> {
    const where: Record<string, unknown> = { familyId };

    if (filter.learnerId) {
      where.learnerId = filter.learnerId;
    }
    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }
    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.date = dateFilter;
    }

    const rows = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        learner: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => this.mapAttendanceRecord(r));
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.attendanceRecord.delete({ where: { id } });
    return true;
  }

  private mapAttendanceRecord(row: any): AttendanceRecordEntity {
    const learnerName = row.learner
      ? row.learner.preferredName ||
        `${row.learner.firstName}${row.learner.lastName ? ' ' + row.learner.lastName : ''}`
      : undefined;

    return new AttendanceRecordEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.academicYearId ?? null,
      row.date,
      row.status,
      row.hoursSpent ?? null,
      row.notes ?? null,
      row.isAutoLogged,
      row.createdAt,
      row.updatedAt,
      learnerName,
    );
  }
}
