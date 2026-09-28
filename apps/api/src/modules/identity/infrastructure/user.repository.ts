import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { UserEntity } from '../domain/user.entity.js';

function toEntity(user: User): UserEntity {
  return new UserEntity({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    fullName: user.fullName,
    emailVerifiedAt: user.emailVerifiedAt,
    emailVerificationRequired: user.emailVerificationRequired,
    mfaEnabled: user.mfaEnabled,
    isPlatformAdmin: user.isPlatformAdmin,
    disabledAt: user.disabledAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? toEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? toEntity(user) : null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    termsOfUseDefinitionId: string;
    termsOfUseAcceptedAt: Date;
    privacyPolicyDefinitionId: string;
    privacyPolicyAcceptedAt: Date;
    // New registrations always require code confirmation before login()
    // issues a session; defaults to false so every other caller (there
    // are none today, but future ones) keeps today's behavior.
    emailVerificationRequired?: boolean;
  }): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        termsOfUseDefinitionId: data.termsOfUseDefinitionId,
        termsOfUseAcceptedAt: data.termsOfUseAcceptedAt,
        privacyPolicyDefinitionId: data.privacyPolicyDefinitionId,
        privacyPolicyAcceptedAt: data.privacyPolicyAcceptedAt,
        emailVerificationRequired: data.emailVerificationRequired ?? false,
      },
    });
    return toEntity(created);
  }

  // Also permanently clears emailVerificationRequired: its only job is to
  // gate the FIRST successful verification (blocking login() until then).
  // A later changeEmail() legitimately resets emailVerifiedAt to null
  // again, and that must never re-trigger the hard block -- once an
  // account has proven its email once, every future re-verification
  // (link-based, via changeEmail) stays the original non-blocking flow.
  async markEmailVerified(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date(), emailVerificationRequired: false },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateEmail(id: string, email: string): Promise<void> {
    // A changed email is unverified until the owner proves they control the
    // new address — never carry over the old verification.
    await this.prisma.user.update({
      where: { id },
      data: { email, emailVerifiedAt: null },
    });
  }

  // Platform-admin bootstrap (issue #101): only ever promotes, never
  // demotes. Called by AuthService when a user's email matches
  // PLATFORM_ADMIN_EMAILS and they aren't already flagged.
  async grantPlatformAdmin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isPlatformAdmin: true },
    });
  }

  // Manual counterpart to grantPlatformAdmin -- unlike the automatic
  // bootstrap above, this IS a real demote, only ever triggered by
  // another admin through the backoffice user-management screen.
  async revokePlatformAdmin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isPlatformAdmin: false },
    });
  }

  async updateFullName(id: string, fullName: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { fullName: fullName.trim() },
    });
  }

  // Mirrors LearnerService's archive/reactivate: null = active, a
  // timestamp = disabled since. Only ever called from the admin
  // user-management flow (AuthService.disableUser/reactivateUser).
  async setDisabled(id: string, disabledAt: Date | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { disabledAt },
    });
  }

  async findAll(params: { skip: number; take: number; search?: string | undefined }): Promise<{
    users: UserEntity[];
    totalCount: number;
  }> {
    const where = params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' as const } },
            { fullName: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: rows.map(toEntity), totalCount };
  }
}
