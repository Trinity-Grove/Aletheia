import { Injectable } from '@nestjs/common';
import type {
  ConsentComplianceCheckDto,
  ConsentDefinitionResponseDto,
  ConsentRecordResponseDto,
  ConsentScope,
  GrantConsentDto,
} from '@aletheia/contracts';
import { FamilyConsentService } from './family-consent.service.js';
import { SensitiveDataAuditService } from './sensitive-data-audit.service.js';
import type { SensitiveDataAccessLogEntry } from '../infrastructure/sensitive-data-audit.repository.js';
import type { PrivacyPublicApi } from './public-api.js';

// Thin delegate implementing PrivacyPublicApi -- lets each consumer module
// depend only on the interface while the two concerns (consent, sensitive
// data audit) stay in their own services instead of piling onto one class.
@Injectable()
export class PrivacyFacadeService implements PrivacyPublicApi {
  constructor(
    private readonly familyConsentService: FamilyConsentService,
    private readonly sensitiveDataAuditService: SensitiveDataAuditService,
  ) {}

  checkMandatoryCompliance(familyId: string, learnerId?: string): Promise<ConsentComplianceCheckDto> {
    return this.familyConsentService.checkMandatoryCompliance(familyId, learnerId);
  }

  getPublishedDefinitions(scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]> {
    return this.familyConsentService.getPublishedDefinitions(scope);
  }

  grantConsent(
    familyId: string,
    userId: string,
    dto: GrantConsentDto,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ConsentRecordResponseDto> {
    return this.familyConsentService.grantConsent(familyId, userId, dto, context);
  }

  recordSensitiveDataAccess(entry: SensitiveDataAccessLogEntry): Promise<void> {
    return this.sensitiveDataAuditService.record(entry);
  }
}
