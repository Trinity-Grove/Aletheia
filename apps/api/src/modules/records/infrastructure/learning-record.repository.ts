import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import {
  LearningRecordEntity,
  LearningRecordObjectiveEntity,
} from '../domain/learning-record.entity.js';
import type {
  CreateLearningRecordDto,
  LearningRecordFilterDto,
  UpdateLearningRecordDto,
} from '@aletheia/contracts';

@Injectable()
export class LearningRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateLearningRecordDto): Promise<LearningRecordEntity> {
    const dateObj = new Date(dto.date);

    const data: Parameters<typeof this.prisma.learningRecord.create>[0]['data'] = {
      familyId,
      learnerId: dto.learnerId,
      subjectId: dto.subjectId ?? null,
      academicYearId: dto.academicYearId ?? null,
      lessonPlanId: dto.lessonPlanId ?? null,
      type: dto.type ?? 'PLANNED_LESSON',
      title: dto.title,
      description: dto.description ?? null,
      date: dateObj,
      durationMinutes: dto.durationMinutes ?? null,
      masteryLevel: dto.masteryLevel ?? 'DEVELOPING',
      assessmentMethod: dto.assessmentMethod ?? 'OBSERVATION',
      strengths: dto.strengths ?? null,
      areasForGrowth: dto.areasForGrowth ?? null,
      characterHabitGrowth: dto.characterHabitGrowth ?? null,
      notes: dto.notes ?? null,
    };

    if (dto.objectiveIds && dto.objectiveIds.length > 0) {
      data.objectives = {
        create: dto.objectiveIds.map((objectiveId) => ({
          objectiveId,
        })),
      };
    }

    const created = await this.prisma.learningRecord.create({
      data,
      include: {
        learner: true,
        subject: true,
        objectives: {
          include: {
            objective: true,
          },
        },
        portfolioItems: {
          select: {
            id: true,
          },
        },
      },
    });

    if (dto.evidenceItemIds && dto.evidenceItemIds.length > 0) {
      await this.prisma.portfolioItem.updateMany({
        where: {
          id: { in: dto.evidenceItemIds },
          familyId,
        },
        data: {
          learningRecordId: created.id,
        },
      });

      return (await this.findById(familyId, created.id))!;
    }

    return this.mapLearningRecord(created);
  }

  async findById(familyId: string, id: string): Promise<LearningRecordEntity | null> {
    const row = await this.prisma.learningRecord.findFirst({
      where: { id, familyId },
      include: {
        learner: true,
        subject: true,
        objectives: {
          include: {
            objective: true,
          },
        },
        portfolioItems: {
          select: {
            id: true,
          },
        },
      },
    });

    return row ? this.mapLearningRecord(row) : null;
  }

  async list(familyId: string, filter: LearningRecordFilterDto = {}): Promise<LearningRecordEntity[]> {
    const where: Record<string, unknown> = { familyId };

    if (filter.learnerId) {
      where.learnerId = filter.learnerId;
    }
    if (filter.subjectId) {
      where.subjectId = filter.subjectId;
    }
    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.masteryLevel) {
      where.masteryLevel = filter.masteryLevel;
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

    const rows = await this.prisma.learningRecord.findMany({
      where,
      include: {
        learner: true,
        subject: true,
        objectives: {
          include: {
            objective: true,
          },
        },
        portfolioItems: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => this.mapLearningRecord(r));
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdateLearningRecordDto,
  ): Promise<LearningRecordEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {};

    if (dto.learnerId !== undefined) data.learnerId = dto.learnerId;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId ?? null;
    if (dto.academicYearId !== undefined) data.academicYearId = dto.academicYearId ?? null;
    if (dto.lessonPlanId !== undefined) data.lessonPlanId = dto.lessonPlanId ?? null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes ?? null;
    if (dto.masteryLevel !== undefined) data.masteryLevel = dto.masteryLevel;
    if (dto.assessmentMethod !== undefined) data.assessmentMethod = dto.assessmentMethod;
    if (dto.strengths !== undefined) data.strengths = dto.strengths ?? null;
    if (dto.areasForGrowth !== undefined) data.areasForGrowth = dto.areasForGrowth ?? null;
    if (dto.characterHabitGrowth !== undefined)
      data.characterHabitGrowth = dto.characterHabitGrowth ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes ?? null;

    if (dto.objectiveIds !== undefined) {
      await this.prisma.learningRecordObjective.deleteMany({
        where: { learningRecordId: id },
      });
      data.objectives = {
        create: dto.objectiveIds.map((objectiveId) => ({
          objectiveId,
        })),
      };
    }

    if (dto.evidenceItemIds !== undefined) {
      // Disconnect portfolio items currently linked to this record that are not in the new list
      await this.prisma.portfolioItem.updateMany({
        where: {
          learningRecordId: id,
          familyId,
          id: { notIn: dto.evidenceItemIds },
        },
        data: {
          learningRecordId: null,
        },
      });

      // Link newly selected portfolio items
      if (dto.evidenceItemIds.length > 0) {
        await this.prisma.portfolioItem.updateMany({
          where: {
            id: { in: dto.evidenceItemIds },
            familyId,
          },
          data: {
            learningRecordId: id,
          },
        });
      }
    }

    const updated = await this.prisma.learningRecord.update({
      where: { id },
      data,
      include: {
        learner: true,
        subject: true,
        objectives: {
          include: {
            objective: true,
          },
        },
        portfolioItems: {
          select: {
            id: true,
          },
        },
      },
    });

    return this.mapLearningRecord(updated);
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.learningRecord.delete({ where: { id } });
    return true;
  }

  private mapLearningRecord(row: any): LearningRecordEntity {
    const learnerName = row.learner
      ? row.learner.preferredName || `${row.learner.firstName}${row.learner.lastName ? ' ' + row.learner.lastName : ''}`
      : undefined;

    const objectives = (row.objectives || []).map((o: any) => {
      const title = o.objective ? o.objective.title : undefined;
      return new LearningRecordObjectiveEntity(
        o.id,
        o.learningRecordId,
        o.objectiveId,
        o.createdAt,
        title,
      );
    });

    const portfolioItemIds = (row.portfolioItems || []).map((p: any) => p.id);

    return new LearningRecordEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.subjectId ?? null,
      row.academicYearId ?? null,
      row.lessonPlanId ?? null,
      row.type,
      row.title,
      row.description ?? null,
      row.date,
      row.durationMinutes ?? null,
      row.masteryLevel,
      row.assessmentMethod,
      row.strengths ?? null,
      row.areasForGrowth ?? null,
      row.characterHabitGrowth ?? null,
      row.notes ?? null,
      row.createdAt,
      row.updatedAt,
      objectives,
      portfolioItemIds,
      learnerName,
      row.subject?.name ?? null,
      row.subject?.color ?? null,
    );
  }
}
