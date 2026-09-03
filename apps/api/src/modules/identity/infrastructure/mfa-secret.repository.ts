import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface MfaSecretRecord {
  id: string;
  userId: string;
  encryptedSecret: string;
  createdAt: Date;
}

@Injectable()
export class MfaSecretRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<MfaSecretRecord | null> {
    return this.prisma.mfaSecret.findUnique({ where: { userId } });
  }

  /**
   * Promotes a confirmed setup challenge into permanent MFA state,
   * atomically: stores the secret, persists the recovery codes, flips the
   * user's mfaEnabled flag, and clears the now-consumed setup challenge.
   */
  async activateMfa(
    userId: string,
    encryptedSecret: string,
    recoveryCodeHashes: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaSecret.upsert({
        where: { userId },
        update: { encryptedSecret },
        create: { userId, encryptedSecret },
      }),
      this.prisma.mfaRecoveryCode.createMany({
        data: recoveryCodeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
      this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } }),
      this.prisma.mfaSetupChallenge.deleteMany({ where: { userId } }),
    ]);
  }

  /**
   * Removes all MFA state for a user, atomically.
   */
  async deactivateMfa(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaSecret.deleteMany({ where: { userId } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false } }),
    ]);
  }
}
