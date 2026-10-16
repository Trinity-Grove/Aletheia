export const MENTOR_GRANT_PUBLIC_API = Symbol('MENTOR_GRANT_PUBLIC_API');

export interface MentorApprovalGrantScope {
  grantId: string;
  familyId: string;
  learnerId: string;
}

export interface MentorGrantPublicApi {
  canMentorApproveProgression(userId: string, familyId: string, learnerId: string): Promise<boolean>;
  listProgressionApprovalScopes(userId: string): Promise<MentorApprovalGrantScope[]>;
}
