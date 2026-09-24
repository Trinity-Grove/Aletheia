import type { MentorGrantResponseDto, MentorGrantStatus } from '@aletheia/contracts';

export interface MentorGrantProps {
  id: string;
  familyId: string;
  learnerId: string;
  email: string;
  role: string;
  status: MentorGrantStatus;
  mentorUserId: string | null;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export class MentorGrantEntity {
  constructor(private readonly props: MentorGrantProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get learnerId(): string {
    return this.props.learnerId;
  }

  get status(): MentorGrantStatus {
    return this.props.status;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isAccepted(): boolean {
    return this.props.status === 'ACCEPTED';
  }

  isRevoked(): boolean {
    return this.props.status === 'REVOKED';
  }

  // `token` is only ever known in plaintext at the moment of creation --
  // never persisted or read back, same discipline as
  // FamilyInvitationEntity.toDto.
  toDto(plainToken?: string): MentorGrantResponseDto {
    return {
      id: this.props.id,
      familyId: this.props.familyId,
      learnerId: this.props.learnerId,
      email: this.props.email,
      role: this.props.role,
      status: this.props.status,
      mentorUserId: this.props.mentorUserId,
      ...(plainToken !== undefined ? { token: plainToken } : {}),
      invitedBy: this.props.invitedBy,
      expiresAt: this.props.expiresAt.toISOString(),
      acceptedAt: this.props.acceptedAt ? this.props.acceptedAt.toISOString() : null,
      revokedAt: this.props.revokedAt ? this.props.revokedAt.toISOString() : null,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
