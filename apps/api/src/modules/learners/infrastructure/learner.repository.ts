import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { LearnerEntity } from '../domain/learner.entity.js';
import { EducationalStage } from '../domain/educational-stage.js';
import type { CreateLearnerDto, UpdateLearnerDto } from '@aletheia/contracts';

interface LearnerDbRecord {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string | null;
  preferredName: string | null;
  birthDate: Date;
  stage: EducationalStage;
  customGrade: string | null;
  avatarColor: string | null;
  specialNeeds: string | null;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LearnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateLearnerDto): Promise<LearnerEntity> {
    const created = await this.prisma.learner.create({
      data: {
        familyId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        preferredName: dto.preferredName?.trim() || null,
        birthDate: new Date(dto.birthDate),
        stage: dto.stage ?? 'PRIMARY_GRAMMAR',
        customGrade: dto.customGrade?.trim() || null,
        avatarColor: dto.avatarColor?.trim() || null,
        specialNeeds: dto.specialNeeds?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    return this.mapToEntity(created as LearnerDbRecord);
  }

  async findByFamilyId(familyId: string, includeArchived = false): Promise<LearnerEntity[]> {
    const records = await this.prisma.learner.findMany({
      where: {
        familyId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: {
        birthDate: 'asc',
      },
    });

    return records.map((record) => this.mapToEntity(record as LearnerDbRecord));
  }

  async findByIdAndFamilyId(familyId: string, id: string): Promise<LearnerEntity | null> {
    const record = await this.prisma.learner.findFirst({
      where: {
        id,
        familyId,
      },
    });

    if (!record) {
      return null;
    }

    return this.mapToEntity(record as LearnerDbRecord);
  }

  async update(
    familyId: string,
    id: string,
    data: Partial<UpdateLearnerDto> & { archivedAt?: Date | null },
  ): Promise<LearnerEntity | null> {
    const existing = await this.findByIdAndFamilyId(familyId, id);
    if (!existing) {
      return null;
    }

    const updated = await this.prisma.learner.update({
      where: {
        id,
      },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName.trim() } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName?.trim() || null } : {}),
        ...(data.preferredName !== undefined ? { preferredName: data.preferredName?.trim() || null } : {}),
        ...(data.birthDate !== undefined ? { birthDate: new Date(data.birthDate) } : {}),
        ...(data.stage !== undefined ? { stage: data.stage } : {}),
        ...(data.customGrade !== undefined ? { customGrade: data.customGrade?.trim() || null } : {}),
        ...(data.avatarColor !== undefined ? { avatarColor: data.avatarColor?.trim() || null } : {}),
        ...(data.specialNeeds !== undefined ? { specialNeeds: data.specialNeeds?.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        ...(data.archivedAt !== undefined ? { archivedAt: data.archivedAt } : {}),
      },
    });

    return this.mapToEntity(updated as LearnerDbRecord);
  }

  private mapToEntity(record: LearnerDbRecord): LearnerEntity {
    return new LearnerEntity({
      id: record.id,
      familyId: record.familyId,
      firstName: record.firstName,
      lastName: record.lastName,
      preferredName: record.preferredName,
      birthDate: record.birthDate,
      stage: record.stage,
      customGrade: record.customGrade,
      avatarColor: record.avatarColor,
      specialNeeds: record.specialNeeds,
      notes: record.notes,
      archivedAt: record.archivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
