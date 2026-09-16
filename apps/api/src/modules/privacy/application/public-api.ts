import type {
  ConsentComplianceCheckDto,
  ConsentDefinitionResponseDto,
  ConsentScope,
} from '@aletheia/contracts';

export const PRIVACY_PUBLIC_API = Symbol('PRIVACY_PUBLIC_API');

export interface PrivacyPublicApi {
  checkMandatoryCompliance(familyId: string, learnerId?: string): Promise<ConsentComplianceCheckDto>;
  getPublishedDefinitions(scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]>;
}
