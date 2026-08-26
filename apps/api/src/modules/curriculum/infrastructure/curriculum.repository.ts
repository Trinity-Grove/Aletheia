import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { AcademicYearEntity } from '../domain/academic-year.entity.js';
import { SubjectEntity } from '../domain/subject.entity.js';
import { LearnerCurriculumPlanEntity } from '../domain/learner-plan.entity.js';
import type { CreateAcademicYearDto, CreateSubjectDto, UpdateSubjectDto, UpsertLearnerPlanDto } from '@aletheia/contracts';

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Academic Years
  async createAcademicYear(familyId: string, dto: CreateAcademicYearDto): Promise<AcademicYearEntity> {
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { familyId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const row = await this.prisma.academicYear.create({
      data: {
        familyId,
        year: dto.year,
        title: dto.title,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
      },
    });
    return this.mapYear(row);
  }

  async listAcademicYears(familyId: string): Promise<AcademicYearEntity[]> {
    const rows = await this.prisma.academicYear.findMany({
      where: { familyId },
      orderBy: { year: 'desc' },
    });
    return rows.map((r: any) => this.mapYear(r));
  }

  async findAcademicYearById(familyId: string, id: string): Promise<AcademicYearEntity | null> {
    const row = await this.prisma.academicYear.findFirst({
      where: { id, familyId },
    });
    return row ? this.mapYear(row) : null;
  }

  async findCurrentAcademicYear(familyId: string): Promise<AcademicYearEntity | null> {
    const row = await this.prisma.academicYear.findFirst({
      where: { familyId, isCurrent: true },
    });
    return row ? this.mapYear(row) : null;
  }

  // Subjects
  async createSubject(familyId: string, dto: CreateSubjectDto): Promise<SubjectEntity> {
    const row = await this.prisma.subject.create({
      data: {
        familyId,
        name: dto.name,
        color: dto.color ?? '#3B82F6',
        icon: dto.icon ?? null,
        description: dto.description ?? null,
      },
    });
    return this.mapSubject(row);
  }

  async listSubjects(familyId: string, includeArchived = false): Promise<SubjectEntity[]> {
    const where: Record<string, unknown> = { familyId };
    if (!includeArchived) {
      where.archivedAt = null;
    }
    const rows = await this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return rows.map((r: any) => this.mapSubject(r));
  }

  async findSubjectById(familyId: string, id: string): Promise<SubjectEntity | null> {
    const row = await this.prisma.subject.findFirst({
      where: { id, familyId },
    });
    return row ? this.mapSubject(row) : null;
  }

  async findSubjectByName(familyId: string, name: string): Promise<SubjectEntity | null> {
    const row = await this.prisma.subject.findFirst({
      where: { familyId, name },
    });
    return row ? this.mapSubject(row) : null;
  }

  async updateSubject(familyId: string, id: string, dto: UpdateSubjectDto): Promise<SubjectEntity | null> {
    const exists = await this.findSubjectById(familyId, id);
    if (!exists) return null;

    const row = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return this.mapSubject(row);
  }

  async archiveSubject(familyId: string, id: string): Promise<SubjectEntity | null> {
    const exists = await this.findSubjectById(familyId, id);
    if (!exists) return null;

    const row = await this.prisma.subject.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return this.mapSubject(row);
  }

  // Learner Plans
  async upsertLearnerPlan(familyId: string, dto: UpsertLearnerPlanDto): Promise<LearnerCurriculumPlanEntity> {
    const row = await this.prisma.learnerCurriculumPlan.upsert({
      where: {
        familyId_learnerId_academicYearId: {
          familyId,
          learnerId: dto.learnerId,
          academicYearId: dto.academicYearId,
        },
      },
      create: {
        familyId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId,
        pedagogicalFramework: dto.pedagogicalFramework ?? 'CUSTOM',
        notes: dto.notes ?? null,
      },
      update: {
        pedagogicalFramework: dto.pedagogicalFramework ?? 'CUSTOM',
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
    return this.mapPlan(row);
  }

  async findLearnerPlan(
    familyId: string,
    learnerId: string,
    academicYearId: string,
  ): Promise<LearnerCurriculumPlanEntity | null> {
    const row = await this.prisma.learnerCurriculumPlan.findUnique({
      where: {
        familyId_learnerId_academicYearId: {
          familyId,
          learnerId,
          academicYearId,
        },
      },
    });
    return row ? this.mapPlan(row) : null;
  }

  private mapYear(row: any): AcademicYearEntity {
    return new AcademicYearEntity(
      row.id,
      row.familyId,
      row.year,
      row.title,
      row.startDate,
      row.endDate,
      row.isCurrent,
      row.createdAt,
      row.updatedAt,
    );
  }

  private mapSubject(row: any): SubjectEntity {
    return new SubjectEntity(
      row.id,
      row.familyId,
      row.name,
      row.color,
      row.icon,
      row.description,
      row.archivedAt,
      row.createdAt,
      row.updatedAt,
    );
  }

  private mapPlan(row: any): LearnerCurriculumPlanEntity {
    return new LearnerCurriculumPlanEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.academicYearId,
      row.pedagogicalFramework,
      row.notes,
      row.createdAt,
      row.updatedAt,
    );
  }
}
