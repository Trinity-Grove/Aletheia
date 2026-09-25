import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  inviteMentorSchema,
  type AcceptMentorGrantResponseDto,
  type InviteMentorDto,
  type MentorGrantResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { MentorGrantService } from '../application/mentor-grant.service.js';

// Mentor/external instructor invite flow (issue #95 section 30, #232).
// Invite/list/revoke are family-tenant-scoped (same guard pair as every
// other family-scoped controller); accept has no familyId in its path --
// the mentor accepting may not be a member of anything yet, same as
// InvitationController's own accept endpoint.
@ApiTags('Mentors')
@ApiBearerAuth()
@Controller({ version: '1' })
export class MentorGrantController {
  constructor(private readonly service: MentorGrantService) {}

  @Post('families/:familyId/learners/:learnerId/mentors')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, FamilyTenantGuard)
  @ApiOperation({ summary: 'Invite a mentor/external instructor for one learner' })
  async inviteMentor(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
    @Param('learnerId') learnerId: string,
    @Body(new ZodValidationPipe(inviteMentorSchema)) dto: InviteMentorDto,
  ): Promise<MentorGrantResponseDto> {
    return this.service.inviteMentor(req.user.userId, familyId, learnerId, dto);
  }

  @Get('families/:familyId/learners/:learnerId/mentors')
  @UseGuards(JwtAuthGuard, FamilyTenantGuard)
  @ApiOperation({ summary: "List a learner's mentor grants" })
  async listMentors(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
    @Param('learnerId') learnerId: string,
  ): Promise<MentorGrantResponseDto[]> {
    return this.service.listMentorsForLearner(req.user.userId, familyId, learnerId);
  }

  @Post('mentors/:token/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept a mentor invitation token' })
  async acceptMentorGrant(
    @Req() req: { user: { userId: string } },
    @Param('token') token: string,
  ): Promise<AcceptMentorGrantResponseDto> {
    return this.service.acceptMentorGrant(req.user.userId, token);
  }

  @Delete('mentors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke a mentor grant' })
  async revokeMentorGrant(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.revokeMentorGrant(req.user.userId, id);
  }
}
