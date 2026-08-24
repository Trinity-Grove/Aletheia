import type { UserSummaryDto } from '@aletheia/contracts';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
}

export const IDENTITY_PUBLIC_API = Symbol('IDENTITY_PUBLIC_API');

export interface IdentityPublicApi {
  verifyToken(token: string): Promise<AuthenticatedUserPayload | null>;
  findUserById(userId: string): Promise<UserSummaryDto | null>;
}
