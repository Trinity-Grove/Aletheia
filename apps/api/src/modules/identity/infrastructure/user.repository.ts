import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { UserEntity } from '../domain/user.entity.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) return null;
    return new UserEntity({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return new UserEntity({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async create(data: { email: string; passwordHash: string; fullName: string }): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
      },
    });
    return new UserEntity({
      id: created.id,
      email: created.email,
      passwordHash: created.passwordHash,
      fullName: created.fullName,
      emailVerifiedAt: created.emailVerifiedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
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
}
