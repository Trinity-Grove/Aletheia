import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  loginSchema,
  registerGuardianSchema,
  type AuthResponseDto,
  type LoginDto,
  type RegisterGuardianDto,
  type UserSummaryDto,
} from '@aletheia/contracts';
import { AuthService } from '../application/auth.service.js';
import { JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new guardian account' })
  @ApiResponse({ status: 201, description: 'Guardian successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input or weak password.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async register(
    @Body(new ZodValidationPipe(registerGuardianSchema)) body: RegisterGuardianDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with guardian email and password' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(body);
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
}
