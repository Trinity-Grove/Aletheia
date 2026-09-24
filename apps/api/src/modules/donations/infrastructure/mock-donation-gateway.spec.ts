import { createHmac } from 'node:crypto';
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

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

// Builds a real, valid x-signature the way MercadoPagoDonationGateway
// itself verifies it (id:{data.id};request-id:{x-request-id};ts:{ts};),
// so tests can prove the success path with the exact manifest from
// Mercado Pago's own notifications docs -- not just that failure is
// rejected.
function signWebhook(secret: string, dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hash = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${hash}`;
}

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
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    function configWith(overrides: Record<string, string | undefined>): ConfigService {
      return {
        get: jest.fn((key: string) => overrides[key]),
      } as unknown as ConfigService;
    }

    it('throws error in production if MERCADOPAGO_ACCESS_TOKEN is not configured', async () => {
      const mpGateway = new MercadoPagoDonationGateway(
        configWith({ NODE_ENV: 'production' }),
      );

      await expect(
        mpGateway.createOneTimeIntent({
          donationId: 'tx_1',
          amountCents: 2000,
          paymentMethod: 'PIX',
        }),
      ).rejects.toThrow(/MercadoPago access token is required in production/i);
    });

    describe('createOneTimeIntent (Checkout Transparente / Orders API)', () => {
      it('creates a real PIX order via POST /v1/orders and maps the qr_code fields', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
          jsonResponse({
            id: 'ORD01HRYFWNYRE1MR1E60MW3X0T2P',
            status: 'action_required',
            transactions: {
              payments: [
                {
                  id: 'PAY01HRYFXQ53Q3JPEC48MYWMR0TE',
                  payment_method: {
                    qr_code: '00020126580014br.gov.bcb.pix...real...',
                    qr_code_base64: 'iVBORw0KGgo=',
                  },
                },
              ],
            },
          }),
        );
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 'TEST-token' }),
        );

        const result = await mpGateway.createOneTimeIntent({
          donationId: 'donation-1',
          amountCents: 5000,
          paymentMethod: 'PIX',
          donorEmail: 'donor@example.com',
        });

        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.mercadopago.com/v1/orders',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer TEST-token',
              'X-Idempotency-Key': 'donation-1',
            }),
          }),
        );
        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        expect(body.total_amount).toBe('50.00');
        expect(body.transactions.payments[0].payment_method).toEqual({
          id: 'pix',
          type: 'bank_transfer',
        });
        expect(body.payer).toEqual({ email: 'donor@example.com' });

        expect(result.gatewayTransactionId).toBe('ORD01HRYFWNYRE1MR1E60MW3X0T2P');
        expect(result.pixCopiaECola).toBe('00020126580014br.gov.bcb.pix...real...');
        expect(result.pixQrCodeUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
      });

      it('falls back to a synthetic payer.email scoped to the donation when no donorEmail is given -- MercadoPago requires payer.email and rejects a missing/empty payer outright (found live in production twice)', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
          jsonResponse({
            id: 'ORD_NO_EMAIL',
            status: 'action_required',
            transactions: { payments: [{ id: 'PAY_NO_EMAIL', payment_method: {} }] },
          }),
        );
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 'TEST-token' }),
        );

        await mpGateway.createOneTimeIntent({
          donationId: 'donation-no-email',
          amountCents: 3000,
          paymentMethod: 'PIX',
        });

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        // This is the last-resort safety net only -- DonationsService is
        // expected to resolve a real account email first and pass it in
        // as donorEmail; this path is what runs if that lookup itself
        // comes back empty.
        expect(body.payer).toEqual({ email: 'donation+donation-no-email@aletheiaphos.app' });
      });

      it('surfaces a MercadoPago error response as a thrown error, not a silently fake success', async () => {
        global.fetch = jest
          .fn()
          .mockResolvedValue(jsonResponse({ message: 'invalid access token' }, false, 401)) as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 'bad-token' }),
        );

        await expect(
          mpGateway.createOneTimeIntent({
            donationId: 'donation-2',
            amountCents: 1000,
            paymentMethod: 'PIX',
          }),
        ).rejects.toThrow(/invalid access token/i);
      });
    });

    describe('createSubscriptionIntent (Subscriptions / preapproval, pending payments)', () => {
      it('creates a real preapproval with status=pending and no card_token_id, returning the hosted authorizationUrl', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
          jsonResponse({
            id: 'preapproval-abc123',
            init_point: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=abc123',
          }),
        );
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 'TEST-token' }),
        );

        const result = await mpGateway.createSubscriptionIntent({
          subscriptionId: 'sub-1',
          familyId: 'fam-1',
          amountCents: 3000,
          paymentMethod: 'GOOGLE_PAY',
          donorEmail: 'donor@example.com',
        });

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        expect(body.status).toBe('pending');
        expect(body.card_token_id).toBeUndefined();
        expect(body.auto_recurring).toEqual(
          expect.objectContaining({ frequency: 1, frequency_type: 'months', currency_id: 'BRL', transaction_amount: 30 }),
        );

        expect(result.gatewaySubscriptionId).toBe('preapproval-abc123');
        expect(result.authorizationUrl).toBe(
          'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=abc123',
        );
      });

      it('uses the dedicated MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN when configured -- never the donations app token', async () => {
        const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ id: 'sub-2' }));
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({
            MERCADOPAGO_ACCESS_TOKEN: 'donations-app-token',
            MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN: 'subscriptions-app-token',
          }),
        );

        await mpGateway.createSubscriptionIntent({
          subscriptionId: 'sub-2',
          familyId: 'fam-1',
          amountCents: 3000,
          paymentMethod: 'GOOGLE_PAY',
        });

        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.mercadopago.com/preapproval',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer subscriptions-app-token' }),
          }),
        );
      });
    });

    it('keeps createOneTimeIntent on the donations app token even when a different subscriptions token is configured -- proves the two apps never bleed into each other', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({ id: 'ORD_ISOLATION', status: 'action_required', transactions: { payments: [{ id: 'PAY1', payment_method: {} }] } }),
      );
      global.fetch = fetchMock as unknown as typeof fetch;

      const mpGateway = new MercadoPagoDonationGateway(
        configWith({
          MERCADOPAGO_ACCESS_TOKEN: 'donations-app-token',
          MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN: 'subscriptions-app-token',
        }),
      );

      await mpGateway.createOneTimeIntent({
        donationId: 'donation-isolation',
        amountCents: 1000,
        paymentMethod: 'PIX',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mercadopago.com/v1/orders',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer donations-app-token' }),
        }),
      );
    });

    describe('cancelSubscription', () => {
      it('sends PUT /preapproval/:id with status=cancelled', async () => {
        const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ id: 'sub-1', status: 'cancelled' }));
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 'TEST-token' }),
        );

        await mpGateway.cancelSubscription('sub-1');

        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.mercadopago.com/preapproval/sub-1',
          expect.objectContaining({ method: 'PUT' }),
        );
        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body as string)).toEqual({ status: 'cancelled' });
      });
    });

    describe('parseWebhook signature verification', () => {
      const SECRET = 'whsec_test_123';

      it('rejects a webhook with no x-signature header', async () => {
        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 't', MERCADOPAGO_WEBHOOK_SECRET: SECRET }),
        );

        await expect(
          mpGateway.parseWebhook({ action: 'order.processed', data: { id: 'ORD1' } }, {}, { 'data.id': 'ORD1' }),
        ).rejects.toThrow(/missing x-signature/i);
      });

      it('rejects a webhook with a tampered signature', async () => {
        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 't', MERCADOPAGO_WEBHOOK_SECRET: SECRET }),
        );
        const goodSig = signWebhook(SECRET, 'ORD1', 'req-1', '1700000000000');

        await expect(
          mpGateway.parseWebhook(
            { action: 'order.processed', data: { id: 'ORD1' } },
            { 'x-signature': goodSig.replace(/v1=.+$/, 'v1=deadbeef'), 'x-request-id': 'req-1' },
            { 'data.id': 'ORD1' },
          ),
        ).rejects.toThrow(/invalid mercadopago webhook signature/i);
      });

      it('accepts a correctly signed webhook and re-fetches the order for the authoritative status', async () => {
        const dataId = 'ORD01M28P44G5FG8RJPM579EH56FV';
        const requestId = 'req-real-1';
        const ts = '1700000000000';
        const validSignature = signWebhook(SECRET, dataId, requestId, ts);

        const fetchMock = jest.fn().mockResolvedValue(
          jsonResponse({
            id: dataId,
            status: 'processed',
            total_amount: '50.00',
            transactions: { payments: [{ status: 'processed' }] },
          }),
        );
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 't', MERCADOPAGO_WEBHOOK_SECRET: SECRET }),
        );

        const result = await mpGateway.parseWebhook(
          { action: 'order.processed', data: { id: dataId } },
          { 'x-signature': validSignature, 'x-request-id': requestId },
          { 'data.id': dataId, type: 'order' },
        );

        expect(fetchMock).toHaveBeenCalledWith(
          `https://api.mercadopago.com/v1/orders/${dataId}`,
          expect.objectContaining({ method: 'GET' }),
        );
        expect(result.status).toBe('CONFIRMED');
        expect(result.gatewayTransactionId).toBe(dataId);
        expect(result.amountCents).toBe(5000);
      });

      it('lower-cases data.id before building the manifest, per MercadoPago\'s own note', async () => {
        const upperDataId = 'ORD01M28P44G5FG8RJPM579EH56FV';
        const lowerDataId = upperDataId.toLowerCase();
        const requestId = 'req-case-1';
        const ts = '1700000000001';
        // Signed against the LOWER-cased id, exactly as MP's own docs say
        // the sender does -- proves our verifier lower-cases too.
        const validSignature = signWebhook(SECRET, lowerDataId, requestId, ts);

        global.fetch = jest.fn().mockResolvedValue(
          jsonResponse({ id: upperDataId, status: 'processed', transactions: { payments: [{ status: 'processed' }] } }),
        ) as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 't', MERCADOPAGO_WEBHOOK_SECRET: SECRET }),
        );

        const result = await mpGateway.parseWebhook(
          { action: 'order.processed', data: { id: upperDataId } },
          { 'x-signature': validSignature, 'x-request-id': requestId },
          { 'data.id': upperDataId, type: 'order' },
        );

        expect(result.status).toBe('CONFIRMED');
      });

      it('resolves a subscription webhook against GET /preapproval/:id', async () => {
        const dataId = 'preapproval-xyz';
        const requestId = 'req-sub-1';
        const ts = '1700000000002';
        const validSignature = signWebhook(SECRET, dataId, requestId, ts);

        const fetchMock = jest
          .fn()
          .mockResolvedValue(jsonResponse({ id: dataId, status: 'authorized' }));
        global.fetch = fetchMock as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ MERCADOPAGO_ACCESS_TOKEN: 't', MERCADOPAGO_WEBHOOK_SECRET: SECRET }),
        );

        const result = await mpGateway.parseWebhook(
          { action: 'subscription_preapproval.updated', data: { id: dataId } },
          { 'x-signature': validSignature, 'x-request-id': requestId },
          { 'data.id': dataId, type: 'subscription_preapproval' },
        );

        expect(fetchMock).toHaveBeenCalledWith(
          `https://api.mercadopago.com/preapproval/${dataId}`,
          expect.objectContaining({ method: 'GET' }),
        );
        expect(result.gatewaySubscriptionId).toBe(dataId);
        expect(result.status).toBe('CONFIRMED');
      });

      it('verifies a subscription webhook against MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET, a distinct secret from the donations app', async () => {
        const SUBSCRIPTIONS_SECRET = 'whsec_subscriptions_app_456';
        const dataId = 'preapproval-two-app';
        const requestId = 'req-two-app-1';
        const ts = '1700000000003';
        const signature = signWebhook(SUBSCRIPTIONS_SECRET, dataId, requestId, ts);

        global.fetch = jest
          .fn()
          .mockResolvedValue(jsonResponse({ id: dataId, status: 'authorized' })) as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({
            MERCADOPAGO_ACCESS_TOKEN: 't',
            MERCADOPAGO_WEBHOOK_SECRET: SECRET,
            MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET: SUBSCRIPTIONS_SECRET,
          }),
        );

        const result = await mpGateway.parseWebhook(
          { action: 'subscription_preapproval.updated', data: { id: dataId } },
          { 'x-signature': signature, 'x-request-id': requestId },
          { 'data.id': dataId, type: 'subscription_preapproval' },
        );

        expect(result.status).toBe('CONFIRMED');
      });

      it('rejects a subscription webhook signed with the donations app secret instead of the subscriptions app secret', async () => {
        const SUBSCRIPTIONS_SECRET = 'whsec_subscriptions_app_456';
        const dataId = 'preapproval-cross-app';
        const requestId = 'req-two-app-2';
        const ts = '1700000000004';
        // Signed with the DONATIONS secret, but this is a subscription
        // topic -- must be verified against the subscriptions secret.
        const wrongSignature = signWebhook(SECRET, dataId, requestId, ts);

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({
            MERCADOPAGO_ACCESS_TOKEN: 't',
            MERCADOPAGO_WEBHOOK_SECRET: SECRET,
            MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET: SUBSCRIPTIONS_SECRET,
          }),
        );

        await expect(
          mpGateway.parseWebhook(
            { action: 'subscription_preapproval.updated', data: { id: dataId } },
            { 'x-signature': wrongSignature, 'x-request-id': requestId },
            { 'data.id': dataId, type: 'subscription_preapproval' },
          ),
        ).rejects.toThrow(/invalid mercadopago webhook signature/i);
      });

      it('requires MERCADOPAGO_WEBHOOK_SECRET in production', async () => {
        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ NODE_ENV: 'production', MERCADOPAGO_ACCESS_TOKEN: 't' }),
        );

        await expect(
          mpGateway.parseWebhook({ action: 'order.processed', data: { id: 'ORD1' } }, {}, { 'data.id': 'ORD1' }),
        ).rejects.toThrow(/webhook secret is required in production/i);
      });

      it('skips signature verification outside production when no secret is configured (local/dev convenience)', async () => {
        global.fetch = jest.fn().mockResolvedValue(
          jsonResponse({ id: 'ORD1', status: 'processed', transactions: { payments: [{ status: 'processed' }] } }),
        ) as unknown as typeof fetch;

        const mpGateway = new MercadoPagoDonationGateway(
          configWith({ NODE_ENV: 'development', MERCADOPAGO_ACCESS_TOKEN: 't' }),
        );

        const result = await mpGateway.parseWebhook(
          { action: 'order.processed', data: { id: 'ORD1' } },
          {},
          { 'data.id': 'ORD1' },
        );

        expect(result.status).toBe('CONFIRMED');
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
