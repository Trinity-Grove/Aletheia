import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface IssuedMfaLoginChallenge {
  token: string;
  expiresAt: Date;
}

export interface MfaLoginChallengeRecord {
  id: string;
  userId: string;
  expiresAt: Date;
}

const MFA_LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MFA_LOGIN_CHALLENGE_MAX_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class MfaLoginChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async issue(userId: string): Promise<IssuedMfaLoginChallenge> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MFA_LOGIN_CHALLENGE_TTL_MS);

    await this.prisma.mfaLoginChallenge.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });

    return { token, expiresAt };
  }

  async findByToken(token: string): Promise<MfaLoginChallengeRecord | null> {
    const record = await this.prisma.mfaLoginChallenge.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      expiresAt: record.expiresAt,
    };
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.mfaLoginChallenge.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  // Brute-force bound for the unauthenticated verify endpoint: increments
  // the per-challenge attempt counter, and once it reaches the cap, deletes
  // the challenge outright so the caller is forced back through login() for
  // a fresh one. The `attemptCount: { lt: MAX }` guard on updateMany (not a
  // plain `update`, which can only filter on unique fields) makes this
  // race-safe — Postgres serializes concurrent UPDATEs against the same
  // row, so two simultaneous failures can never both slip past the cap.
  async recordFailedAttempt(token: string): Promise<{ exhausted: boolean }> {
    const tokenHash = hashToken(token);
    const incremented = await this.prisma.mfaLoginChallenge.updateMany({
      where: { tokenHash, attemptCount: { lt: MFA_LOGIN_CHALLENGE_MAX_ATTEMPTS } },
      data: { attemptCount: { increment: 1 } },
    });

    if (incremented.count === 0) {
      // Either the challenge doesn't exist, or a prior request already
      // exhausted and deleted it — either way, there's nothing left to burn.
      return { exhausted: true };
    }

    const record = await this.prisma.mfaLoginChallenge.findUnique({ where: { tokenHash } });
    if (record && record.attemptCount >= MFA_LOGIN_CHALLENGE_MAX_ATTEMPTS) {
      await this.prisma.mfaLoginChallenge.delete({ where: { id: record.id } });
      return { exhausted: true };
    }

    return { exhausted: false };
  }
}
