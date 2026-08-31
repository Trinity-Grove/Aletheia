import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { DataExportJobEntity } from '../domain/data-export-job.entity.js';
import type {
  ExportStatus,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';

interface DataExportJobDbRecord {
  id: string;
  familyId: string;
  requestedById: string;
  status: ExportStatus;
  downloadUrl: string | null;
  fileSizeBytes: number | null;
  completedAt: Date | null;
  errorReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DataExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(familyId: string, requestedById: string): Promise<DataExportJobEntity> {
    const record = await this.prisma.dataExportJob.create({
      data: {
        familyId,
        requestedById,
        status: 'PENDING',
      },
    });

    return this.mapToEntity(record as DataExportJobDbRecord);
  }

  async findById(familyId: string, id: string): Promise<DataExportJobEntity | null> {
    const record = await this.prisma.dataExportJob.findFirst({
      where: {
        id,
        familyId,
      },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as DataExportJobDbRecord);
  }

  async findRecentJobs(familyId: string, limit = 20): Promise<DataExportJobEntity[]> {
    const records = await this.prisma.dataExportJob.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((r) => this.mapToEntity(r as DataExportJobDbRecord));
  }

  async updateJob(
    familyId: string,
    id: string,
    data: {
      status?: ExportStatus;
      downloadUrl?: string | null;
      fileSizeBytes?: number | null;
      completedAt?: Date | null;
      errorReason?: string | null;
    },
  ): Promise<DataExportJobEntity | null> {
    const existing = await this.prisma.dataExportJob.findFirst({
      where: {
        id,
        familyId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.dataExportJob.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.downloadUrl !== undefined ? { downloadUrl: data.downloadUrl } : {}),
        ...(data.fileSizeBytes !== undefined ? { fileSizeBytes: data.fileSizeBytes } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.errorReason !== undefined ? { errorReason: data.errorReason } : {}),
      },
    });

    return this.mapToEntity(updated as DataExportJobDbRecord);
  }

  async aggregateFamilyData(familyId: string): Promise<FamilyDataExportPackageDto> {
    const [
      family,
      settings,
      members,
      learners,
      devotionals,
      prayerRequests,
      academicYears,
      subjects,
      curriculumPlans,
      lessonPlans,
      scheduleSlots,
      learningRecords,
      portfolioItems,
      attendanceRecords,
      complianceRequirements,
      officialReports,
      notifications,
    ] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.prisma.familySettings.findUnique({ where: { familyId } }),
      this.prisma.familyMember.findMany({
        where: { familyId },
        include: { user: { select: { id: true, email: true, fullName: true } } },
      }),
      this.prisma.learner.findMany({ where: { familyId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.dailyDevotional.findMany({ where: { familyId }, orderBy: { date: 'desc' } }),
      this.prisma.prayerRequest.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.academicYear.findMany({ where: { familyId }, orderBy: { year: 'desc' } }),
      this.prisma.subject.findMany({ where: { familyId }, orderBy: { name: 'asc' } }),
      this.prisma.learnerCurriculumPlan.findMany({ where: { familyId } }),
      this.prisma.lessonPlan.findMany({
        where: { familyId },
        include: { learners: true, objectives: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.weeklyScheduleSlot.findMany({
        where: { familyId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.learningRecord.findMany({
        where: { familyId },
        include: { objectives: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.portfolioItem.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.attendanceRecord.findMany({ where: { familyId }, orderBy: { date: 'desc' } }),
      this.prisma.complianceRequirement.findMany({ where: { familyId } }),
      this.prisma.officialReport.findMany({ where: { familyId }, orderBy: { generatedAt: 'desc' } }),
      this.prisma.notificationItem.findMany({ where: { familyId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const serialize = <T>(val: T): any => (val ? JSON.parse(JSON.stringify(val)) : null);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      family: serialize(family) ?? {},
      settings: serialize(settings),
      members: serialize(members) ?? [],
      learners: serialize(learners) ?? [],
      devotionals: serialize(devotionals) ?? [],
      prayerRequests: serialize(prayerRequests) ?? [],
      academicYears: serialize(academicYears) ?? [],
      subjects: serialize(subjects) ?? [],
      curriculumPlans: serialize(curriculumPlans) ?? [],
      lessonPlans: serialize(lessonPlans) ?? [],
      scheduleSlots: serialize(scheduleSlots) ?? [],
      learningRecords: serialize(learningRecords) ?? [],
      portfolioItems: serialize(portfolioItems) ?? [],
      attendanceRecords: serialize(attendanceRecords) ?? [],
      complianceRequirements: serialize(complianceRequirements) ?? [],
      officialReports: serialize(officialReports) ?? [],
      notifications: serialize(notifications) ?? [],
    };
  }

  private mapToEntity(record: DataExportJobDbRecord): DataExportJobEntity {
    return new DataExportJobEntity({
      id: record.id,
      familyId: record.familyId,
      requestedById: record.requestedById,
      status: record.status,
      downloadUrl: record.downloadUrl,
      fileSizeBytes: record.fileSizeBytes,
      completedAt: record.completedAt,
      errorReason: record.errorReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
