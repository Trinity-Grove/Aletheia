import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccountAuditEventType,
  AccountAuditLogEntryDto,
  AuthResponseDto,
  LoginDto,
  RegisterGuardianDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { PasswordPolicy } from '../domain/password-policy.js';
import { PasswordHasher } from './password.hasher.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository.js';
import { EmailVerificationTokenRepository } from '../infrastructure/email-verification-token.repository.js';
import { PasswordResetTokenRepository } from '../infrastructure/password-reset-token.repository.js';
import { AccountAuditLogRepository } from '../infrastructure/account-audit-log.repository.js';
import { MAIL_SENDER, type MailSender } from '../../../platform/mail/mail-sender.js';
import { ENVIRONMENT, type Environment } from '../../../platform/config/environment.js';
import type { AuthenticatedUserPayload, IdentityPublicApi } from './public-api.js';

const ACCESS_TOKEN_TTL = '1h';

export interface AuthSession extends AuthResponseDto {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService implements IdentityPublicApi {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly accountAuditLogRepository: AccountAuditLogRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  async register(dto: RegisterGuardianDto): Promise<AuthSession> {
    const policyResult = PasswordPolicy.validate(dto.password);
    if (!policyResult.valid) {
      throw new BadRequestException(policyResult.reason);
    }

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      // Anti-enumeration: hash a throwaway value so this branch costs
      // roughly the same as the real create path below — otherwise a
      // caller can tell an email is taken just from how fast we reply.
      // The message deliberately doesn't confirm the account exists,
      // and the exception type matches the weak-password rejection
      // above rather than a distinctive 409.
      this.passwordHasher.hash(dto.password);
      throw new BadRequestException('Não foi possível concluir o cadastro com os dados fornecidos.');
    }

