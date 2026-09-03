import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface MfaSetupChallengeRecord {
  id: string;
  userId: string;
  encryptedSecret: string;
  recoveryCodeHashes: string[];
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class MfaSetupChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    encryptedSecret: string,
    recoveryCodeHashes: string[],
    expiresAt: Date,
  ): Promise<MfaSetupChallengeRecord> {
    return this.prisma.mfaSetupChallenge.upsert({
      where: { userId },
      update: { encryptedSecret, recoveryCodeHashes, expiresAt },
      create: { userId, encryptedSecret, recoveryCodeHashes, expiresAt },
    });
  }

  async findByUserId(userId: string): Promise<MfaSetupChallengeRecord | null> {
    return this.prisma.mfaSetupChallenge.findUnique({ where: { userId } });
  }
}
