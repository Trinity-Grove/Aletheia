import type { FamilyRole } from './family-role.js';
import type { FamilyMemberDto } from '@aletheia/contracts';

export interface FamilyMemberProps {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  createdAt: Date;
  updatedAt: Date;
}

export class FamilyMemberEntity {
  constructor(private readonly props: FamilyMemberProps) {}

  get id(): string {
    return this.props.id;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): FamilyRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toDto(): FamilyMemberDto {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      role: this.role,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
