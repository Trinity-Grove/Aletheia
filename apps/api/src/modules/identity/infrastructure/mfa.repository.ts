import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { hashRecoveryCode } from '../../../platform/security/totp.js';

const LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface MfaSecretRecord {
  id: string;
  userId: string;
  encryptedSecret: string;
  createdAt: Date;
}

export interface LoginChallengeRecord {
  id: string;
  userId: string;
  tokenHash: string;
  attemptCount: number;
  expiresAt: Date;
}

export interface IssuedLoginChallenge {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class MfaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSecretForUser(userId: string): Promise<MfaSecretRecord | null> {
    const secret = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!secret) return null;
    return {
      id: secret.id,
      userId: secret.userId,
      encryptedSecret: secret.encryptedSecret,
      createdAt: secret.createdAt,
    };
  }

  async findSetupChallenge(userId: string): Promise<{
    id: string;
    encryptedSecret: string;
    recoveryCodeHashes: string[];
    expiresAt: Date;
  } | null> {
    const challenge = await this.prisma.mfaSetupChallenge.findUnique({ where: { userId } });
    if (!challenge) return null;
    return {
      id: challenge.id,
      encryptedSecret: challenge.encryptedSecret,
      recoveryCodeHashes: challenge.recoveryCodeHashes,
      expiresAt: challenge.expiresAt,
    };
  }

  async upsertSetupChallenge(data: {
    userId: string;
    encryptedSecret: string;
    recoveryCodeHashes: string[];
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.mfaSetupChallenge.upsert({
      where: { userId: data.userId },
      create: { ...data },
      update: {
        encryptedSecret: data.encryptedSecret,
        recoveryCodeHashes: data.recoveryCodeHashes,
        expiresAt: data.expiresAt,
      },
    });
  }

  async issueLoginChallenge(userId: string): Promise<IssuedLoginChallenge> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + LOGIN_CHALLENGE_TTL_MS);

    await this.prisma.mfaLoginChallenge.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });

    return { token, expiresAt };
  }

  async findLoginChallengeByToken(token: string): Promise<LoginChallengeRecord | null> {
    const record = await this.prisma.mfaLoginChallenge.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      attemptCount: record.attemptCount,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Atomically increment the attempt counter, capped at MAX_LOGIN_ATTEMPTS.
   * Returns true if the challenge is exhausted (and was deleted) — the
   * caller must reject the attempt. The conditional UPDATE prevents two
   * concurrent requests from both observing attemptCount < cap and each
   * slipping through.
   */
  async registerFailedLoginAttempt(challengeId: string): Promise<boolean> {
    const result = await this.prisma.$executeRawUnsafe(
      `UPDATE "mfa_login_challenges"
       SET "attempt_count" = "attempt_count" + 1
       WHERE "id" = CAST($1 AS uuid) AND "attempt_count" < $2`,
      challengeId,
      MAX_LOGIN_ATTEMPTS,
    );

    // No row updated means the challenge was already at (or past) the cap —
    // burn it.
    if (result === 0) {
      await this.prisma.mfaLoginChallenge.deleteMany({ where: { id: challengeId } });
      return true;
    }

    // The cap is reached when the counter lands exactly on MAX (5). Any
    // count below that leaves the challenge usable. We can't read the new
    // count from $executeRawUnsafe, so recompute the exhaustion decision
    // by re-reading — cheap and correct under the row lock serialization of
    // the UPDATE above.
    const updated = await this.prisma.mfaLoginChallenge.findUnique({
      where: { id: challengeId },
      select: { attemptCount: true },
    });

    if (!updated) {
      return true;
    }

    if (updated.attemptCount >= MAX_LOGIN_ATTEMPTS) {
      await this.prisma.mfaLoginChallenge.deleteMany({ where: { id: challengeId } });
      return true;
    }

    return false;
  }

  async deleteLoginChallenge(challengeId: string): Promise<void> {
    await this.prisma.mfaLoginChallenge.deleteMany({ where: { id: challengeId } });
  }

  async markRecoveryCodeUsed(userId: string, code: string): Promise<boolean> {
    const codeHash = hashRecoveryCode(code);
    const result = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * Promotes a confirmed setup challenge into permanent state, atomically.
   */
  async confirmSetup(data: {
    userId: string;
    encryptedSecret: string;
    recoveryCodeHashes: string[];
    challengeId: string;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaSecret.create({
        data: { userId: data.userId, encryptedSecret: data.encryptedSecret },
      }),
      this.prisma.mfaRecoveryCode.createMany({
        data: data.recoveryCodeHashes.map((codeHash) => ({
          userId: data.userId,
          codeHash,
        })),
      }),
      this.prisma.user.update({
        where: { id: data.userId },
        data: { mfaEnabled: true },
      }),
      this.prisma.mfaSetupChallenge.deleteMany({ where: { id: data.challengeId } }),
    ]);
  }

  /**
   * Removes all MFA state for a user, atomically.
   */
  async disable(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.mfaSecret.deleteMany({ where: { userId } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      }),
    ]);
  }
}