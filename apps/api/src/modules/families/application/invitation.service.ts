import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { FamilyInvitationDto, InviteGuardianDto } from '@aletheia/contracts';
import { InvitationRepository } from '../infrastructure/invitation.repository.js';
import { FamilyRepository } from '../infrastructure/family.repository.js';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly familyRepository: FamilyRepository,
  ) {}

  async createInvitation(
    currentUserId: string,
    familyId: string,
    dto: InviteGuardianDto,
  ): Promise<FamilyInvitationDto> {
    const isMember = await this.familyRepository.isMember(currentUserId, familyId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this family to invite guardians.');
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationRepository.create({
      familyId,
      email: dto.email,
      role: dto.role,
      token,
      invitedBy: currentUserId,
      expiresAt,
    });

    return invitation.toDto();
  }

  async acceptInvitation(currentUserId: string, token: string): Promise<{ success: boolean; familyId: string }> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token.');
    }

    if (invitation.isAccepted()) {
      throw new BadRequestException('This invitation has already been accepted.');
    }

    if (invitation.isExpired()) {
      throw new BadRequestException('This invitation has expired.');
    }

    await this.invitationRepository.accept(
      invitation.id,
      currentUserId,
      invitation.familyId,
      invitation.role,
    );

    return {
      success: true,
      familyId: invitation.familyId,
    };
  }

  async listInvitations(currentUserId: string, familyId: string): Promise<FamilyInvitationDto[]> {
    const isMember = await this.familyRepository.isMember(currentUserId, familyId);
    if (!isMember) {
      throw new ForbiddenException('Access denied.');
    }

    const list = await this.invitationRepository.findByFamilyId(familyId);
    return list.map((i) => i.toDto());
  }

  async cancelInvitation(currentUserId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    const isMember = await this.familyRepository.isMember(currentUserId, invitation.familyId);
    if (!isMember) {
      throw new ForbiddenException('Access denied.');
    }

    await this.invitationRepository.delete(invitationId);
  }
}