    const passwordHash = this.passwordHasher.hash(dto.password);
    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
    });

    await this.sendVerificationEmail(user.id, user.email, user.fullName);

    return this.issueSession(user.id, user.email, user.toDto());
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = this.passwordHasher.verify(dto.password, user.passwordHash);
    if (!isValid) {
      await this.recordAuditEvent(user.id, 'LOGIN_FAILED');
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.recordAuditEvent(user.id, 'LOGIN_SUCCEEDED');
    return this.issueSession(user.id, user.email, user.toDto());
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const record = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (record.revokedAt) {
      // This token was already rotated out. Someone presenting it again means
      // either the previous response was replayed or the token leaked —
      // either way, the whole session family is no longer trustworthy.
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      await this.recordAuditEvent(record.userId, 'REFRESH_TOKEN_REUSE_DETECTED');
      throw new UnauthorizedException('Refresh token has already been used.');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    await this.refreshTokenRepository.revokeByToken(refreshToken);

    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.issueSession(user.id, user.email, user.toDto());
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const record = await this.refreshTokenRepository.findByToken(refreshToken);
    await this.refreshTokenRepository.revokeByToken(refreshToken);
    if (record) {
      await this.recordAuditEvent(record.userId, 'LOGOUT');
    }
  }

  async getProfile(userId: string): Promise<UserSummaryDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user.toDto();
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.emailVerificationTokenRepository.findByToken(token);
    if (!record) {
      throw new BadRequestException('Invalid verification token.');
    }

    if (record.usedAt) {
      throw new BadRequestException('This verification link has already been used.');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This verification link has expired.');
    }

    await this.emailVerificationTokenRepository.markUsed(record.id);
    await this.userRepository.markEmailVerified(record.userId);
    await this.recordAuditEvent(record.userId, 'EMAIL_VERIFIED');
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.emailVerifiedAt) {
      // Doesn't reveal which case applied — an already-verified account and
      // a request from a defunct user look identical to the caller.
      return;
    }

    await this.sendVerificationEmail(user.id, user.email, user.fullName);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Doesn't reveal whether the account exists — the caller sees the
      // same outcome either way.
      return;
    }

    await this.recordAuditEvent(user.id, 'PASSWORD_RESET_REQUESTED');
    await this.sendPasswordResetEmail(user.id, user.email, user.fullName);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const policyResult = PasswordPolicy.validate(newPassword);
    if (!policyResult.valid) {
      throw new BadRequestException(policyResult.reason);
    }

    const record = await this.passwordResetTokenRepository.findByToken(token);
    if (!record) {
      throw new BadRequestException('Invalid reset token.');
    }

    if (record.usedAt) {
      throw new BadRequestException('This reset link has already been used.');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This reset link has expired.');
    }

    await this.passwordResetTokenRepository.markUsed(record.id);
    const passwordHash = this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(record.userId, passwordHash);

    // Resetting the password is a critical account event — every existing
    // session (and any leaked/stale refresh token) must stop working.
    await this.refreshTokenRepository.revokeAllForUser(record.userId);
    await this.recordAuditEvent(record.userId, 'PASSWORD_RESET_COMPLETED');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValid = this.passwordHasher.verify(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const policyResult = PasswordPolicy.validate(newPassword);
    if (!policyResult.valid) {
      throw new BadRequestException(policyResult.reason);
    }

    const passwordHash = this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(userId, passwordHash);

    // Same policy as resetPassword: a changed password invalidates every
    // other session.
    await this.refreshTokenRepository.revokeAllForUser(userId);
    await this.recordAuditEvent(userId, 'PASSWORD_CHANGED');
  }

  async changeEmail(userId: string, currentPassword: string, newEmail: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValid = this.passwordHasher.verify(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const normalizedEmail = newEmail.toLowerCase().trim();
    if (normalizedEmail === user.email) {
      throw new BadRequestException('This is already your current email address.');
    }

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    await this.userRepository.updateEmail(userId, normalizedEmail);
    // The account's login identity changed — every other session must
    // re-authenticate, same as a password change.
    await this.refreshTokenRepository.revokeAllForUser(userId);
    await this.recordAuditEvent(userId, 'EMAIL_CHANGED');
    await this.sendVerificationEmail(userId, normalizedEmail, user.fullName);
  }

  async getAuditLog(userId: string): Promise<AccountAuditLogEntryDto[]> {
    const entries = await this.accountAuditLogRepository.listForUser(userId);
    return entries.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async verifyToken(token: string): Promise<AuthenticatedUserPayload | null> {
    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
      return {
        userId: decoded.sub,
        email: decoded.email,
      };
    } catch {
      return null;
    }
  }

  async findUserById(userId: string): Promise<UserSummaryDto | null> {
    const user = await this.userRepository.findById(userId);
    return user ? user.toDto() : null;
  }

  private async issueSession(
    userId: string,
    email: string,
    user: UserSummaryDto,
  ): Promise<AuthSession> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, email }, { expiresIn: ACCESS_TOKEN_TTL }),
      this.refreshTokenRepository.issue(userId),
    ]);

    return {
      accessToken,
      user,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }

  private async recordAuditEvent(userId: string, eventType: AccountAuditEventType): Promise<void> {
    try {
      await this.accountAuditLogRepository.record(userId, eventType);
    } catch (error) {
      // Same reasoning as the mail helpers below: a broken audit log must
      // never block the actual auth flow it's trying to record.
      this.logger.error(`Failed to record audit event ${eventType} for user ${userId}`, error as Error);
    }
  }

  private async sendVerificationEmail(userId: string, email: string, fullName: string): Promise<void> {
    const { token } = await this.emailVerificationTokenRepository.issue(userId);
    const verificationLink = `${this.environment.webOrigin}/verify-email?token=${token}`;

    try {
      await this.mailSender.send({
        to: email,
        subject: 'Confirme seu e-mail no Aletheia',
        text: `Olá, ${fullName}! Confirme seu e-mail acessando: ${verificationLink}\n\nEste link expira em 24 horas.`,
        html:
          `<p>Olá, ${fullName}!</p>` +
          `<p>Confirme seu e-mail clicando no link abaixo:</p>` +
          `<p><a href="${verificationLink}">${verificationLink}</a></p>` +
          `<p>Este link expira em 24 horas.</p>`,
      });
    } catch (error) {
      // A failed send must never block registration/login — the account is
      // fully usable unverified, and the user can request a new link later.
      this.logger.error(`Failed to send verification email to ${email}`, error as Error);
    }
  }

  private async sendPasswordResetEmail(userId: string, email: string, fullName: string): Promise<void> {
    const { token } = await this.passwordResetTokenRepository.issue(userId);
    const resetLink = `${this.environment.webOrigin}/reset-password?token=${token}`;

    try {
      await this.mailSender.send({
        to: email,
        subject: 'Redefina sua senha no Aletheia',
        text:
          `Olá, ${fullName}! Recebemos um pedido para redefinir sua senha. ` +
          `Acesse: ${resetLink}\n\nEste link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.`,
        html:
          `<p>Olá, ${fullName}!</p>` +
          `<p>Recebemos um pedido para redefinir sua senha. Clique no link abaixo para continuar:</p>` +
          `<p><a href="${resetLink}">${resetLink}</a></p>` +
          `<p>Este link expira em 1 hora. Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>`,
      });
    } catch (error) {
      // Same reasoning as sendVerificationEmail: a failed send must never
      // surface to the caller, which would leak whether the account exists.
      this.logger.error(`Failed to send password reset email to ${email}`, error as Error);
    }
  }
}
