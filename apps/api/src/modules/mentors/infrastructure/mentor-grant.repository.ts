import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { MentorGrant } from '@prisma/client';
import type { MentorGrantStatus } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { MentorGrantEntity } from '../domain/mentor-grant.entity.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Simple, family/learner-tenant-scoped Prisma reads directly against the
// shared PrismaService -- same reasoning as EvidenceSubmissionRepository's
// findLearnerFamilyId: no need to reach into the learners module for a
// one-line lookup.
@Injectable()
export class MentorGrantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLearnerFamilyId(learnerId: string): Promise<string | null> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: { familyId: true },
    });
    return learner?.familyId ?? null;
  }

  async create(data: {
    familyId: string;
    learnerId: string;
    email: string;
    role: string;
    token: string;
    invitedBy: string;
    expiresAt: Date;
  }): Promise<MentorGrantEntity> {
    const created = await this.prisma.mentorGrant.create({
      data: {
        familyId: data.familyId,
        learnerId: data.learnerId,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        tokenHash: hashToken(data.token),
        invitedBy: data.invitedBy,
        expiresAt: data.expiresAt,
      },
    });
    return this.mapToEntity(created);
  }

  async findByToken(token: string): Promise<MentorGrantEntity | null> {
    const grant = await this.prisma.mentorGrant.findUnique({ where: { tokenHash: hashToken(token) } });
    return grant ? this.mapToEntity(grant) : null;
  }

  async findById(id: string): Promise<MentorGrantEntity | null> {
    const grant = await this.prisma.mentorGrant.findUnique({ where: { id } });
    return grant ? this.mapToEntity(grant) : null;
  }

  async listForLearner(familyId: string, learnerId: string): Promise<MentorGrantEntity[]> {
    const rows = await this.prisma.mentorGrant.findMany({
      where: { familyId, learnerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapToEntity(r));
  }

  async accept(id: string, mentorUserId: string): Promise<MentorGrantEntity> {
    const updated = await this.prisma.mentorGrant.update({
      where: { id },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), mentorUserId },
    });
    return this.mapToEntity(updated);
  }

  async revoke(id: string): Promise<MentorGrantEntity> {
    const updated = await this.prisma.mentorGrant.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    return this.mapToEntity(updated);
  }

  private mapToEntity(row: MentorGrant): MentorGrantEntity {
    return new MentorGrantEntity({
      id: row.id,
      familyId: row.familyId,
      learnerId: row.learnerId,
      email: row.email,
      role: row.role,
      status: row.status as MentorGrantStatus,
      mentorUserId: row.mentorUserId,
      invitedBy: row.invitedBy,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }
}
