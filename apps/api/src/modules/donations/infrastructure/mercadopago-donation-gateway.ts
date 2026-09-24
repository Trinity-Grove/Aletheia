import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import type {
  CreateOneTimeIntentParams,
  CreateOneTimeIntentResult,
  CreateSubscriptionIntentParams,
  CreateSubscriptionIntentResult,
  DonationGateway,
  WebhookEventResult,
} from './donation-gateway.interface.js';

const MERCADOPAGO_API_BASE = 'https://api.mercadopago.com';

// Real Mercado Pago integration (issue: "assinatura com Mercado Pago e
// checkout transparente para doações"). Two products, deliberately on
// TWO SEPARATE Mercado Pago applications (own credentials, own webhook
// secret each) -- the donations app ("aletheiaphos") handles one-time
// PIX; a second, dedicated application handles recurring Subscriptions.
// Each operation below picks the token/secret pair for the app it
// actually belongs to; nothing here ever mixes the two.
//
// - One-time donations -> Checkout Transparente via the Orders API
//   (POST /v1/orders), on the donations app. This is Mercado Pago's
//   current-generation transparent-checkout endpoint; the older
//   /v1/payments endpoint still works but is feature-frozen
//   (security/stability fixes only) per MP's own migration notice, so a
//   new integration targets Orders.
// - Recurring monthly support -> Subscriptions (POST /preapproval), on
//   the subscriptions app, using the "pending payments" variant
//   (`status: "pending"`, no `card_token_id`): this codebase collects no
//   card token client-side (no Bricks/CardForm), so the payer completes
//   their card details on Mercado Pago's own hosted page.
//   `createSubscriptionIntent` returns that hosted-checkout link so the
//   frontend can redirect there.
//
// Webhook signature verification follows MP's documented manifest
// exactly (see parseWebhook below) -- this is the one part of an
// integration where guessing the format silently breaks security, so
// every literal string here is transcribed from MP's own notifications
// docs, not reconstructed from memory. Which secret to verify against is
// picked by the notification's own topic/type (subscription_* -> the
// subscriptions app's secret, everything else -> the donations app's),
// never by which URL path the request arrived on -- keeps the two apps'
// credentials correctly scoped even if both webhooks ever shared one
// endpoint.
@Injectable()
export class MercadoPagoDonationGateway implements DonationGateway {
  private readonly logger = new Logger(MercadoPagoDonationGateway.name);
  private readonly donationsAccessToken?: string | undefined;
  private readonly donationsWebhookSecret?: string | undefined;
  // Falls back to the donations app's credentials when unset, so a
  // single-application local/test setup (one token for everything)
  // keeps working without every caller having to configure two apps.
  private readonly subscriptionsAccessToken?: string | undefined;
  private readonly subscriptionsWebhookSecret?: string | undefined;
  private readonly isProduction: boolean;

  constructor(@Optional() private readonly config?: ConfigService) {
    this.donationsAccessToken =
      this.config?.get('MERCADOPAGO_ACCESS_TOKEN') ??
      process.env['MERCADOPAGO_ACCESS_TOKEN'];
    this.donationsWebhookSecret =
      this.config?.get('MERCADOPAGO_WEBHOOK_SECRET') ??
      process.env['MERCADOPAGO_WEBHOOK_SECRET'];
    this.subscriptionsAccessToken =
      this.config?.get('MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN') ??
      process.env['MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN'] ??
      this.donationsAccessToken;
    this.subscriptionsWebhookSecret =
      this.config?.get('MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET') ??
      process.env['MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET'] ??
      this.donationsWebhookSecret;
    const nodeEnv =
      this.config?.get('NODE_ENV') ??
      process.env['NODE_ENV'] ??
      'development';
    this.isProduction = nodeEnv === 'production';
  }

  private ensureConfigured(accessToken?: string, envVarName = 'MERCADOPAGO_ACCESS_TOKEN'): void {
    if (this.isProduction && !accessToken) {
      throw new Error(
        `MercadoPago access token is required in production environment (${envVarName})`,
      );
    }
  }

