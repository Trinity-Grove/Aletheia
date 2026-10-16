import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { learnerCompetencyApprovalDecisionSchema, type LearnerCompetencyApprovalDecisionDto } from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { LearnerCompetencyApprovalService } from '../application/learner-competency-approval.service.js';
import { MentorProgressionApprovalService } from '../application/mentor-progression-approval.service.js';

@ApiTags('Curriculum Competency Approval')
@ApiBearerAuth()
@Controller({ version: '1' })
export class LearnerCompetencyApprovalController {
  constructor(private readonly approvals: LearnerCompetencyApprovalService, private readonly mentorApprovals: MentorProgressionApprovalService) {}

  @Post('families/:familyId/curriculum/competency-tracking/:trackingId/approval')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, FamilyTenantGuard)
  @ApiOperation({ summary: 'Approve or return a pending competency for this family' })
  decideForFamily(
    @Req() req: { user: { userId: string } }, @Param('familyId') familyId: string, @Param('trackingId') trackingId: string,
    @Body(new ZodValidationPipe(learnerCompetencyApprovalDecisionSchema)) dto: LearnerCompetencyApprovalDecisionDto,
  ) {
    return this.approvals.recordForFamily(familyId, trackingId, req.user.userId, dto);
  }

  @Post('mentors/progression-approvals/:trackingId/decision')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve or return a competency covered by the mentor’s active grant' })
  decideForMentor(
    @Req() req: { user: { userId: string } }, @Param('trackingId') trackingId: string,
    @Body(new ZodValidationPipe(learnerCompetencyApprovalDecisionSchema)) dto: LearnerCompetencyApprovalDecisionDto,
  ) {
    return this.mentorApprovals.decide(req.user.userId, trackingId, dto);
  }
}

@ApiTags('Mentor Competency Approval')
@ApiBearerAuth()
@Controller({ path: 'mentors/progression-approvals', version: '1' })
export class MentorProgressionApprovalController {
  constructor(private readonly service: MentorProgressionApprovalService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List only pending approvals within the authenticated mentor’s active grants' })
  list(@Req() req: { user: { userId: string } }) {
    return this.service.listPending(req.user.userId);
  }
}
