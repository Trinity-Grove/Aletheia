export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  constructor(private readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toDto() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      emailVerified: this.emailVerifiedAt !== null,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
