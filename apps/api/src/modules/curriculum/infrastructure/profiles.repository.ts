import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, PedagogicalProfile, TheologicalProfile } from '@prisma/client';
import type { UpsertPedagogicalProfileOutput, UpsertTheologicalProfileOutput } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Append-only reads/writes for the per-family profile tables (issue #96
// Fase 1, sections 13/14). "Upserting" always INSERTs a new row with the
// next version for that family -- never UPDATEs in place -- so history is
// never destroyed. "Current" is just the highest-version row.
@Injectable()
export class ProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestPedagogicalProfile(familyId: string): Promise<PedagogicalProfile | null> {
    return this.prisma.pedagogicalProfile.findFirst({
      where: { familyId },
      orderBy: { version: 'desc' },
    });
  }

  async createPedagogicalProfileVersion(
    familyId: string,
    dto: UpsertPedagogicalProfileOutput,
    actorId: string,
  ): Promise<PedagogicalProfile> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockFamily(tx, familyId);
      await this.validatePedagogicalReferences(tx, dto);
      const latest = await tx.pedagogicalProfile.findFirst({ where: { familyId }, orderBy: { version: 'desc' } });
      return tx.pedagogicalProfile.create({
        data: {
          familyId, version: (latest?.version ?? 0) + 1, createdByUserId: actorId,
          primaryModelCode: dto.primaryModelCode,
          secondaryModels: dto.secondaryModels as unknown as Prisma.InputJsonValue,
          overrides: dto.overrides as Prisma.InputJsonValue,
        },
      });
    });
  }

  async listPedagogicalProfileHistory(familyId: string): Promise<PedagogicalProfile[]> {
    return this.prisma.pedagogicalProfile.findMany({
      where: { familyId },
      orderBy: { version: 'desc' },
    });
  }

  async findLatestTheologicalProfile(familyId: string): Promise<TheologicalProfile | null> {
    return this.prisma.theologicalProfile.findFirst({
      where: { familyId },
      orderBy: { version: 'desc' },
    });
  }

  async createTheologicalProfileVersion(
    familyId: string,
    dto: UpsertTheologicalProfileOutput,
    actorId: string,
  ): Promise<TheologicalProfile> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockFamily(tx, familyId);
      await this.validateTheologicalReferences(tx, dto);
      const latest = await tx.theologicalProfile.findFirst({ where: { familyId }, orderBy: { version: 'desc' } });
      return tx.theologicalProfile.create({
        data: {
          familyId, version: (latest?.version ?? 0) + 1, createdByUserId: actorId,
          preferredTraditionCode: dto.preferredTraditionCode ?? null,
          topicOverrides: dto.topicOverrides as Prisma.InputJsonValue,
        },
      });
    });
  }

  async listTheologicalProfileHistory(familyId: string): Promise<TheologicalProfile[]> {
    return this.prisma.theologicalProfile.findMany({
      where: { familyId },
      orderBy: { version: 'desc' },
    });
  }

  private async lockFamily(tx: Prisma.TransactionClient, familyId: string): Promise<void> {
    // Lock the parent even for the first version. PostgreSQL serializes writers
    // across processes; ReadCommitted queries below then see the preceding commit.
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM families WHERE id = ${familyId}::uuid FOR UPDATE`;
    if (!rows.length) throw new NotFoundException('Family not found');
  }

  private async validatePedagogicalReferences(db: Prisma.TransactionClient, dto: UpsertPedagogicalProfileOutput): Promise<void> {
    const codes = [dto.primaryModelCode, ...dto.secondaryModels.map((model) => model.code)];
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException('Each pedagogical model may appear only once');
    }
    const published = await db.pedagogicalModelDefinition.findMany({
      where: { code: { in: codes }, status: 'PUBLISHED' }, select: { code: true },
    });
    const available = new Set(published.map((model) => model.code));
    if (codes.some((code) => !available.has(code))) {
      throw new BadRequestException('Every pedagogical model must reference a published definition');
    }
  }

  private async validateTheologicalReferences(db: Prisma.TransactionClient, dto: UpsertTheologicalProfileOutput): Promise<void> {
    if (dto.preferredTraditionCode) {
      const tradition = await db.theologicalTraditionDefinition.findFirst({
        where: { code: dto.preferredTraditionCode, status: 'PUBLISHED' }, select: { id: true },
      });
      if (!tradition) throw new BadRequestException('Preferred tradition must reference a published definition');
    }
    const entries = Object.entries(dto.topicOverrides);
    if (!entries.length) return;
    const positions = await db.theologicalPositionDefinition.findMany({
      where: { code: { in: entries.map(([, code]) => code) }, status: 'PUBLISHED' },
      select: { code: true, topic: true, version: true }, orderBy: { version: 'desc' },
    });
    for (const [topic, code] of entries) {
      const position = positions.find((candidate) => candidate.code === code);
      if (!position || position.topic !== topic) {
        throw new BadRequestException('Each topic override must reference a published position for that topic');
      }
    }
  }
}
