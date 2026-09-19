import { Test } from '@nestjs/testing';
import { MockDonationGateway } from './mock-donation-gateway.js';
import { MercadoPagoDonationGateway } from './mercadopago-donation-gateway.js';
import {
  DonationGatewayFactory,
  donationGatewayProvider,
  ConfigService,
} from './donation-gateway.factory.js';
import {
  DONATION_GATEWAY,
  DonationGateway,
} from './donation-gateway.interface.js';

describe('Donation Gateways & Factory', () => {
  describe('MockDonationGateway', () => {
    let gateway: MockDonationGateway;

    beforeEach(() => {
      gateway = new MockDonationGateway();
    });

    describe('createOneTimeIntent', () => {
      it('generates PIX QR code and copia-e-cola string for PIX payments', async () => {
        const donationId = '11111111-2222-3333-4444-555555555555';
        const amountCents = 2500;

        const result = await gateway.createOneTimeIntent({
          donationId,
          amountCents,
          paymentMethod: 'PIX',
          donorName: 'Test Donor',
          donorEmail: 'donor@example.com',
        });

        expect(result.gatewayTransactionId).toBe(`mock_tx_${donationId}`);
        expect(result.pixQrCodeUrl).toBeDefined();
        expect(result.pixQrCodeUrl).toContain('data:image/svg+xml;utf8,');
        expect(result.pixCopiaECola).toBe(
          `00020126580014br.gov.bcb.pix0136mock-donation-${donationId}520400005303986540525.005802BR5916Aletheia Project6009Sao Paulo62070503***6304ABCD`,
        );
        expect(result.clientSecret).toBeUndefined();
        expect(result.expiresAt).toBeInstanceOf(Date);
        expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 60 * 1000);
        expect(result.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 31 * 60 * 1000);
      });

      it('generates client secret for GOOGLE_PAY payments', async () => {
        const donationId = '22222222-3333-4444-5555-666666666666';
        const amountCents = 5000;

        const result = await gateway.createOneTimeIntent({
          donationId,
          amountCents,
          paymentMethod: 'GOOGLE_PAY',
        });

        expect(result.gatewayTransactionId).toBe(`mock_tx_${donationId}`);
        expect(result.clientSecret).toBe(`mock_gpay_token_${donationId}`);
        expect(result.pixQrCodeUrl).toBeUndefined();
        expect(result.pixCopiaECola).toBeUndefined();
        expect(result.expiresAt).toBeInstanceOf(Date);
      });

      it('generates client secret for CREDIT_CARD payments', async () => {
        const donationId = '33333333-4444-5555-6666-777777777777';
        const amountCents = 10000;

        const result = await gateway.createOneTimeIntent({
          donationId,
          amountCents,
          paymentMethod: 'CREDIT_CARD',
        });

        expect(result.gatewayTransactionId).toBe(`mock_tx_${donationId}`);
        expect(result.clientSecret).toBe(`mock_card_token_${donationId}`);
        expect(result.pixQrCodeUrl).toBeUndefined();
        expect(result.pixCopiaECola).toBeUndefined();
        expect(result.expiresAt).toBeInstanceOf(Date);
      });
    });

    describe('createSubscriptionIntent', () => {
      it('generates subscription intent with 30-day future billing date', async () => {
        const subscriptionId = '44444444-5555-6666-7777-888888888888';
        const familyId = '55555555-6666-7777-8888-999999999999';

        const result = await gateway.createSubscriptionIntent({
          subscriptionId,
          familyId,
          amountCents: 3000,
          paymentMethod: 'CREDIT_CARD',
          donorName: 'Supporter Name',
          donorEmail: 'supporter@example.com',
        });

        expect(result.gatewaySubscriptionId).toBe(`mock_sub_${subscriptionId}`);
        expect(result.nextBillingAt).toBeInstanceOf(Date);
        expect(result.nextBillingAt!.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
      });
    });

    describe('cancelSubscription', () => {
      it('resolves void immediately upon cancellation', async () => {
        await expect(gateway.cancelSubscription('mock_sub_123')).resolves.toBeUndefined();
      });
    });

    describe('parseWebhook', () => {
      it('parses confirmed payment webhook payload', async () => {
        const payload = {
          event: 'payment.confirmed',
          status: 'CONFIRMED',
          gatewayTransactionId: 'mock_tx_123',
          amountCents: 5000,
          paidAt: '2026-09-18T20:00:00.000Z',
        };

        const result = await gateway.parseWebhook(payload, {});

        expect(result.eventId).toBeDefined();
        expect(result.eventType).toBe('payment.confirmed');
        expect(result.status).toBe('CONFIRMED');
        expect(result.gatewayTransactionId).toBe('mock_tx_123');
        expect(result.amountCents).toBe(5000);
        expect(result.paidAt).toEqual(new Date('2026-09-18T20:00:00.000Z'));
      });

      it('parses subscription cancelled webhook payload', async () => {
        const payload = {
          event: 'subscription.cancelled',
          status: 'CANCELLED',
          gatewaySubscriptionId: 'mock_sub_456',
        };

        const result = await gateway.parseWebhook(payload, {});

        expect(result.eventType).toBe('subscription.cancelled');
        expect(result.status).toBe('CANCELLED');
        expect(result.gatewaySubscriptionId).toBe('mock_sub_456');
      });

      it('falls back safely for unknown/minimal payloads', async () => {
        const result = await gateway.parseWebhook({}, {});

        expect(result.eventId).toBeDefined();
        expect(result.eventType).toBe('payment.updated');
        expect(result.status).toBe('CONFIRMED');
      });
    });
  });

  describe('MercadoPagoDonationGateway', () => {
    it('throws error in production if MERCADOPAGO_ACCESS_TOKEN is not configured', async () => {
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'MERCADOPAGO_ACCESS_TOKEN') return undefined;
          return undefined;
        }),
      } as unknown as ConfigService;

      const mpGateway = new MercadoPagoDonationGateway(mockConfig);

      await expect(
        mpGateway.createOneTimeIntent({
          donationId: 'tx_1',
          amountCents: 2000,
          paymentMethod: 'PIX',
        }),
      ).rejects.toThrow(/MercadoPago access token is required in production/i);
    });

    it('works in sandbox/development mode without access token or with test token', async () => {
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'development';
          return undefined;
        }),
      } as unknown as ConfigService;

      const mpGateway = new MercadoPagoDonationGateway(mockConfig);

      const oneTimePix = await mpGateway.createOneTimeIntent({
        donationId: 'tx_pix_sandbox',
        amountCents: 1500,
        paymentMethod: 'PIX',
      });

      expect(oneTimePix.gatewayTransactionId).toContain('mp_sandbox_tx_tx_pix_sandbox');
      expect(oneTimePix.pixCopiaECola).toBeDefined();

      const subResult = await mpGateway.createSubscriptionIntent({
        subscriptionId: 'sub_sandbox_1',
        familyId: 'fam_1',
        amountCents: 3000,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(subResult.gatewaySubscriptionId).toContain('mp_sandbox_sub_sub_sandbox_1');

      await expect(mpGateway.cancelSubscription('sub_sandbox_1')).resolves.toBeUndefined();

      const parsed = await mpGateway.parseWebhook(
        {
          action: 'payment.created',
          data: { id: 'mp_pay_123' },
          status: 'CONFIRMED',
          amountCents: 1500,
        },
        {},
      );

      expect(parsed.gatewayTransactionId).toBe('mp_pay_123');
      expect(parsed.status).toBe('CONFIRMED');
    });

    describe('parseWebhook status mapping', () => {
      let mpGateway: MercadoPagoDonationGateway;

      beforeEach(() => {
        mpGateway = new MercadoPagoDonationGateway();
      });

      it('maps native "approved" status to CONFIRMED and parses transaction_amount and date_approved', async () => {
        const result = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: {
              id: 'mp_tx_approved_1',
              status: 'approved',
              transaction_amount: 35.5,
              date_approved: '2026-09-18T12:00:00.000Z',
            },
          },
          {},
        );

        expect(result.status).toBe('CONFIRMED');
        expect(result.gatewayTransactionId).toBe('mp_tx_approved_1');
        expect(result.amountCents).toBe(3550);
        expect(result.paidAt).toEqual(new Date('2026-09-18T12:00:00.000Z'));
      });

      it('maps native "rejected" status to FAILED', async () => {
        const result = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: { id: 'mp_tx_rej_1', status: 'rejected' },
          },
          {},
        );

        expect(result.status).toBe('FAILED');
        expect(result.paidAt).toBeUndefined();
      });

      it('maps native "cancelled" status to CANCELLED', async () => {
        const result = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: { id: 'mp_tx_canc_1' },
            status: 'cancelled',
          },
          {},
        );

        expect(result.status).toBe('CANCELLED');
        expect(result.paidAt).toBeUndefined();
      });

      it('maps non-approved statuses like "pending", "in_process", or unknown to FAILED', async () => {
        const pendingResult = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: { id: 'mp_tx_pend', status: 'pending' },
          },
          {},
        );
        expect(pendingResult.status).toBe('FAILED');

        const inProcessResult = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: { id: 'mp_tx_proc', status: 'in_process' },
          },
          {},
        );
        expect(inProcessResult.status).toBe('FAILED');

        const unknownResult = await mpGateway.parseWebhook(
          {
            action: 'payment.updated',
            data: { id: 'mp_tx_unk', status: 'other_unknown_status' },
          },
          {},
        );
        expect(unknownResult.status).toBe('FAILED');
      });
    });
  });

  describe('DonationGatewayFactory & donationGatewayProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('creates MockDonationGateway by default when DONATION_GATEWAY_PROVIDER is unset', () => {
      const config = new ConfigService();
      const factory = new DonationGatewayFactory(config);
      const gateway = factory.create();

      expect(gateway).toBeInstanceOf(MockDonationGateway);
    });

    it('creates MercadoPagoDonationGateway when DONATION_GATEWAY_PROVIDER is mercadopago', () => {
      const mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'DONATION_GATEWAY_PROVIDER') return 'mercadopago';
          return undefined;
        }),
      } as unknown as ConfigService;

      const factory = new DonationGatewayFactory(mockConfig);
      const gateway = factory.create();

      expect(gateway).toBeInstanceOf(MercadoPagoDonationGateway);
    });

    it('resolves DONATION_GATEWAY token using donationGatewayProvider in Nest testing module', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          ConfigService,
          donationGatewayProvider,
        ],
      }).compile();

      const gateway = moduleRef.get<DonationGateway>(DONATION_GATEWAY);
      expect(gateway).toBeDefined();
      expect(gateway).toBeInstanceOf(MockDonationGateway);
    });
  });
});
