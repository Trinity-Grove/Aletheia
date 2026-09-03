import type { FamilyRole } from './family-role.js';
import type { FamilyInvitationDto } from '@aletheia/contracts';

export interface FamilyInvitationProps {
  id: string;
  familyId: string;
  email: string;
  role: FamilyRole;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
}

export class FamilyInvitationEntity {
  constructor(private readonly props: FamilyInvitationProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get email(): string {
    return this.props.email;
  }

  get role(): FamilyRole {
    return this.props.role;
  }

  get invitedBy(): string {
    return this.props.invitedBy;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get acceptedAt(): Date | null | undefined {
    return this.props.acceptedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isAccepted(): boolean {
    return !!this.props.acceptedAt;
  }

  // `token` is only ever known in plaintext at the moment of creation — it's
  // never persisted or read back, so it's passed in here rather than stored
  // on the entity. Every other read (list, get) omits it entirely.
  toDto(plainToken?: string): FamilyInvitationDto {
    return {
      id: this.id,
      familyId: this.familyId,
      email: this.email,
      role: this.role,
      ...(plainToken !== undefined ? { token: plainToken } : {}),
      invitedBy: this.invitedBy,
      expiresAt: this.expiresAt.toISOString(),
      acceptedAt: this.acceptedAt ? this.acceptedAt.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
