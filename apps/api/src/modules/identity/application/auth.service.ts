import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthResponseDto,
  LoginDto,
  RegisterGuardianDto,
  UserSummaryDto,
} from '@aletheia/contracts';
import { PasswordPolicy } from '../domain/password-policy.js';
import { PasswordHasher } from './password.hasher.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository.js';
import type { AuthenticatedUserPayload, IdentityPublicApi } from './public-api.js';

const ACCESS_TOKEN_TTL = '1h';

export interface AuthSession extends AuthResponseDto {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService implements IdentityPublicApi {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(dto: RegisterGuardianDto): Promise<AuthSession> {
    const policyResult = PasswordPolicy.validate(dto.password);
    if (!policyResult.valid) {
      throw new BadRequestException(policyResult.reason);
    }

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = this.passwordHasher.hash(dto.password);
    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
    });

    return this.issueSession(user.id, user.email, user.toDto());
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = this.passwordHasher.verify(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

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
    await this.refreshTokenRepository.revokeByToken(refreshToken);
  }

  async getProfile(userId: string): Promise<UserSummaryDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user.toDto();
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
}
