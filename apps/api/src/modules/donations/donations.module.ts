import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { EnvironmentModule } from '../../platform/config/environment.module.js';
import { FamiliesModule } from '../families/families.module.js';
import {
  DonationGatewayFactory,
  donationGatewayProvider,
} from './infrastructure/donation-gateway.factory.js';
import { DONATION_GATEWAY } from './infrastructure/donation-gateway.interface.js';
import { DonationsRepository } from './infrastructure/donations.repository.js';
import { DonationsService } from './application/donations.service.js';
import { DonationsController } from './presentation/donations.controller.js';
import { DonationWebhooksController } from './presentation/donation-webhooks.controller.js';

@Module({
  imports: [DatabaseModule, EnvironmentModule, FamiliesModule],
  controllers: [DonationsController, DonationWebhooksController],
  providers: [
    DonationGatewayFactory,
    donationGatewayProvider,
    DonationsRepository,
    DonationsService,
  ],
  exports: [DONATION_GATEWAY, DonationsService, DonationsRepository],
})
export class DonationsModule {}
