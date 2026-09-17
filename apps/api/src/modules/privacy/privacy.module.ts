import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { ConsentDefinitionsRepository } from './infrastructure/consent-definitions.repository.js';
import { ConsentDefinitionsService } from './application/consent-definitions.service.js';
import { FamilyConsentRepository } from './infrastructure/family-consent.repository.js';
import { FamilyConsentService } from './application/family-consent.service.js';
import { PRIVACY_PUBLIC_API } from './application/public-api.js';
import { ConsentDefinitionsController } from './presentation/consent-definitions.controller.js';
import { PublicConsentDefinitionsController } from './presentation/public-consent-definitions.controller.js';
import { FamilyConsentController } from './presentation/family-consent.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    ConsentDefinitionsController,
    PublicConsentDefinitionsController,
    FamilyConsentController,
  ],
  providers: [
    ConsentDefinitionsRepository,
    ConsentDefinitionsService,
    FamilyConsentRepository,
    FamilyConsentService,
    {
      provide: PRIVACY_PUBLIC_API,
      useExisting: FamilyConsentService,
    },
  ],
  exports: [ConsentDefinitionsService, FamilyConsentService, PRIVACY_PUBLIC_API],
})
export class PrivacyModule {}
