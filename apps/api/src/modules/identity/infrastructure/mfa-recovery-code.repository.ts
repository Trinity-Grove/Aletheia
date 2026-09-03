import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { hashRecoveryCode } from '../../../platform/security/totp.js';

@Injectable()
export class MfaRecoveryCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Marks an unused recovery code as consumed. Returns true if a matching,
   * unused code was found and consumed; false otherwise (unknown or
   * already-used code), so the caller can fall back to rejecting the login
   * attempt without leaking which case applied.
   */
  async markUsed(userId: string, code: string): Promise<boolean> {
    const codeHash = hashRecoveryCode(code);
    const result = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }
}
