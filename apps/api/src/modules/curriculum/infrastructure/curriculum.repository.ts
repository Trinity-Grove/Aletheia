import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PublishedPedagogicalModel } from './pedagogical-model-definition.resolver.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { AcademicYearEntity } from '../domain/academic-year.entity.js';
import { SubjectEntity } from '../domain/subject.entity.js';
import { LearnerCurriculumPlanEntity } from '../domain/learner-plan.entity.js';
import type { ApplyCurriculumTemplateDto, PedagogicalFramework, CreateAcademicYearDto, CreateSubjectDto, UpdateSubjectDto, UpsertLearnerPlanDto } from '@aletheia/contracts';

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async applyPublishedTemplate(
    familyId: string,
    dto: ApplyCurriculumTemplateDto,
    definition: PublishedPedagogicalModel,
    pedagogicalFramework: PedagogicalFramework,
  ): Promise<{ subjectsCount: number; objectivesCount: number; reusedObjectivesCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const [learner, year] = await Promise.all([
        tx.learner.findFirst({ where: { id: dto.learnerId, familyId }, select: { id: true } }),
        tx.academicYear.findFirst({ where: { id: dto.academicYearId, familyId }, select: { id: true } }),
      ]);
      if (!learner || !year) throw new NotFoundException('Learner or academic year not found');
      const identity = { familyId, learnerId: dto.learnerId, academicYearId: dto.academicYearId };
      await tx.learnerCurriculumPlan.upsert({
        where: { familyId_learnerId_academicYearId: identity },
        create: { ...identity, pedagogicalFramework, pedagogicalModelDefinitionId: definition.id },
        update: { pedagogicalFramework, pedagogicalModelDefinitionId: definition.id },
      });
      let subjectsCount = 0;
      let objectivesCount = 0;
      let reusedObjectivesCount = 0;
      for (const subjectDefinition of definition.subjects) {
        let subject = await tx.subject.findFirst({ where: { familyId, name: subjectDefinition.name } });
        if (!subject) {
          subject = await tx.subject.create({ data: {
            familyId, name: subjectDefinition.name, color: subjectDefinition.color,
            icon: subjectDefinition.icon ?? null, description: subjectDefinition.description,
          } });
          subjectsCount++;
        }
        for (const [order, title] of subjectDefinition.starterObjectives.entries()) {
          const existingObjective = await tx.learningObjective.findFirst({
            where: { ...identity, subjectId: subject.id, title },
            select: { id: true },
          });
          if (existingObjective) {
            reusedObjectivesCount++;
            continue;
          }
          await tx.learningObjective.create({ data: {
            ...identity, subjectId: subject.id, title, order,
          } });
          objectivesCount++;
        }
      }
      return { subjectsCount, objectivesCount, reusedObjectivesCount };
    });
  }

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
    const identity = { familyId, learnerId: dto.learnerId, academicYearId: dto.academicYearId };
    const writePlan = async (client: Pick<Prisma.TransactionClient, 'learnerCurriculumPlan'>) => {
      const existing = dto.pedagogicalFramework === undefined ? null
        : await client.learnerCurriculumPlan.findUnique({
          where: { familyId_learnerId_academicYearId: identity },
          select: { pedagogicalFramework: true },
        });
      const row = await client.learnerCurriculumPlan.upsert({
        where: { familyId_learnerId_academicYearId: identity },
        create: { ...identity, pedagogicalFramework: dto.pedagogicalFramework ?? 'CUSTOM', notes: dto.notes ?? null },
        update: {
          ...(dto.pedagogicalFramework !== undefined ? {
            pedagogicalFramework: dto.pedagogicalFramework,
            ...(existing && existing.pedagogicalFramework !== dto.pedagogicalFramework
              ? { pedagogicalModelDefinitionId: null } : {}),
          } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
      });
      return this.mapPlan(row);
    };
    // Notes-only updates never touch the framework or pin and need no comparison.
    if (dto.pedagogicalFramework === undefined) return writePlan(this.prisma);
    // Keep the comparison and update in one snapshot. A concurrent template
    // application forces a retry, including a fresh read of its framework.
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(writePlan, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (attempt >= 2 || typeof error !== 'object' || error === null
          || !('code' in error) || error.code !== 'P2034') throw error;
      }
    }
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
      row.pedagogicalModelDefinitionId ?? null,
    );
  }
}
