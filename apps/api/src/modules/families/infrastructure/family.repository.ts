import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { FamilyEntity } from '../domain/family.entity.js';
import { FamilyMemberEntity } from '../domain/family-member.entity.js';
import type { FamilyRole } from '../domain/family-role.js';

// A family member is displayed by name in the UI (settings' "Responsáveis
// & Educadores" list) — without this, every member falls back to a generic
// "Membro" label since FamilyMemberDto.user is always undefined.
const MEMBER_USER_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      emailVerifiedAt: true,
      mfaEnabled: true,
      isPlatformAdmin: true,
      createdAt: true,
    },
  },
} as const;

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
        members: { include: MEMBER_USER_INCLUDE },
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<FamilyEntity | null> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: { members: { include: MEMBER_USER_INCLUDE } },
    });
    if (!family) return null;
    return this.mapToEntity(family);
  }

  async findByUserId(userId: string): Promise<FamilyEntity[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          include: { members: { include: MEMBER_USER_INCLUDE } },
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

  async findMemberRole(familyId: string, userId: string): Promise<FamilyRole | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { family_members_family_user_unique: { familyId, userId } },
      select: { role: true },
    });
    return (member?.role as FamilyRole) ?? null;
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
      user?: {
        id: string;
        email: string;
        fullName: string;
        emailVerifiedAt: Date | null;
        mfaEnabled: boolean;
        isPlatformAdmin: boolean;
        createdAt: Date;
      };
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
          ...(m.user
            ? {
                user: {
                  id: m.user.id,
                  email: m.user.email,
                  fullName: m.user.fullName,
                  emailVerified: m.user.emailVerifiedAt !== null,
                  mfaEnabled: m.user.mfaEnabled,
                  isPlatformAdmin: m.user.isPlatformAdmin,
                  createdAt: m.user.createdAt.toISOString(),
                },
              }
            : {}),
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
