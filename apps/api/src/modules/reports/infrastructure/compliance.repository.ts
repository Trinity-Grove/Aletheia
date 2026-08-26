import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ComplianceRequirementEntity } from '../domain/compliance-requirement.entity.js';
import type { UpsertComplianceRequirementDto } from '@aletheia/contracts';

@Injectable()
export class ComplianceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRequirement(
    familyId: string,
    dto: UpsertComplianceRequirementDto,
  ): Promise<ComplianceRequirementEntity> {
    const learnerId = dto.learnerId ?? null;

    // First try to find existing to update, or create if not exists
    const existing = await this.prisma.complianceRequirement.findFirst({
      where: {
        familyId,
        academicYearId: dto.academicYearId,
        learnerId,
      },
    });

    let result;
    if (existing) {
      result = await this.prisma.complianceRequirement.update({
        where: { id: existing.id },
        data: {
          jurisdiction: dto.jurisdiction !== undefined ? (dto.jurisdiction ?? null) : existing.jurisdiction,
          minInstructionalDays:
            dto.minInstructionalDays !== undefined
              ? (dto.minInstructionalDays ?? null)
              : existing.minInstructionalDays,
          minInstructionalHours:
            dto.minInstructionalHours !== undefined
              ? (dto.minInstructionalHours ?? null)
              : existing.minInstructionalHours,
          notes: dto.notes !== undefined ? (dto.notes ?? null) : existing.notes,
        },
        include: {
          academicYear: true,
          learner: true,
        },
      });
    } else {
      result = await this.prisma.complianceRequirement.create({
        data: {
          familyId,
          academicYearId: dto.academicYearId,
          learnerId,
          jurisdiction: dto.jurisdiction ?? null,
          minInstructionalDays: dto.minInstructionalDays ?? null,
          minInstructionalHours: dto.minInstructionalHours ?? null,
          notes: dto.notes ?? null,
        },
        include: {
          academicYear: true,
          learner: true,
        },
      });
    }

    return this.mapRequirement(result);
  }

  async findRequirement(
    familyId: string,
    academicYearId: string,
    learnerId?: string | null,
  ): Promise<ComplianceRequirementEntity | null> {
    if (learnerId) {
      // First check learner-specific requirement
      const specific = await this.prisma.complianceRequirement.findFirst({
        where: {
          familyId,
          academicYearId,
          learnerId,
        },
        include: {
          academicYear: true,
          learner: true,
        },
      });
      if (specific) return this.mapRequirement(specific);
    }

    // Fall back to family/year default requirement (learnerId = null)
    const defaultReq = await this.prisma.complianceRequirement.findFirst({
      where: {
        familyId,
        academicYearId,
        learnerId: null,
      },
      include: {
        academicYear: true,
        learner: true,
      },
    });

    return defaultReq ? this.mapRequirement(defaultReq) : null;
  }

  async list(familyId: string, academicYearId?: string): Promise<ComplianceRequirementEntity[]> {
    const where: Record<string, unknown> = { familyId };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const rows = await this.prisma.complianceRequirement.findMany({
      where,
      include: {
        academicYear: true,
        learner: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    return rows.map((r: any) => this.mapRequirement(r));
  }

  async delete(familyId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.complianceRequirement.findFirst({
      where: { id, familyId },
    });
    if (!existing) return false;

    await this.prisma.complianceRequirement.delete({ where: { id } });
    return true;
  }

  private mapRequirement(row: any): ComplianceRequirementEntity {
    const learnerName = row.learner
      ? row.learner.preferredName ||
        `${row.learner.firstName}${row.learner.lastName ? ' ' + row.learner.lastName : ''}`
      : undefined;

    const academicYearTitle = row.academicYear ? row.academicYear.title : undefined;

    return new ComplianceRequirementEntity(
      row.id,
      row.familyId,
      row.academicYearId,
      row.learnerId ?? null,
      row.jurisdiction ?? null,
      row.minInstructionalDays ?? null,
      row.minInstructionalHours ?? null,
      row.notes ?? null,
      row.createdAt,
      row.updatedAt,
      academicYearTitle,
      learnerName,
    );
  }
}
