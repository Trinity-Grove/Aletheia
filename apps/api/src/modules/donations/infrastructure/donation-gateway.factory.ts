import { Injectable, Optional, type Provider } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import {
  DONATION_GATEWAY,
  type DonationGateway,
} from './donation-gateway.interface.js';
import { MockDonationGateway } from './mock-donation-gateway.js';
import { MercadoPagoDonationGateway } from './mercadopago-donation-gateway.js';

@Injectable()
export class DonationGatewayFactory {
  constructor(@Optional() private readonly config?: ConfigService) {}

  create(): DonationGateway {
    const provider =
      this.config?.get('DONATION_GATEWAY_PROVIDER') ??
      process.env['DONATION_GATEWAY_PROVIDER'];

    if (provider === 'mercadopago') {
      return new MercadoPagoDonationGateway(this.config);
    }

    return new MockDonationGateway();
  }
}

export const donationGatewayProvider: Provider = {
  provide: DONATION_GATEWAY,
  inject: [{ token: ConfigService, optional: true }],
  useFactory: (config?: ConfigService): DonationGateway => {
    const factory = new DonationGatewayFactory(config);
    return factory.create();
  },
};

export { ConfigService };
