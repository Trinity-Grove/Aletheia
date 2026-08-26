import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../platform/database/prisma.service.js";
import {
  LessonPlanEntity,
  LessonPlanLearnerEntity,
  LessonPlanObjectiveEntity,
} from "../domain/lesson-plan.entity.js";
import type {
  CreateLessonPlanDto,
  LessonStatus,
  UpdateLessonPlanDto,
} from "@aletheia/contracts";

export interface LessonPlanFilter {
  date?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  subjectId?: string | undefined;
  learnerId?: string | undefined;
  status?: LessonStatus | undefined;
  academicYearId?: string | undefined;
}

@Injectable()
export class LessonPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateLessonPlanDto): Promise<LessonPlanEntity> {
    const dateObj = new Date(dto.date);

    const data: Parameters<typeof this.prisma.lessonPlan.create>[0]['data'] = {
      familyId,
      academicYearId: dto.academicYearId ?? null,
      subjectId: dto.subjectId,
      title: dto.title,
      description: dto.description ?? null,
      date: dateObj,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
      durationMinutes: dto.durationMinutes ?? null,
      status: "PLANNED",
      materials: dto.materials ?? null,
      homework: dto.homework ?? null,
      notes: dto.notes ?? null,
      learners: {
        create: dto.learnerIds.map((learnerId) => ({
          learnerId,
        })),
      },
    };

    if (dto.objectiveIds && dto.objectiveIds.length > 0) {
      data.objectives = {
        create: dto.objectiveIds.map((objectiveId) => ({
          objectiveId,
        })),
      };
    }

