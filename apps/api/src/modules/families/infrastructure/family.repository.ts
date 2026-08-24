import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { FamilyEntity } from '../domain/family.entity.js';
import { FamilyMemberEntity } from '../domain/family-member.entity.js';
import type { FamilyRole } from '../domain/family-role.js';

@Injectable()
export class FamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    data: { name: string; countryCode: string; stateProvince?: string | null },
    ownerUserId: string,
  ): Promise<FamilyEntity> {
    const created = await this.prisma.family.create({
      data: {
        name: data.name.trim(),
        countryCode: data.countryCode.toUpperCase().trim(),
        stateProvince: data.stateProvince?.trim() ?? null,
        members: {
          create: {
            userId: ownerUserId,
            role: 'OWNER_GUARDIAN',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<FamilyEntity | null> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!family) return null;
    return this.mapToEntity(family);
  }

  async findByUserId(userId: string): Promise<FamilyEntity[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          include: { members: true },
        },
      },
    });

    return memberships.map((m) => this.mapToEntity(m.family));
  }

  async isMember(userId: string, familyId: string): Promise<boolean> {
    const member = await this.prisma.familyMember.findUnique({
      where: {
        family_members_family_user_unique: {
          familyId,
          userId,
        },
      },
    });
    return !!member;
  }

  private mapToEntity(raw: {
    id: string;
    name: string;
    countryCode: string;
    stateProvince: string | null;
    createdAt: Date;
    updatedAt: Date;
    members?: Array<{
      id: string;
      familyId: string;
      userId: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): FamilyEntity {
    const members = raw.members?.map(
      (m) =>
        new FamilyMemberEntity({
          id: m.id,
          familyId: m.familyId,
          userId: m.userId,
          role: m.role as FamilyRole,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }),
    );

    return new FamilyEntity({
      id: raw.id,
      name: raw.name,
      countryCode: raw.countryCode,
      stateProvince: raw.stateProvince,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      ...(members ? { members } : {}),
    });
  }
}
