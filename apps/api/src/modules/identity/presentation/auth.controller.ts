import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import {
  changeEmailSchema,
  changePasswordSchema,
  confirmRegistrationCodeSchema,
  forgotPasswordSchema,
  loginSchema,
  mfaConfirmSchema,
  mfaDisableSchema,
  mfaSetupRequestSchema,
  mfaVerifySchema,
  registerGuardianSchema,
  resendRegistrationCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type AccountAuditLogEntryDto,
  type AuthResponseDto,
  type ChangeEmailDto,
  type ChangePasswordDto,
  type ConfirmRegistrationCodeDto,
  type ForgotPasswordDto,
  type LoginDto,
  type LoginResultDto,
  type MfaConfirmDto,
  type MfaDisableDto,
  type MfaSetupRequestDto,
  type MfaSetupResponseDto,
  type MfaVerifyDto,
  type RegisterGuardianDto,
  type RegisterResultDto,
  type ResendRegistrationCodeDto,
  type ResetPasswordDto,
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new guardian account; a 6-digit email code must be confirmed before use' })
  @ApiResponse({ status: 201, description: 'Guardian created; a confirmation code was emailed.' })
  @ApiResponse({ status: 400, description: 'Invalid input, weak password, or email unavailable.' })
  async register(
    @Body(new ZodValidationPipe(registerGuardianSchema)) body: RegisterGuardianDto,
  ): Promise<RegisterResultDto> {
    // No session/cookie here — the account is unusable until
    // POST /auth/register/confirm succeeds.
    return this.authService.register(body);
  }

  @Post('register/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm registration with the 6-digit code emailed at signup' })
  @ApiResponse({ status: 200, description: 'Email confirmed; a full session is issued.' })
  @ApiResponse({ status: 400, description: 'Invalid code, or challenge exhausted.' })
  @ApiResponse({ status: 404, description: 'Invalid or expired registration challenge.' })
  async confirmRegistration(
    @Body(new ZodValidationPipe(confirmRegistrationCodeSchema)) body: ConfirmRegistrationCodeDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.confirmRegistrationCode(body);
    return this.commitSession(reply, session);
  }

  @Post('register/resend-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Resend the registration confirmation code, invalidating the previous one' })
  @ApiResponse({ status: 200, description: 'A new code was emailed; use the new challengeToken from now on.' })
  @ApiResponse({ status: 404, description: 'Invalid or expired registration challenge.' })
  async resendRegistrationCode(
    @Body(new ZodValidationPipe(resendRegistrationCodeSchema)) body: ResendRegistrationCodeDto,
  ): Promise<RegisterResultDto> {
    return this.authService.resendRegistrationCode(body.challengeToken);
  }

  @Get('register/debug-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Non-production only: read a pending registration code for E2E tests' })
  @ApiResponse({ status: 200, description: 'The pending code, if the challenge is still valid.' })
  @ApiResponse({ status: 404, description: 'Not available in production, or challenge not found.' })
  async debugRegistrationCode(
    @Query('challengeToken') challengeToken: string,
  ): Promise<{ code: string }> {
    if (this.environment.nodeEnv === 'production') {
      throw new NotFoundException();
    }

    const code = await this.authService.findPendingRegistrationCodeForDebugOnly(challengeToken);
    if (!code) {
      throw new NotFoundException('No pending challenge for this token.');
    }
    return { code };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with guardian email and password' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LoginResultDto> {
    const result = await this.authService.login(body);

    // A user with MFA enabled, or an account still pending email
    // confirmation, gets a challenge instead of a session — keep the
    // response free of any cookie until the second step succeeds.
    if ('mfaRequired' in result) {
      return { mfaRequired: true, challengeToken: result.challengeToken };
    }
    if ('emailConfirmationRequired' in result) {
      return { emailConfirmationRequired: true, challengeToken: result.challengeToken };
    }

    return this.commitSession(reply, result);
  }

  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Start MFA setup: generate a TOTP secret and recovery codes' })
  @ApiResponse({ status: 200, description: 'Returns the otpauth URI and 10 recovery codes.' })
  @ApiResponse({ status: 400, description: 'MFA is already enabled, or setup is not allowed.' })
  @ApiResponse({ status: 401, description: 'Current password incorrect, or not authenticated.' })
  async mfaSetup(
    @Req() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(mfaSetupRequestSchema)) body: MfaSetupRequestDto,
  ): Promise<MfaSetupResponseDto> {
    return this.authService.mfaSetup(req.user.userId, body.password);
  }

  @Post('mfa/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm MFA setup by verifying the first TOTP code' })
  @ApiResponse({ status: 200, description: 'MFA enabled.' })
  @ApiResponse({ status: 400, description: 'Invalid code, or setup expired/not started.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  async mfaConfirm(
    @Req() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(mfaConfirmSchema)) body: MfaConfirmDto,
  ): Promise<{ success: true }> {
    await this.authService.mfaConfirm(req.user.userId, body.code);
    return { success: true };
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Disable MFA for the authenticated guardian' })
  @ApiResponse({ status: 200, description: 'MFA disabled.' })
  @ApiResponse({ status: 400, description: 'MFA is not enabled.' })
  @ApiResponse({ status: 401, description: 'Current password incorrect, or not authenticated.' })
  async mfaDisable(
    @Req() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(mfaDisableSchema)) body: MfaDisableDto,
  ): Promise<{ success: true }> {
    await this.authService.mfaDisable(req.user.userId, body.password);
    return { success: true };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete a two-step login with a TOTP code or recovery code' })
  @ApiResponse({ status: 200, description: 'Login completed; a full session is issued.' })
  @ApiResponse({ status: 400, description: 'Invalid code, or challenge exhausted.' })
  @ApiResponse({ status: 404, description: 'Invalid or expired login challenge.' })
  async mfaVerify(
    @Body(new ZodValidationPipe(mfaVerifySchema)) body: MfaVerifyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.mfaVerify(body);
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

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link for the given email' })
  @ApiResponse({
    status: 200,
    description: 'Always returns success, whether or not an account exists for this email.',
  })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordDto,
  ): Promise<{ success: true }> {
    await this.authService.forgotPassword(body.email);
    return { success: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset the account password using the token from the reset link' })
  @ApiResponse({ status: 200, description: 'Password updated.' })
  @ApiResponse({ status: 400, description: 'Invalid, expired, or already-used token; or a weak password.' })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordDto,
  ): Promise<{ success: true }> {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { success: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated guardian password, revoking every other session' })
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Weak new password.' })
  @ApiResponse({ status: 401, description: 'Current password incorrect, or not authenticated.' })
  async changePassword(
    @Req() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
    return { success: true };
  }

  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated guardian email, requiring re-verification' })
  @ApiResponse({ status: 200, description: 'Email changed; a new verification email was sent.' })
  @ApiResponse({ status: 400, description: 'Invalid email, or same as the current one.' })
  @ApiResponse({ status: 401, description: 'Current password incorrect, or not authenticated.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async changeEmail(
    @Req() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(changeEmailSchema)) body: ChangeEmailDto,
  ): Promise<{ success: true }> {
    await this.authService.changeEmail(req.user.userId, body.currentPassword, body.newEmail);
    return { success: true };
  }

  @Get('audit-log')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recent sensitive account events for the authenticated guardian' })
  @ApiResponse({ status: 200, description: 'Recent audit log entries, most recent first.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getAuditLog(@Req() req: { user: { userId: string } }): Promise<AccountAuditLogEntryDto[]> {
    return this.authService.getAuditLog(req.user.userId);
  }

  private commitSession(reply: FastifyReply, session: AuthSession): AuthResponseDto {
    setSessionCookie(reply, session.accessToken, this.environment);
    setRefreshCookie(reply, session.refreshToken, this.environment);
    return { accessToken: session.accessToken, user: session.user };
  }
}
