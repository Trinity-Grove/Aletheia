import type { FamilyResponseDto } from '@aletheia/contracts';

export const FAMILY_PUBLIC_API = Symbol('FAMILY_PUBLIC_API');

export interface FamilyPublicApi {
  isGuardianInFamily(userId: string, familyId: string): Promise<boolean>;
  getFamilyForUser(userId: string, familyId: string): Promise<FamilyResponseDto | null>;
}
