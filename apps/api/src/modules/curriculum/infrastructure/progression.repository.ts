import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { ProgressionReader } from '../application/progression.service.js';
import { createPrismaProgressionReader } from './prisma-progression-reader.js';

@Injectable()
export class ProgressionRepository {
  constructor(private readonly prisma: PrismaService) {}

  snapshot<T>(evaluate: (reader: ProgressionReader) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => evaluate(createPrismaProgressionReader(tx)), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 15_000 });
  }
}
