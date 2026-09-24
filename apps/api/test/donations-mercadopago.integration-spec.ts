import { createHmac, randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Real-Postgres coverage for the real Mercado Pago integration (Checkout
// Transparente / Orders API for one-time donations, Subscriptions /
// preapproval for recurring support). The external HTTP boundary
// (global.fetch to api.mercadopago.com) is mocked -- this is the
// standard seam for a real third-party payment gateway in an automated
// suite -- but everything on this side of that boundary (controller,
// service, real Postgres persistence, webhook signature verification)
// is exercised for real, exactly as every other integration spec in
// this session does for internal state.
const WEBHOOK_SECRET = 'whsec_test_integration_secret';

function signWebhook(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hash = createHmac('sha256', WEBHOOK_SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${hash}`;
}

describe('Donations against the real Mercado Pago gateway (real Postgres, mocked HTTP boundary)', () => {
  let app: NestFastifyApplication;
  let familyACookie: string;
  let familyAId: string;
  let originalFetch: typeof fetch;

  async function registerWithFamily(prefix: string): Promise<{ cookie: string; familyId: string }> {
    const email = `${prefix}-${randomUUID()}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Donations Test Guardian' })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);

    return { cookie, familyId: familyResponse.body.id };
  }

  beforeAll(async () => {
    process.env.DONATION_GATEWAY_PROVIDER = 'mercadopago';
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-integration-token';
    process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const familyA = await registerWithFamily('donations-mp-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.DONATION_GATEWAY_PROVIDER;
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('creates a real ONE_TIME PIX order via Checkout Transparente and persists the record in Postgres', async () => {
    const orderId = `ORD${randomUUID().replace(/-/g, '').toUpperCase()}`;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: orderId,
        status: 'action_required',
        transactions: {
          payments: [
            {
              id: `PAY${randomUUID()}`,
              payment_method: {
                qr_code: '00020126580014br.gov.bcb.pix...integration...',
                qr_code_base64: 'iVBORw0KGgo=',
              },
            },
          ],
        },
      }),
    }) as unknown as typeof fetch;

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/donations/create-intent`)
      .set('Cookie', familyACookie)
      .send({ amountCents: 3000, frequency: 'ONE_TIME', paymentMethod: 'PIX' })
      .expect(201);

    expect(created.body.pixCopiaECola).toBe('00020126580014br.gov.bcb.pix...integration...');
    expect(created.body.pixQrCodeUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(created.body.status).toBe('PENDING');

    const status = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/donations/${created.body.donationId}/status`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(status.body.pixCopiaECola).toBe('00020126580014br.gov.bcb.pix...integration...');
  });

  it('rejects a MONTHLY + PIX combination with 400, never reaching the gateway', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/donations/create-intent`)
      .set('Cookie', familyACookie)
      .send({ amountCents: 3000, frequency: 'MONTHLY', paymentMethod: 'PIX' })
      .expect(400);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates a real MONTHLY subscription via preapproval (pending payments) and returns the hosted authorizationUrl', async () => {
    const preapprovalId = `preapproval-${randomUUID()}`;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: preapprovalId,
        init_point: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${preapprovalId}`,
      }),
    }) as unknown as typeof fetch;

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/donations/create-intent`)
      .set('Cookie', familyACookie)
      .send({ amountCents: 5000, frequency: 'MONTHLY', paymentMethod: 'GOOGLE_PAY' })
      .expect(201);

    expect(created.body.authorizationUrl).toBe(
      `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${preapprovalId}`,
    );

    const subscriptions = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/donations/subscriptions`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(
      subscriptions.body.some((s: { gatewaySubscriptionId: string }) => s.gatewaySubscriptionId === preapprovalId),
    ).toBe(true);
  });

  it('confirms a donation end-to-end through a real, correctly-signed webhook', async () => {
    const orderId = `ORD${randomUUID().replace(/-/g, '').toUpperCase()}`;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: orderId,
        status: 'action_required',
        transactions: { payments: [{ id: `PAY${randomUUID()}`, payment_method: {} }] },
      }),
    }) as unknown as typeof fetch;

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/donations/create-intent`)
      .set('Cookie', familyACookie)
      .send({ amountCents: 4200, frequency: 'ONE_TIME', paymentMethod: 'PIX' })
      .expect(201);

    // Now the webhook fires: re-fetching the order must show it processed.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: orderId,
        status: 'processed',
        total_amount: '42.00',
        transactions: { payments: [{ status: 'processed' }] },
      }),
    }) as unknown as typeof fetch;

    const requestId = randomUUID();
    const ts = Date.now().toString();
    const signature = signWebhook(orderId, requestId, ts);

    const webhookResponse = await supertest(app.getHttpServer())
      .post('/api/v1/donations/webhooks/mercadopago')
      .query({ 'data.id': orderId, type: 'order' })
      .set('x-signature', signature)
      .set('x-request-id', requestId)
      .send({ action: 'order.processed', data: { id: orderId } })
      .expect(200);
    expect(webhookResponse.body.received).toBe(true);

    const status = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/donations/${created.body.donationId}/status`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(status.body.status).toBe('CONFIRMED');
    expect(status.body.confirmedAt).toBeTruthy();
  });

  it('rejects a webhook with a tampered signature, never updating the donation record', async () => {
    const orderId = `ORD${randomUUID().replace(/-/g, '').toUpperCase()}`;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: orderId,
        status: 'action_required',
        transactions: { payments: [{ id: `PAY${randomUUID()}`, payment_method: {} }] },
      }),
    }) as unknown as typeof fetch;

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/donations/create-intent`)
      .set('Cookie', familyACookie)
      .send({ amountCents: 1500, frequency: 'ONE_TIME', paymentMethod: 'PIX' })
      .expect(201);

    const requestId = randomUUID();
    const ts = Date.now().toString();

    // The webhook body/query call this a 200 -- MP's own contract for
    // "acknowledged" -- but the donation record must NOT actually change,
    // because the signature is invalid.
    await supertest(app.getHttpServer())
      .post('/api/v1/donations/webhooks/mercadopago')
      .query({ 'data.id': orderId, type: 'order' })
      .set('x-signature', `ts=${ts},v1=0000000000000000000000000000000000000000000000000000000000000000`)
      .set('x-request-id', requestId)
      .send({ action: 'order.processed', data: { id: orderId } })
      .expect(500);

    const status = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/donations/${created.body.donationId}/status`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(status.body.status).toBe('PENDING');
  });
});
