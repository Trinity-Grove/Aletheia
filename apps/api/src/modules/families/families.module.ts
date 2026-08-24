import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { FamilyRepository } from './infrastructure/family.repository.js';
import { FamilyService } from './application/family.service.js';
import { FAMILY_PUBLIC_API } from './application/public-api.js';
import { FamilyController } from './presentation/family.controller.js';
import { InvitationRepository } from './infrastructure/invitation.repository.js';
import { InvitationService } from './application/invitation.service.js';
import { InvitationController } from './presentation/invitation.controller.js';
import { FamilyTenantGuard } from '../../platform/auth/index.js';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [FamilyController, InvitationController],
  providers: [
    FamilyRepository,
    FamilyService,
    InvitationRepository,
    InvitationService,
    FamilyTenantGuard,
    {
      provide: FAMILY_PUBLIC_API,
      useExisting: FamilyService,
    },
  ],
  exports: [FAMILY_PUBLIC_API, FamilyService, InvitationService, FamilyTenantGuard],
})
export class FamiliesModule {}
