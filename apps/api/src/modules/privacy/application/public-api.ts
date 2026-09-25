import type {
  ConsentComplianceCheckDto,
  ConsentDefinitionResponseDto,
  ConsentRecordResponseDto,
  ConsentScope,
  GrantConsentDto,
} from '@aletheia/contracts';

export const PRIVACY_PUBLIC_API = Symbol('PRIVACY_PUBLIC_API');

export interface PrivacyPublicApi {
  checkMandatoryCompliance(familyId: string, learnerId?: string): Promise<ConsentComplianceCheckDto>;
  getPublishedDefinitions(scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]>;
  grantConsent(
    familyId: string,
    userId: string,
    dto: GrantConsentDto,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ConsentRecordResponseDto>;
}
