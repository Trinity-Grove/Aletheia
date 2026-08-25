import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { LearningObjectiveEntity } from '../domain/learning-objective.entity.js';
import type { CreateObjectiveDto, ObjectiveStatus, UpdateObjectiveDto } from '@aletheia/contracts';

export interface ObjectiveFilter {
  learnerId?: string;
  subjectId?: string;
  academicYearId?: string;
  status?: ObjectiveStatus;
}

@Injectable()
export class ObjectiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateObjectiveDto): Promise<LearningObjectiveEntity> {
    const row = await this.prisma.learningObjective.create({
      data: {
        familyId,
        learnerId: dto.learnerId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        description: dto.description ?? null,
        status: 'NOT_STARTED',
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        order: dto.order ?? 0,
      },
    });
    return this.mapObjective(row);
  }

  async findById(familyId: string, id: string): Promise<LearningObjectiveEntity | null> {
    const row = await this.prisma.learningObjective.findFirst({
      where: { id, familyId },
    });
    return row ? this.mapObjective(row) : null;
  }

  async list(familyId: string, filter: ObjectiveFilter = {}): Promise<LearningObjectiveEntity[]> {
    const where: Record<string, unknown> = { familyId };
    if (filter.learnerId) where.learnerId = filter.learnerId;
    if (filter.subjectId) where.subjectId = filter.subjectId;
    if (filter.academicYearId) where.academicYearId = filter.academicYearId;
    if (filter.status) where.status = filter.status;

    const rows = await this.prisma.learningObjective.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r: any) => this.mapObjective(r));
  }

  async update(familyId: string, id: string, dto: UpdateObjectiveDto): Promise<LearningObjectiveEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    let achievedAt: Date | null | undefined = undefined;
    if (dto.status === 'ACHIEVED' && existing.status !== 'ACHIEVED') {
      achievedAt = new Date();
    } else if (dto.status && dto.status !== 'ACHIEVED') {
      achievedAt = null;
    }

    const row = await this.prisma.learningObjective.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.targetDate !== undefined ? { targetDate: dto.targetDate ? new Date(dto.targetDate) : null } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(achievedAt !== undefined ? { achievedAt } : {}),
      },
    });
    return this.mapObjective(row);
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.learningObjective.delete({ where: { id } });
    return true;
  }

  async countLearnerObjectives(familyId: string, learnerId: string): Promise<{ total: number; achieved: number }> {
    const total = await this.prisma.learningObjective.count({
      where: { familyId, learnerId },
    });
    const achieved = await this.prisma.learningObjective.count({
      where: { familyId, learnerId, status: 'ACHIEVED' },
    });
    return { total, achieved };
  }

  private mapObjective(row: any): LearningObjectiveEntity {
    return new LearningObjectiveEntity(
      row.id,
      row.familyId,
      row.learnerId,
      row.subjectId,
      row.academicYearId,
      row.title,
      row.description,
      row.status,
      row.targetDate,
      row.achievedAt,
      row.order,
      row.createdAt,
      row.updatedAt,
    );
  }
}
