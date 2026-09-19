import { Injectable } from '@nestjs/common';
import type {
  CreateOneTimeIntentParams,
  CreateOneTimeIntentResult,
  CreateSubscriptionIntentParams,
  CreateSubscriptionIntentResult,
  DonationGateway,
  WebhookEventResult,
} from './donation-gateway.interface.js';

@Injectable()
export class MockDonationGateway implements DonationGateway {
  async createOneTimeIntent(
    params: CreateOneTimeIntentParams,
  ): Promise<CreateOneTimeIntentResult> {
    const gatewayTransactionId = `mock_tx_${params.donationId}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    if (params.paymentMethod === 'PIX') {
      const formattedAmount = (params.amountCents / 100).toFixed(2);
      const pixCopiaECola = `00020126580014br.gov.bcb.pix0136mock-donation-${params.donationId}5204000053039865405${formattedAmount}5802BR5916Aletheia Project6009Sao Paulo62070503***6304ABCD`;
      const pixQrCodeUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="white"/><text x="10" y="75" font-family="sans-serif" font-size="10" fill="black">PIX Mock ${params.donationId}</text></svg>`;

      return {
        gatewayTransactionId,
        pixQrCodeUrl,
        pixCopiaECola,
        expiresAt,
      };
    }

    if (params.paymentMethod === 'GOOGLE_PAY') {
      return {
        gatewayTransactionId,
        clientSecret: `mock_gpay_token_${params.donationId}`,
        expiresAt,
      };
    }

    return {
      gatewayTransactionId,
      clientSecret: `mock_card_token_${params.donationId}`,
      expiresAt,
    };
  }

  async createSubscriptionIntent(
    params: CreateSubscriptionIntentParams,
  ): Promise<CreateSubscriptionIntentResult> {
    const gatewaySubscriptionId = `mock_sub_${params.subscriptionId}`;
    const nextBillingAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const clientSecret =
      params.paymentMethod === 'PIX'
        ? undefined
        : `mock_sub_token_${params.subscriptionId}`;

    return {
      gatewaySubscriptionId,
      clientSecret,
      nextBillingAt,
    };
  }

  async cancelSubscription(_gatewaySubscriptionId: string): Promise<void> {
    return Promise.resolve();
  }

  async parseWebhook(
    payload: unknown,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEventResult> {
    const raw =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};

    const eventId =
      typeof raw.eventId === 'string'
        ? raw.eventId
        : typeof raw.id === 'string'
          ? raw.id
          : `mock_evt_${Date.now()}`;

    const eventType =
      typeof raw.event === 'string'
        ? raw.event
        : typeof raw.action === 'string'
          ? raw.action
          : 'payment.updated';

    const status =
      raw.status === 'CONFIRMED' ||
      raw.status === 'FAILED' ||
      raw.status === 'CANCELLED'
        ? raw.status
        : 'CONFIRMED';

    const gatewayTransactionId =
      typeof raw.gatewayTransactionId === 'string'
        ? raw.gatewayTransactionId
        : undefined;

    const gatewaySubscriptionId =
      typeof raw.gatewaySubscriptionId === 'string'
        ? raw.gatewaySubscriptionId
        : undefined;

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
