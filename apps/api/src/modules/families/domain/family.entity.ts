import { FamilyMemberEntity } from './family-member.entity.js';
import type { FamilyResponseDto } from '@aletheia/contracts';

export interface FamilyProps {
  id: string;
  name: string;
  countryCode: string;
  stateProvince?: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: FamilyMemberEntity[];
}

export class FamilyEntity {
  private readonly _members: FamilyMemberEntity[];

  constructor(private readonly props: FamilyProps) {
    this._members = props.members ?? [];
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  get stateProvince(): string | null | undefined {
    return this.props.stateProvince;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get members(): FamilyMemberEntity[] {
    return [...this._members];
  }

  toDto(): FamilyResponseDto {
    return {
      id: this.id,
      name: this.name,
      countryCode: this.countryCode,
      stateProvince: this.stateProvince ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      members: this._members.map((m) => m.toDto()),
    };
  }
}
