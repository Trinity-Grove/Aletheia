import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import type {
  CreateOneTimeIntentParams,
  CreateOneTimeIntentResult,
  CreateSubscriptionIntentParams,
  CreateSubscriptionIntentResult,
  DonationGateway,
  WebhookEventResult,
} from './donation-gateway.interface.js';

@Injectable()
export class MercadoPagoDonationGateway implements DonationGateway {
  private readonly accessToken?: string | undefined;
  private readonly isProduction: boolean;

  constructor(@Optional() private readonly config?: ConfigService) {
    this.accessToken =
      this.config?.get('MERCADOPAGO_ACCESS_TOKEN') ??
      process.env['MERCADOPAGO_ACCESS_TOKEN'];
    const nodeEnv =
      this.config?.get('NODE_ENV') ??
      process.env['NODE_ENV'] ??
      'development';
    this.isProduction = nodeEnv === 'production';
  }

  private ensureConfigured(): void {
    if (this.isProduction && !this.accessToken) {
      throw new Error(
        'MercadoPago access token is required in production environment (MERCADOPAGO_ACCESS_TOKEN)',
      );
    }
  }

  async createOneTimeIntent(
    params: CreateOneTimeIntentParams,
  ): Promise<CreateOneTimeIntentResult> {
    this.ensureConfigured();

    const gatewayTransactionId = `mp_sandbox_tx_${params.donationId}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    if (params.paymentMethod === 'PIX') {
      const formattedAmount = (params.amountCents / 100).toFixed(2);
      const pixCopiaECola = `00020126580014br.gov.bcb.pix0136mp-sandbox-${params.donationId}5204000053039865405${formattedAmount}5802BR5916Aletheia Project6009Sao Paulo62070503***6304ABCD`;
      const pixQrCodeUrl = `https://mercadopago.com/sandbox/qr/${params.donationId}`;

      return {
        gatewayTransactionId,
        pixQrCodeUrl,
        pixCopiaECola,
        expiresAt,
      };
    }

    return {
      gatewayTransactionId,
      clientSecret: `mp_sandbox_token_${params.donationId}`,
      expiresAt,
    };
  }

  async createSubscriptionIntent(
    params: CreateSubscriptionIntentParams,
  ): Promise<CreateSubscriptionIntentResult> {
    this.ensureConfigured();

    const gatewaySubscriptionId = `mp_sandbox_sub_${params.subscriptionId}`;
    const nextBillingAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      gatewaySubscriptionId,
      clientSecret: `mp_sandbox_sub_token_${params.subscriptionId}`,
      nextBillingAt,
    };
  }

  async cancelSubscription(_gatewaySubscriptionId: string): Promise<void> {
    this.ensureConfigured();
    return Promise.resolve();
  }

  async parseWebhook(
    payload: unknown,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEventResult> {
    this.ensureConfigured();

    const raw =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};

    const rawData =
      raw.data && typeof raw.data === 'object'
        ? (raw.data as Record<string, unknown>)
        : undefined;

    const eventId =
      typeof raw.eventId === 'string'
        ? raw.eventId
        : typeof raw.id === 'string'
          ? raw.id
          : `mp_evt_${Date.now()}`;

    const eventType =
      typeof raw.action === 'string'
        ? raw.action
        : typeof raw.event === 'string'
          ? raw.event
          : typeof raw.type === 'string'
            ? raw.type
            : 'payment.updated';

    const gatewayTransactionId =
      typeof raw.gatewayTransactionId === 'string'
        ? raw.gatewayTransactionId
        : rawData && typeof rawData.id === 'string'
          ? rawData.id
          : undefined;

    const gatewaySubscriptionId =
      typeof raw.gatewaySubscriptionId === 'string'
        ? raw.gatewaySubscriptionId
        : undefined;

    const status =
      raw.status === 'CONFIRMED' ||
      raw.status === 'FAILED' ||
      raw.status === 'CANCELLED'
        ? raw.status
        : 'CONFIRMED';

    const amountCents =
      typeof raw.amountCents === 'number' ? raw.amountCents : undefined;

    const paidAt =
      typeof raw.paidAt === 'string'
        ? new Date(raw.paidAt)
        : status === 'CONFIRMED'
          ? new Date()
          : undefined;

    return {
      eventId,
      eventType,
      gatewayTransactionId,
      gatewaySubscriptionId,
      status,
      amountCents,
      paidAt,
    };
  }
}
