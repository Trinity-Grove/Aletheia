export const MENTOR_GRANT_PUBLIC_API = Symbol('MENTOR_GRANT_PUBLIC_API');

export interface MentorApprovalGrantScope {
  grantId: string;
  familyId: string;
  learnerId: string;
}

export interface MentorGrantPublicApi {
  canMentorAssess(userId: string, familyId: string, learnerId: string): Promise<boolean>;
  canMentorApproveProgression(userId: string, familyId: string, learnerId: string): Promise<boolean>;
  listProgressionApprovalScopes(userId: string): Promise<MentorApprovalGrantScope[]>;
}
