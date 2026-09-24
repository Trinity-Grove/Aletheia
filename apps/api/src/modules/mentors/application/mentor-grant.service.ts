import { randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AcceptMentorGrantResponseDto, InviteMentorDto, MentorGrantResponseDto } from '@aletheia/contracts';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../../families/application/public-api.js';
import { MentorGrantRepository } from '../infrastructure/mentor-grant.repository.js';

// Mentor/external instructor invite flow (issue #95 section 30, #232).
// Same invite-by-email + hashed-token shape as InvitationService
// (families module) -- deliberately its own small service, not folded
// into that one: a mentor invite is scoped to one learner, not the
// whole family, and never creates a FamilyMember row on accept.
const MENTOR_GRANT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class MentorGrantService {
  constructor(
    private readonly repository: MentorGrantRepository,
    @Inject(FAMILY_PUBLIC_API) private readonly familyApi: FamilyPublicApi,
  ) {}

  async inviteMentor(
    currentUserId: string,
    familyId: string,
    learnerId: string,
    dto: InviteMentorDto,
  ): Promise<MentorGrantResponseDto> {
    const isMember = await this.familyApi.isGuardianInFamily(currentUserId, familyId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this family to invite a mentor.');
    }

    const learnerFamilyId = await this.repository.findLearnerFamilyId(learnerId);
    if (!learnerFamilyId || learnerFamilyId !== familyId) {
      throw new NotFoundException('Learner not found in this family.');
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + MENTOR_GRANT_TTL_MS);

    const grant = await this.repository.create({
      familyId,
      learnerId,
      email: dto.email,
      role: dto.role,
      token,
      invitedBy: currentUserId,
      expiresAt,
    });

    return grant.toDto(token);
  }

  async listMentorsForLearner(
    currentUserId: string,
    familyId: string,
    learnerId: string,
  ): Promise<MentorGrantResponseDto[]> {
    const isMember = await this.familyApi.isGuardianInFamily(currentUserId, familyId);
    if (!isMember) {
      throw new ForbiddenException('Access denied.');
    }

    const list = await this.repository.listForLearner(familyId, learnerId);
    return list.map((g) => g.toDto());
  }

  async acceptMentorGrant(currentUserId: string, token: string): Promise<AcceptMentorGrantResponseDto> {
    const grant = await this.repository.findByToken(token);
    if (!grant) {
      throw new NotFoundException('Mentor invitation not found or invalid token.');
    }
    if (grant.isAccepted()) {
      throw new BadRequestException('This mentor invitation has already been accepted.');
    }
    if (grant.isRevoked()) {
      throw new BadRequestException('This mentor invitation has been revoked.');
    }
    if (grant.isExpired()) {
      throw new BadRequestException('This mentor invitation has expired.');
    }

    const accepted = await this.repository.accept(grant.id, currentUserId);
    return { success: true, familyId: accepted.familyId, learnerId: accepted.learnerId };
  }

  async revokeMentorGrant(currentUserId: string, id: string): Promise<void> {
    const grant = await this.repository.findById(id);
    if (!grant) {
      throw new NotFoundException('Mentor grant not found.');
    }

    const isMember = await this.familyApi.isGuardianInFamily(currentUserId, grant.familyId);
    if (!isMember) {
      throw new ForbiddenException('Access denied.');
    }

    await this.repository.revoke(id);
  }
}
