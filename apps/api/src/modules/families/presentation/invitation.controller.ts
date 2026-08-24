import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FamilyInvitationDto, InviteGuardianDto } from '@aletheia/contracts';
import { InvitationService } from '../application/invitation.service.js';
import { JwtAuthGuard } from '../../../platform/auth/index.js';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('families/:familyId/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a guardian to join family' })
  @ApiResponse({ status: 201, description: 'Invitation created.' })
  @ApiResponse({ status: 403, description: 'Forbidden if not family member.' })
  async createInvitation(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
    @Body() body: InviteGuardianDto,
  ): Promise<FamilyInvitationDto> {
    return this.invitationService.createInvitation(req.user.userId, familyId, body);
  }

  @Get('families/:familyId/invitations')
  @ApiOperation({ summary: 'List pending invitations for a family' })
  @ApiResponse({ status: 200, description: 'List of invitations.' })
  async listInvitations(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
  ): Promise<FamilyInvitationDto[]> {
    return this.invitationService.listInvitations(req.user.userId, familyId);
  }

  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation token to join family' })
  @ApiResponse({ status: 200, description: 'Invitation accepted.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation.' })
  async acceptInvitation(
    @Req() req: { user: { userId: string } },
    @Param('token') token: string,
  ): Promise<{ success: boolean; familyId: string }> {
    return this.invitationService.acceptInvitation(req.user.userId, token);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel/delete an invitation' })
  @ApiResponse({ status: 204, description: 'Invitation deleted.' })
  async deleteInvitation(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.invitationService.cancelInvitation(req.user.userId, id);
  }
}
