import { createHash, randomBytes, randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ENVIRONMENT, type Environment } from '../../../platform/config/environment.js';

export interface IssuedRegistrationChallenge {
  token: string;
  code: string;
  expiresAt: Date;
}

export interface RegistrationChallengeRecord {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
}

const REGISTRATION_CHALLENGE_TTL_MS = 15 * 60 * 1000;
const REGISTRATION_CHALLENGE_MAX_ATTEMPTS = 5;

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function generateSixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

@Injectable()
export class RegistrationVerificationChallengeRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  // Reissuing (register, resend, or logging in again before confirming)
  // always replaces any prior pending challenge for the user, so an old
  // emailed code stops working the moment a new one is sent.
  async issue(userId: string): Promise<IssuedRegistrationChallenge> {
    await this.prisma.registrationVerificationChallenge.deleteMany({ where: { userId } });

    const token = randomBytes(32).toString('hex');
    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + REGISTRATION_CHALLENGE_TTL_MS);

    await this.prisma.registrationVerificationChallenge.create({
      data: {
        userId,
        tokenHash: hashSecret(token),
        codeHash: hashSecret(code),
        // Never populated in production -- exists solely so non-production
        // E2E runs can retrieve a real pending code via the debug-only
        // GET /auth/register/debug-code endpoint.
        plainCodeForDebugOnly: this.environment.nodeEnv === 'production' ? null : code,
        expiresAt,
      },
    });

    return { token, code, expiresAt };
  }

  async findByToken(token: string): Promise<RegistrationChallengeRecord | null> {
    const record = await this.prisma.registrationVerificationChallenge.findUnique({
      where: { tokenHash: hashSecret(token) },
    });
    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      codeHash: record.codeHash,
      expiresAt: record.expiresAt,
    };
  }

  async findPlainCodeForDebugOnly(token: string): Promise<string | null> {
    if (this.environment.nodeEnv === 'production') return null;

    const record = await this.prisma.registrationVerificationChallenge.findUnique({
      where: { tokenHash: hashSecret(token) },
    });
    return record?.plainCodeForDebugOnly ?? null;
  }

  matchesCode(record: RegistrationChallengeRecord, code: string): boolean {
    return hashSecret(code) === record.codeHash;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.registrationVerificationChallenge.deleteMany({
      where: { tokenHash: hashSecret(token) },
    });
  }

  // Same race-safe attempt-capping shape as MfaLoginChallengeRepository:
  // updateMany's `attemptCount: { lt: MAX }` guard makes concurrent
  // failures serialize correctly at the database level.
  async recordFailedAttempt(token: string): Promise<{ exhausted: boolean }> {
    const tokenHash = hashSecret(token);
    const incremented = await this.prisma.registrationVerificationChallenge.updateMany({
      where: { tokenHash, attemptCount: { lt: REGISTRATION_CHALLENGE_MAX_ATTEMPTS } },
      data: { attemptCount: { increment: 1 } },
    });

    if (incremented.count === 0) {
      return { exhausted: true };
    }

    const record = await this.prisma.registrationVerificationChallenge.findUnique({ where: { tokenHash } });
    if (record && record.attemptCount >= REGISTRATION_CHALLENGE_MAX_ATTEMPTS) {
      await this.prisma.registrationVerificationChallenge.delete({ where: { id: record.id } });
      return { exhausted: true };
    }

    return { exhausted: false };
  }
}
