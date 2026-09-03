import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { FamilyInvitationEntity } from '../domain/invitation.entity.js';
import type { FamilyRole } from '../domain/family-role.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    familyId: string;
    email: string;
    role: FamilyRole;
    token: string;
    invitedBy: string;
    expiresAt: Date;
  }): Promise<FamilyInvitationEntity> {
    const created = await this.prisma.familyInvitation.create({
      data: {
        familyId: data.familyId,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        tokenHash: hashToken(data.token),
        invitedBy: data.invitedBy,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToEntity(created);
  }

  async findByToken(token: string): Promise<FamilyInvitationEntity | null> {
    const inv = await this.prisma.familyInvitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!inv) return null;
    return this.mapToEntity(inv);
  }

  async findById(id: string): Promise<FamilyInvitationEntity | null> {
    const inv = await this.prisma.familyInvitation.findUnique({
      where: { id },
    });
    if (!inv) return null;
    return this.mapToEntity(inv);
  }

  async findByFamilyId(familyId: string): Promise<FamilyInvitationEntity[]> {
    const list = await this.prisma.familyInvitation.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((i) => this.mapToEntity(i));
  }

  async accept(
    invitationId: string,
    userId: string,
    familyId: string,
    role: FamilyRole,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.familyInvitation.update({
        where: { id: invitationId },
        data: { acceptedAt: new Date() },
      }),
      this.prisma.familyMember.upsert({
        where: {
          family_members_family_user_unique: {
            familyId,
            userId,
          },
        },
        create: {
          familyId,
          userId,
          role,
        },
        update: {
          role,
        },
      }),
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyInvitation.delete({
      where: { id },
    });
  }

  private mapToEntity(raw: {
    id: string;
    familyId: string;
    email: string;
    role: string;
    invitedBy: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
  }): FamilyInvitationEntity {
    return new FamilyInvitationEntity({
      id: raw.id,
      familyId: raw.familyId,
      email: raw.email,
      role: raw.role as FamilyRole,
      invitedBy: raw.invitedBy,
      expiresAt: raw.expiresAt,
      acceptedAt: raw.acceptedAt,
      createdAt: raw.createdAt,
    });
  }
}