  private async request<T>(
    path: string,
    init: {
      method: 'POST' | 'PUT' | 'GET';
      body?: unknown;
      idempotencyKey?: string;
      accessToken?: string | undefined;
    },
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${init.accessToken ?? this.donationsAccessToken ?? ''}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (init.idempotencyKey) {
      headers['X-Idempotency-Key'] = init.idempotencyKey;
    }

    const response = await fetch(`${MERCADOPAGO_API_BASE}${path}`, {
      method: init.method,
      headers,
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      this.logger.error(
        `MercadoPago ${init.method} ${path} failed: ${response.status} ${JSON.stringify(raw)}`,
      );
      throw new Error(
        `MercadoPago request failed (${response.status}): ${
          typeof raw['message'] === 'string' ? raw['message'] : 'unknown error'
        }`,
      );
    }

    return raw as T;
  }

  async createOneTimeIntent(
    params: CreateOneTimeIntentParams,
  ): Promise<CreateOneTimeIntentResult> {
    this.ensureConfigured(this.donationsAccessToken, 'MERCADOPAGO_ACCESS_TOKEN');

    const totalAmount = (params.amountCents / 100).toFixed(2);
    const paymentMethodId = params.paymentMethod === 'PIX' ? 'pix' : undefined;

    const body: Record<string, unknown> = {
      type: 'online',
      total_amount: totalAmount,
      external_reference: params.donationId,
      processing_mode: 'automatic',
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: paymentMethodId
              ? { id: paymentMethodId, type: 'bank_transfer' }
              : { type: 'credit_card' },
          },
        ],
      },
      // `payer.email` is required for PIX on this endpoint -- confirmed
      // live in production twice: omitting `payer` entirely still gets
      // rejected ("'$.payer' - minimum 1 properties allowed, but found 0
      // properties" -- Mercado Pago treats a missing `payer` the same as
      // an empty one for this validation). DonationsService already
      // resolves a real fallback (the logged-in guardian's own account
      // email) before calling this gateway; the synthetic address below
      // is only the last-resort safety net for the rare case that lookup
      // itself comes back empty -- it must never be the common path, but
      // PIX creation must never 500 for want of an email either.
      payer: { email: params.donorEmail ?? `donation+${params.donationId}@aletheiaphos.app` },
    };

    const order = await this.request<{
      id: string;
      status: string;
      transactions?: {
        payments?: Array<{
          id: string;
          payment_method?: { qr_code?: string; qr_code_base64?: string };
        }>;
      };
    }>('/v1/orders', {
      method: 'POST',
      body,
      idempotencyKey: params.donationId,
      accessToken: this.donationsAccessToken,
    });

    const payment = order.transactions?.payments?.[0];
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return {
      gatewayTransactionId: order.id,
      ...(payment?.payment_method?.qr_code
        ? { pixCopiaECola: payment.payment_method.qr_code }
        : {}),
      ...(payment?.payment_method?.qr_code_base64
        ? { pixQrCodeUrl: `data:image/png;base64,${payment.payment_method.qr_code_base64}` }
        : {}),
      expiresAt,
    };
  }

  async createSubscriptionIntent(
    params: CreateSubscriptionIntentParams,
  ): Promise<CreateSubscriptionIntentResult> {
    this.ensureConfigured(this.subscriptionsAccessToken, 'MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN');

    const body: Record<string, unknown> = {
      reason: 'Apoio comunitário mensal - Aletheia',
      external_reference: params.subscriptionId,
      ...(params.donorEmail ? { payer_email: params.donorEmail } : {}),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: params.amountCents / 100,
        currency_id: 'BRL',
      },
      // "Pending payments" subscription (issue: no card_token_id collected
      // client-side here) -- MP returns a hosted link the payer visits to
      // pick their own payment method and authorize the recurring charge.
      status: 'pending',
    };

    const preapproval = await this.request<{ id: string; init_point?: string }>(
      '/preapproval',
      {
        method: 'POST',
        body,
        idempotencyKey: params.subscriptionId,
        accessToken: this.subscriptionsAccessToken,
      },
    );

    return {
      gatewaySubscriptionId: preapproval.id,
      ...(preapproval.init_point ? { authorizationUrl: preapproval.init_point } : {}),
    };
  }

  async cancelSubscription(gatewaySubscriptionId: string): Promise<void> {
    this.ensureConfigured(this.subscriptionsAccessToken, 'MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN');
    await this.request(`/preapproval/${gatewaySubscriptionId}`, {
      method: 'PUT',
      body: { status: 'cancelled' },
      accessToken: this.subscriptionsAccessToken,
    });
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
    query?: Record<string, string | undefined>,
  ): Promise<WebhookEventResult> {
    const raw =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

    const rawData =
      raw['data'] && typeof raw['data'] === 'object'
        ? (raw['data'] as Record<string, unknown>)
        : undefined;

    const eventId =
      typeof raw['id'] === 'string' || typeof raw['id'] === 'number'
        ? String(raw['id'])
        : `mp_evt_${randomUUID()}`;

    // `query.type` doubles as the topic name Mercado Pago sends
    // ("order", "payment", "subscription_preapproval", ...) -- read
    // before the action/type fallback below so a subscription
    // notification is recognized even when its body only has `action`.
    const eventType =
      typeof query?.['type'] === 'string' && query['type'].startsWith('subscription')
        ? query['type']
        : typeof raw['action'] === 'string'
          ? raw['action']
          : typeof raw['type'] === 'string'
            ? raw['type']
            : 'payment.updated';

    this.verifySignature(eventType, headers, query);

    const resourceId =
      typeof query?.['data.id'] === 'string'
        ? query['data.id']
        : rawData && typeof rawData['id'] === 'string'
          ? rawData['id']
          : undefined;

    // The webhook only tells us *something* changed; the authoritative
    // status is re-fetched from MP directly (never trusted from the
    // notification body alone) -- this doubles as tamper-resistance on
    // top of the signature check above.
    const resolved = resourceId ? await this.resolveStatus(eventType, resourceId) : undefined;

    return {
      eventId,
      eventType,
      gatewayTransactionId: resolved?.kind === 'order' ? resourceId : undefined,
      gatewaySubscriptionId: resolved?.kind === 'subscription' ? resourceId : undefined,
      status: resolved?.status ?? 'FAILED',
      ...(resolved?.kind === 'order' && resolved.amountCents !== undefined
        ? { amountCents: resolved.amountCents }
        : {}),
      ...(resolved?.paidAt ? { paidAt: resolved.paidAt } : {}),
    };
  }

  private async resolveStatus(
    eventType: string,
    resourceId: string,
  ): Promise<
    | { kind: 'order'; status: WebhookEventResult['status']; amountCents?: number; paidAt?: Date }
    | { kind: 'subscription'; status: WebhookEventResult['status']; paidAt?: Date }
    | undefined
  > {
    // Covers all three subscription topics this app subscribes to
    // (subscription_preapproval, subscription_preapproval_plan,
    // subscription_authorized_payment) -- all resolve against the same
    // /preapproval/{id} endpoint, since a plan or authorized-payment
    // notification's `data.id` is still the subscription's own id.
    const isSubscriptionEvent = eventType.startsWith('subscription');
    try {
      if (isSubscriptionEvent) {
        this.ensureConfigured(this.subscriptionsAccessToken, 'MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN');
        const sub = await this.request<{ status: string }>(`/preapproval/${resourceId}`, {
          method: 'GET',
          accessToken: this.subscriptionsAccessToken,
        });
        return { kind: 'subscription', status: this.mapStatus(sub.status) };
      }

      this.ensureConfigured(this.donationsAccessToken, 'MERCADOPAGO_ACCESS_TOKEN');
      const order = await this.request<{
        status: string;
        total_amount?: string;
        transactions?: { payments?: Array<{ status?: string }> };
      }>(`/v1/orders/${resourceId}`, { method: 'GET', accessToken: this.donationsAccessToken });
      const paymentStatus = order.transactions?.payments?.[0]?.status ?? order.status;
      return {
        kind: 'order',
        status: this.mapStatus(paymentStatus),
        ...(order.total_amount
          ? { amountCents: Math.round(parseFloat(order.total_amount) * 100) }
          : {}),
        ...(this.mapStatus(paymentStatus) === 'CONFIRMED' ? { paidAt: new Date() } : {}),
      };
    } catch (error) {
      this.logger.error(`Failed to resolve webhook resource ${resourceId}: ${String(error)}`);
      return undefined;
    }
  }

  private mapStatus(raw: string): WebhookEventResult['status'] {
    if (raw === 'processed' || raw === 'approved' || raw === 'authorized') return 'CONFIRMED';
    if (raw === 'cancelled') return 'CANCELLED';
    return 'FAILED';
  }

  // Verbatim manifest from MP's own notifications docs:
  //   id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  // -- data.id from the query string (lower-cased), x-request-id and the
  // `ts` half of `x-signature` from their respective headers. Any part
  // missing from the notification is dropped from the manifest, per MP's
  // own note, rather than treated as an empty string.
  private verifySignature(
    eventType: string,
    headers: Record<string, string | string[] | undefined>,
    query?: Record<string, string | undefined>,
  ): void {
    const isSubscriptionEvent = eventType.startsWith('subscription');
    const secret = isSubscriptionEvent ? this.subscriptionsWebhookSecret : this.donationsWebhookSecret;
    const envVarName = isSubscriptionEvent
      ? 'MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET'
      : 'MERCADOPAGO_WEBHOOK_SECRET';

    if (!secret) {
      if (this.isProduction) {
        throw new Error(`MercadoPago webhook secret is required in production (${envVarName})`);
      }
      return;
    }

    const xSignature = this.headerValue(headers['x-signature']);
    const xRequestId = this.headerValue(headers['x-request-id']);
    const dataId = query?.['data.id']?.toLowerCase();

    if (!xSignature) {
      throw new Error('Missing x-signature header on MercadoPago webhook.');
    }

    let ts: string | undefined;
    let hash: string | undefined;
    for (const part of xSignature.split(',')) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      throw new Error('Malformed x-signature header on MercadoPago webhook.');
    }

    const manifestParts: string[] = [];
    if (dataId) manifestParts.push(`id:${dataId}`);
    if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
    manifestParts.push(`ts:${ts}`);
    const manifest = manifestParts.join(';') + ';';

    const computed = createHmac('sha256', secret).update(manifest).digest('hex');

    const computedBuffer = Buffer.from(computed, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const isValid =
      computedBuffer.length === hashBuffer.length &&
      timingSafeEqual(computedBuffer, hashBuffer);

    if (!isValid) {
      throw new Error('Invalid MercadoPago webhook signature.');
    }
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
