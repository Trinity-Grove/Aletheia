import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  listUsersQuerySchema,
  updateUserFullNameSchema,
  type AdminUserSummaryDto,
  type ListUsersQueryDto,
  type ListUsersResponseDto,
  type UpdateUserFullNameDto,
} from '@aletheia/contracts';
import { AuthService } from '../application/auth.service.js';
import { CurrentUser, JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import type { AuthenticatedUserPayload } from '../application/public-api.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

// Backoffice user-management screen -- list/edit/promote/demote/disable
// any guardian account. Every mutating route here guards against a
// platform admin acting on their own account (see assertNotSelf): the
// self-service equivalents (change-password, change-email, etc.) already
// live on AuthController and stay untouched by this controller.
@ApiTags('Admin: Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/users', version: '1' })
export class AdminUsersController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'List guardian accounts, paginated and optionally filtered by search' })
  @ApiResponse({ status: 200, description: 'A page of users and the total matching count.' })
  async listUsers(
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQueryDto,
  ): Promise<ListUsersResponseDto> {
    return this.authService.listUsers(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Update a guardian's full name" })
  @ApiResponse({ status: 200, description: 'The updated user.' })
  async updateFullName(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserFullNameSchema)) body: UpdateUserFullNameDto,
  ): Promise<AdminUserSummaryDto> {
    return this.authService.updateUserFullName(id, body.fullName);
  }

  @Post(':id/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant platform-admin privileges to a guardian' })
  @ApiResponse({ status: 200, description: 'The updated user.' })
  async promote(@Param('id') id: string): Promise<AdminUserSummaryDto> {
    return this.authService.grantPlatformAdminByAdmin(id);
  }

  @Post(':id/demote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke platform-admin privileges from a guardian' })
  @ApiResponse({ status: 200, description: 'The updated user.' })
  @ApiResponse({ status: 400, description: 'Cannot demote your own account.' })
  async demote(
    @Param('id') id: string,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminUserSummaryDto> {
    this.assertNotSelf(id, caller, "You can't remove your own admin privileges.");
    return this.authService.revokePlatformAdminByAdmin(id);
  }

  @Post(':id/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a guardian account and revoke its active sessions' })
  @ApiResponse({ status: 200, description: 'The updated user.' })
  @ApiResponse({ status: 400, description: 'Cannot disable your own account.' })
  async disable(
    @Param('id') id: string,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminUserSummaryDto> {
    this.assertNotSelf(id, caller, "You can't disable your own account.");
    return this.authService.disableUser(id);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a previously disabled guardian account' })
  @ApiResponse({ status: 200, description: 'The updated user.' })
  async reactivate(@Param('id') id: string): Promise<AdminUserSummaryDto> {
    return this.authService.reactivateUser(id);
  }

  @Post(':id/force-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Email a password reset link to a guardian, same as their own forgot-password flow" })
  @ApiResponse({ status: 200, description: 'Reset email sent.' })
  async forcePasswordReset(@Param('id') id: string): Promise<{ success: true }> {
    await this.authService.forcePasswordReset(id);
    return { success: true };
  }

  private assertNotSelf(targetId: string, caller: AuthenticatedUserPayload, message: string): void {
    if (targetId === caller.userId) {
      throw new BadRequestException(message);
    }
  }
}