    const created = await this.prisma.lessonPlan.create({
      data,
      include: {
        subject: true,
        learners: {
          include: {
            learner: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
      },
    });

    return this.mapLessonPlan(created);
  }

  async findById(familyId: string, id: string): Promise<LessonPlanEntity | null> {
    const row = await this.prisma.lessonPlan.findFirst({
      where: { id, familyId },
      include: {
        subject: true,
        learners: {
          include: {
            learner: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
      },
    });

    return row ? this.mapLessonPlan(row) : null;
  }

  async list(familyId: string, filter: LessonPlanFilter = {}): Promise<LessonPlanEntity[]> {
    const where: Record<string, unknown> = { familyId };

    if (filter.subjectId) {
      where.subjectId = filter.subjectId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.academicYearId) {
      where.academicYearId = filter.academicYearId;
    }
    if (filter.learnerId) {
      where.learners = {
        some: {
          learnerId: filter.learnerId,
        },
      };
    }

    if (filter.date) {
      where.date = new Date(filter.date);
    } else if (filter.startDate || filter.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.date = dateFilter;
    }

    const rows = await this.prisma.lessonPlan.findMany({
      where,
      include: {
        subject: true,
        learners: {
          include: {
            learner: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    });

    return rows.map((r: any) => this.mapLessonPlan(r));
  }

  async update(familyId: string, id: string, dto: UpdateLessonPlanDto): Promise<LessonPlanEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId;
    if (dto.academicYearId !== undefined) data.academicYearId = dto.academicYearId ?? null;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.startTime !== undefined) data.startTime = dto.startTime ?? null;
    if (dto.endTime !== undefined) data.endTime = dto.endTime ?? null;
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes ?? null;
    if (dto.materials !== undefined) data.materials = dto.materials ?? null;
    if (dto.homework !== undefined) data.homework = dto.homework ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes ?? null;

    if (dto.learnerIds !== undefined) {
      await this.prisma.lessonPlanLearner.deleteMany({
        where: { lessonPlanId: id },
      });
      data.learners = {
        create: dto.learnerIds.map((learnerId) => ({
          learnerId,
        })),
      };
    }

    if (dto.objectiveIds !== undefined) {
      await this.prisma.lessonPlanObjective.deleteMany({
        where: { lessonPlanId: id },
      });
      data.objectives = {
        create: dto.objectiveIds.map((objectiveId) => ({
          objectiveId,
        })),
      };
    }

    const updated = await this.prisma.lessonPlan.update({
      where: { id },
      data,
      include: {
        subject: true,
        learners: {
          include: {
            learner: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
      },
    });

    return this.mapLessonPlan(updated);
  }

  async completeLesson(
    familyId: string,
    id: string,
    params: {
      completedAt?: Date | null | undefined;
      actualDurationMinutes?: number | null | undefined;
      notes?: string | null | undefined;
      learnerNotes?: Record<string, string> | undefined;
      learnerId?: string | undefined;
    },
  ): Promise<LessonPlanEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const completedAt = params.completedAt ?? new Date();

    if (params.learnerId) {
      // Mark completion and note for specific learner
      const updateLearnerData: Record<string, unknown> = {
        completed: true,
      };
      if (params.learnerNotes && params.learnerNotes[params.learnerId] !== undefined) {
        updateLearnerData.notes = params.learnerNotes[params.learnerId];
      } else if (params.notes) {
        updateLearnerData.notes = params.notes;
      }

      await this.prisma.lessonPlanLearner.updateMany({
        where: {
          lessonPlanId: id,
          learnerId: params.learnerId,
        },
        data: updateLearnerData,
      });

      // Check if all learners assigned to this lesson are completed
      const allLearners = await this.prisma.lessonPlanLearner.findMany({
        where: { lessonPlanId: id },
      });
      const allCompleted = allLearners.every((l: any) => l.completed);

      const updateData: Record<string, unknown> = {};
      if (allCompleted) {
        updateData.status = "COMPLETED";
        updateData.completedAt = completedAt;
      } else {
        updateData.status = "IN_PROGRESS";
      }

      if (params.actualDurationMinutes !== undefined && params.actualDurationMinutes !== null) {
        updateData.actualDurationMinutes = params.actualDurationMinutes;
      }
      if (params.notes !== undefined && params.notes !== null) {
        const combinedNotes = existing.notes ? `${existing.notes}\n${params.notes}` : params.notes;
        updateData.notes = combinedNotes;
      }

      await this.prisma.lessonPlan.update({
        where: { id },
        data: updateData,
      });
    } else {
      // Mark all learners completed
      await this.prisma.lessonPlanLearner.updateMany({
        where: { lessonPlanId: id },
        data: { completed: true },
      });

      if (params.learnerNotes) {
        for (const [lId, note] of Object.entries(params.learnerNotes)) {
          await this.prisma.lessonPlanLearner.updateMany({
            where: { lessonPlanId: id, learnerId: lId },
            data: { notes: note },
          });
        }
      }

      const updateData: Record<string, unknown> = {
        status: "COMPLETED",
        completedAt,
      };
      if (params.actualDurationMinutes !== undefined) {
        updateData.actualDurationMinutes = params.actualDurationMinutes;
      }
      if (params.notes !== undefined) {
        updateData.notes = params.notes;
      }

      await this.prisma.lessonPlan.update({
        where: { id },
        data: updateData,
      });
    }

    return this.findById(familyId, id);
  }

  async reschedule(
    familyId: string,
    id: string,
    params: {
      newDate: string;
      startTime?: string | null | undefined;
      endTime?: string | null | undefined;
      reason?: string | null | undefined;
    },
  ): Promise<LessonPlanEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {
      date: new Date(params.newDate),
      status: "POSTPONED",
    };

    if (params.startTime !== undefined) {
      data.startTime = params.startTime;
    }
    if (params.endTime !== undefined) {
      data.endTime = params.endTime;
    }

    if (params.reason) {
      const rescheduleNote = `[Reagendado para ${params.newDate}]: ${params.reason}`;
      data.notes = existing.notes ? `${existing.notes}\n${rescheduleNote}` : rescheduleNote;
    }

    const updated = await this.prisma.lessonPlan.update({
      where: { id },
      data,
      include: {
        subject: true,
        learners: {
          include: {
            learner: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
      },
    });

    return this.mapLessonPlan(updated);
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.lessonPlan.delete({ where: { id } });
    return true;
  }

  private mapLessonPlan(row: any): LessonPlanEntity {
    const learners = (row.learners || []).map((l: any) => {
      const name = l.learner
        ? l.learner.preferredName || `${l.learner.firstName}${l.learner.lastName ? " " + l.learner.lastName : ""}`
        : undefined;
      return new LessonPlanLearnerEntity(
        l.id,
        l.lessonPlanId,
        l.learnerId,
        l.notes ?? null,
        l.completed ?? false,
        l.createdAt,
        name,
      );
    });

    const objectives = (row.objectives || []).map((o: any) => {
      const title = o.objective ? o.objective.title : undefined;
      return new LessonPlanObjectiveEntity(
        o.id,
        o.lessonPlanId,
        o.objectiveId,
        o.createdAt,
        title,
      );
    });

    return new LessonPlanEntity(
      row.id,
      row.familyId,
      row.academicYearId ?? null,
      row.subjectId,
      row.title,
      row.description ?? null,
      row.date,
      row.startTime ?? null,
      row.endTime ?? null,
      row.durationMinutes ?? null,
      row.actualDurationMinutes ?? null,
      row.status as LessonStatus,
      row.materials ?? null,
      row.homework ?? null,
      row.notes ?? null,
      row.completedAt ?? null,
      row.createdAt,
      row.updatedAt,
      learners,
      objectives,
      row.subject?.name,
      row.subject?.color ?? null,
    );
  }
}
