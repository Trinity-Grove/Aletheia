import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ScheduleSlotEntity } from '../domain/schedule-slot.entity.js';
import type {
  CreateScheduleSlotDto,
  DayOfWeek,
  UpdateScheduleSlotDto,
} from '@aletheia/contracts';

export interface ScheduleSlotFilter {
  dayOfWeek?: DayOfWeek | undefined;
  learnerId?: string | undefined;
  subjectId?: string | undefined;
  academicYearId?: string | undefined;
}

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateScheduleSlotDto): Promise<ScheduleSlotEntity> {
    const row = await this.prisma.weeklyScheduleSlot.create({
      data: {
        familyId,
        academicYearId: dto.academicYearId ?? null,
        subjectId: dto.subjectId ?? null,
        learnerId: dto.learnerId ?? null,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        title: dto.title,
        description: dto.description ?? null,
        location: dto.location ?? null,
        color: dto.color ?? null,
      },
      include: {
        subject: true,
        learner: true,
      },
    });

    return this.mapSlot(row);
  }

  async findById(familyId: string, id: string): Promise<ScheduleSlotEntity | null> {
    const row = await this.prisma.weeklyScheduleSlot.findFirst({
      where: { id, familyId },
      include: {
        subject: true,
        learner: true,
      },
    });

    return row ? this.mapSlot(row) : null;
  }

  async list(familyId: string, filter: ScheduleSlotFilter = {}): Promise<ScheduleSlotEntity[]> {
    const where: Record<string, unknown> = { familyId };

    if (filter.dayOfWeek !== undefined) {
      where.dayOfWeek = filter.dayOfWeek;
    }
    if (filter.learnerId !== undefined) {
      where.learnerId = filter.learnerId;
    }
    if (filter.subjectId !== undefined) {
      where.subjectId = filter.subjectId;
    }
    if (filter.academicYearId !== undefined) {
      where.academicYearId = filter.academicYearId;
    }

    const rows = await this.prisma.weeklyScheduleSlot.findMany({
      where,
      include: {
        subject: true,
        learner: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map((r: any) => this.mapSlot(r));
  }

  async update(familyId: string, id: string, dto: UpdateScheduleSlotDto): Promise<ScheduleSlotEntity | null> {
    const existing = await this.findById(familyId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.dayOfWeek !== undefined) data.dayOfWeek = dto.dayOfWeek;
    if (dto.startTime !== undefined) data.startTime = dto.startTime;
    if (dto.endTime !== undefined) data.endTime = dto.endTime;
    if (dto.academicYearId !== undefined) data.academicYearId = dto.academicYearId ?? null;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId ?? null;
    if (dto.learnerId !== undefined) data.learnerId = dto.learnerId ?? null;
    if (dto.location !== undefined) data.location = dto.location ?? null;
    if (dto.color !== undefined) data.color = dto.color ?? null;

    const row = await this.prisma.weeklyScheduleSlot.update({
      where: { id },
      data,
      include: {
        subject: true,
        learner: true,
      },
    });

    return this.mapSlot(row);
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.findById(familyId, id);
    if (!existing) return false;

    await this.prisma.weeklyScheduleSlot.delete({ where: { id } });
    return true;
  }

  private mapSlot(row: any): ScheduleSlotEntity {
    const learnerName = row.learner
      ? row.learner.preferredName || (row.learner.firstName + (row.learner.lastName ? ' ' + row.learner.lastName : ''))
      : null;

    return new ScheduleSlotEntity(
      row.id,
      row.familyId,
      row.academicYearId ?? null,
      row.subjectId ?? null,
      row.learnerId ?? null,
      row.dayOfWeek as DayOfWeek,
      row.startTime,
      row.endTime,
      row.title,
      row.description ?? null,
      row.location ?? null,
      row.color ?? null,
      row.createdAt,
      row.updatedAt,
      row.subject?.name ?? null,
      learnerName,
    );
  }
}
