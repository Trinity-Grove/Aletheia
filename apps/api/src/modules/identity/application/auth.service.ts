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
import type { AuthenticatedUserPayload, IdentityPublicApi } from './public-api.js';

@Injectable()
export class AuthService implements IdentityPublicApi {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterGuardianDto): Promise<AuthResponseDto> {
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

    const token = await this.generateToken(user.id, user.email);
    return {
      accessToken: token,
      user: user.toDto(),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = this.passwordHasher.verify(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = await this.generateToken(user.id, user.email);
    return {
      accessToken: token,
      user: user.toDto(),
    };
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

  private async generateToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email },
      { expiresIn: '7d' },
    );
  }
}
