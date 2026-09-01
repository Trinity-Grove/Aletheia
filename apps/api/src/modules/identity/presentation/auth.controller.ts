import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import {
  loginSchema,
  registerGuardianSchema,
  verifyEmailSchema,
  type AuthResponseDto,
  type LoginDto,
  type RegisterGuardianDto,
  type UserSummaryDto,
  type VerifyEmailDto,
} from '@aletheia/contracts';
import { AuthService, type AuthSession } from '../application/auth.service.js';
import { JwtAuthGuard } from '../../../platform/auth/index.js';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  clearSessionCookie,
  setRefreshCookie,
  setSessionCookie,
} from '../../../platform/auth/session-cookie.js';
import { ENVIRONMENT, type Environment } from '../../../platform/config/environment.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

interface RequestWithCookies {
  cookies?: Record<string, string | undefined>;
}

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new guardian account' })
  @ApiResponse({ status: 201, description: 'Guardian successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input or weak password.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async register(
    @Body(new ZodValidationPipe(registerGuardianSchema)) body: RegisterGuardianDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.register(body);
    return this.commitSession(reply, session);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with guardian email and password' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.login(body);
    return this.commitSession(reply, session);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token cookie for a new access/refresh pair' })
  @ApiResponse({ status: 200, description: 'Session refreshed.' })
  @ApiResponse({ status: 401, description: 'Missing, invalid, or reused refresh token.' })
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    const session = await this.authService.refresh(refreshToken);
    return this.commitSession(reply, session);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the refresh token and clear session cookies' })
  @ApiResponse({ status: 200, description: 'Session cleared.' })
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ success: true }> {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    clearSessionCookie(reply);
    clearRefreshCookie(reply);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of authenticated guardian' })
  @ApiResponse({ status: 200, description: 'Current user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async me(@Req() req: { user: { userId: string } }): Promise<UserSummaryDto> {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an email address using the token from the verification link' })
  @ApiResponse({ status: 200, description: 'Email confirmed.' })
  @ApiResponse({ status: 400, description: 'Invalid, expired, or already-used token.' })
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailDto,
  ): Promise<{ success: true }> {
    await this.authService.verifyEmail(body.token);
    return { success: true };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend the email verification link to the authenticated guardian' })
  @ApiResponse({ status: 200, description: 'A new verification email was sent, if the account still needs one.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async resendVerification(@Req() req: { user: { userId: string } }): Promise<{ success: true }> {
    await this.authService.resendVerificationEmail(req.user.userId);
    return { success: true };
  }

  private commitSession(reply: FastifyReply, session: AuthSession): AuthResponseDto {
    setSessionCookie(reply, session.accessToken, this.environment);
    setRefreshCookie(reply, session.refreshToken, this.environment);
    return { accessToken: session.accessToken, user: session.user };
  }
}
